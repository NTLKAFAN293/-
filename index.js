require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits, ChannelType } = require('discord.js');
const Database = require('better-sqlite3');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const ALLOWED_GUILD_ID = '1375876425416052799';

const db = new Database('bot.db');

// إنشاء جدول إعدادات التكتات
db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_system1 (
        guild_id TEXT PRIMARY KEY,
        support_role_id TEXT,
        ticket_counter INTEGER DEFAULT 0,
        category_id TEXT
    );

    CREATE TABLE IF NOT EXISTS ticket_system2 (
        guild_id TEXT PRIMARY KEY,
        support_role_id TEXT,
        ticket_counter INTEGER DEFAULT 0,
        category_id TEXT
    );
`);

// دالة لتحويل النص إلى طويل
function elongateText(text) {
    return text.split('').join('*');
}

const commands = [
    new SlashCommandBuilder()
        .setName('تكت-اعضاء')
        .setDescription('نــظــام تــكــتــات الأعــضــاء')
        .addChannelOption(option =>
            option.setName('الروم')
                .setDescription('الــروم الــذي ســيــرســل فــيــه الإيــمــبــد')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('الكاتيجوري')
                .setDescription('الــكــاتــيــجــوري الــذي ســتــفــتــح فــيــه الــتــكــتــات')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('العنوان')
                .setDescription('عــنــوان الإيــمــبــد')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('الوصف')
                .setDescription('وصــف الإيــمــبــد')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('رسالة_الترحيب')
                .setDescription('رســالــة الــتــرحــيــب فــي الــتــكــت')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('الصورة')
                .setDescription('رابــط الــصــورة (اخــتــيــاري)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('رتبة-دعم-اعضاء')
        .setDescription('تــحــديــد رتــبــة الــدعــم لــتــكــتــات الأعــضــاء')
        .addRoleOption(option =>
            option.setName('الرتبة')
                .setDescription('رتــبــة الــدعــم')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('تكت-ثاني')
        .setDescription('نــظــام تــكــتــات ثــانــي')
        .addChannelOption(option =>
            option.setName('الروم')
                .setDescription('الــروم الــذي ســيــرســل فــيــه الإيــمــبــد')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('الكاتيجوري')
                .setDescription('الــكــاتــيــجــوري الــذي ســتــفــتــح فــيــه الــتــكــتــات')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('العنوان')
                .setDescription('عــنــوان الإيــمــبــد')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('الوصف')
                .setDescription('وصــف الإيــمــبــد')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('رسالة_الترحيب')
                .setDescription('رســالــة الــتــرحــيــب فــي الــتــكــت')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('الصورة')
                .setDescription('رابــط الــصــورة (اخــتــيــاري)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('رتبة-دعم-ثاني')
        .setDescription('تــحــديــد رتــبــة الــدعــم لــلــنــظــام الــثــانــي')
        .addRoleOption(option =>
            option.setName('الرتبة')
                .setDescription('رتــبــة الــدعــم')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
];

client.once('ready', async () => {
    console.log(`بــوت التكتات جــاهــز: ${client.user.tag}`);
    
    try {
        const guild = await client.guilds.fetch(ALLOWED_GUILD_ID);
        await guild.commands.set(commands);
        console.log('أوامــر الــتــكــتــات تــم تــســجــيــلــهــا بــنــجــاح');
    } catch (error) {
        console.error('خــطــأ فــي تــســجــيــل الأوامــر:', error);
    }
});

client.on('guildCreate', async (guild) => {
    if (guild.id !== ALLOWED_GUILD_ID) {
        try {
            const owner = await guild.fetchOwner();
            await owner.send('تــحــاول تــســرق الــبــوت يــســراق دز مــالــك دخــل');
        } catch (error) {
            console.error('مــا قــدرت ارســل رســالــة لــصــاحــب الــســيــرفــر:', error);
        }
        await guild.leave();
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        // أمر تكت أعضاء
        if (commandName === 'تكت-اعضاء') {
            const channel = interaction.options.getChannel('الروم');
            const category = interaction.options.getChannel('الكاتيجوري');
            const title = interaction.options.getString('العنوان');
            const description = interaction.options.getString('الوصف');
            const welcomeMsg = interaction.options.getString('رسالة_الترحيب');
            const image = interaction.options.getString('الصورة');

            // تحويل النصوص إلى طويلة
            const elongatedTitle = elongateText(title);
            const elongatedDesc = elongateText(description);

            try {
                const embed = new EmbedBuilder()
                    .setTitle(elongatedTitle)
                    .setDescription(elongatedDesc)
                    .setColor('#5865F2');

                if (image) {
                    embed.setImage(image);
                }

                const button = new ButtonBuilder()
                    .setCustomId('open_ticket_system1')
                    .setLabel('فــتــح تــكــت')
                    .setStyle(ButtonStyle.Primary);

                const row = new ActionRowBuilder().addComponents(button);

                await channel.send({ embeds: [embed], components: [row] });

                // حفظ رسالة الترحيب والكاتيجوري
                const stmt = db.prepare('INSERT OR REPLACE INTO ticket_system1 (guild_id, support_role_id, ticket_counter, category_id) VALUES (?, ?, COALESCE((SELECT ticket_counter FROM ticket_system1 WHERE guild_id = ?), 0), ?)');
                stmt.run(interaction.guildId, null, interaction.guildId, category.id);

                await interaction.reply({ content: `تــم إرســال نــظــام الــتــكــتــات بــنــجــاح!\n\nرســالــة الــتــرحــيــب: ${elongateText(welcomeMsg)}`, ephemeral: true });
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'صــار خــطــأ', ephemeral: true });
            }
        }

        // أمر رتبة دعم أعضاء
        if (commandName === 'رتبة-دعم-اعضاء') {
            const role = interaction.options.getRole('الرتبة');

            try {
                const stmt = db.prepare('INSERT OR REPLACE INTO ticket_system1 (guild_id, support_role_id, ticket_counter, category_id) VALUES (?, ?, COALESCE((SELECT ticket_counter FROM ticket_system1 WHERE guild_id = ?), 0), COALESCE((SELECT category_id FROM ticket_system1 WHERE guild_id = ?), NULL))');
                stmt.run(interaction.guildId, role.id, interaction.guildId, interaction.guildId);

                await interaction.reply({ content: `تــم تــحــديــد <@&${role.id}> كــرتــبــة دعــم`, ephemeral: true });
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'صــار خــطــأ', ephemeral: true });
            }
        }

        // أمر تكت ثاني
        if (commandName === 'تكت-ثاني') {
            const channel = interaction.options.getChannel('الروم');
            const category = interaction.options.getChannel('الكاتيجوري');
            const title = interaction.options.getString('العنوان');
            const description = interaction.options.getString('الوصف');
            const welcomeMsg = interaction.options.getString('رسالة_الترحيب');
            const image = interaction.options.getString('الصورة');

            // تحويل النصوص إلى طويلة
            const elongatedTitle = elongateText(title);
            const elongatedDesc = elongateText(description);

            try {
                const embed = new EmbedBuilder()
                    .setTitle(elongatedTitle)
                    .setDescription(elongatedDesc)
                    .setColor('#5865F2');

                if (image) {
                    embed.setImage(image);
                }

                const button = new ButtonBuilder()
                    .setCustomId('open_ticket_system2')
                    .setLabel('فــتــح تــكــت')
                    .setStyle(ButtonStyle.Primary);

                const row = new ActionRowBuilder().addComponents(button);

                await channel.send({ embeds: [embed], components: [row] });

                // حفظ رسالة الترحيب والكاتيجوري
                const stmt = db.prepare('INSERT OR REPLACE INTO ticket_system2 (guild_id, support_role_id, ticket_counter, category_id) VALUES (?, ?, COALESCE((SELECT ticket_counter FROM ticket_system2 WHERE guild_id = ?), 0), ?)');
                stmt.run(interaction.guildId, null, interaction.guildId, category.id);

                await interaction.reply({ content: `تــم إرســال نــظــام الــتــكــتــات بــنــجــاح!\n\nرســالــة الــتــرحــيــب: ${elongateText(welcomeMsg)}`, ephemeral: true });
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'صــار خــطــأ', ephemeral: true });
            }
        }

        // أمر رتبة دعم ثاني
        if (commandName === 'رتبة-دعم-ثاني') {
            const role = interaction.options.getRole('الرتبة');

            try {
                const stmt = db.prepare('INSERT OR REPLACE INTO ticket_system2 (guild_id, support_role_id, ticket_counter, category_id) VALUES (?, ?, COALESCE((SELECT ticket_counter FROM ticket_system2 WHERE guild_id = ?), 0), COALESCE((SELECT category_id FROM ticket_system2 WHERE guild_id = ?), NULL))');
                stmt.run(interaction.guildId, role.id, interaction.guildId, interaction.guildId);

                await interaction.reply({ content: `تــم تــحــديــد <@&${role.id}> كــرتــبــة دعــم`, ephemeral: true });
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'صــار خــطــأ', ephemeral: true });
            }
        }
    }

    if (interaction.isButton()) {
        // فتح تكت للنظام الأول
        if (interaction.customId === 'open_ticket_system1') {
            const stmt = db.prepare('SELECT * FROM ticket_system1 WHERE guild_id = ?');
            const settings = stmt.get(interaction.guildId);

            if (!settings || !settings.support_role_id) {
                return interaction.reply({ content: 'لــم يــتــم تــحــديــد رتــبــة الــدعــم بــعــد', ephemeral: true });
            }

            try {
                const updateStmt = db.prepare('UPDATE ticket_system1 SET ticket_counter = ticket_counter + 1 WHERE guild_id = ?');
                updateStmt.run(interaction.guildId);

                const counterStmt = db.prepare('SELECT ticket_counter FROM ticket_system1 WHERE guild_id = ?');
                const counter = counterStmt.get(interaction.guildId).ticket_counter;

                const ticketChannel = await interaction.guild.channels.create({
                    name: `ticket-${counter}`,
                    type: ChannelType.GuildText,
                    parent: settings.category_id || null,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: interaction.user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                        },
                        {
                            id: settings.support_role_id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                        }
                    ]
                });

                const welcomeEmbed = new EmbedBuilder()
                    .setDescription(`مــرحــبــاً <@${interaction.user.id}>!\nفــريــق الــدعــم ســيــرد عــلــيــك قــريــبــاً`)
                    .setColor('#5865F2');

                const closeButton = new ButtonBuilder()
                    .setCustomId(`close_ticket_system1_${ticketChannel.id}_${interaction.user.id}`)
                    .setLabel('قــفــل')
                    .setStyle(ButtonStyle.Danger);

                const row = new ActionRowBuilder().addComponents(closeButton);

                await ticketChannel.send({ embeds: [welcomeEmbed], components: [row] });
                await interaction.reply({ content: `تــم فــتــح تــكــت: <#${ticketChannel.id}>`, ephemeral: true });
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'صــار خــطــأ', ephemeral: true });
            }
        }

        // فتح تكت للنظام الثاني
        if (interaction.customId === 'open_ticket_system2') {
            const stmt = db.prepare('SELECT * FROM ticket_system2 WHERE guild_id = ?');
            const settings = stmt.get(interaction.guildId);

            if (!settings || !settings.support_role_id) {
                return interaction.reply({ content: 'لــم يــتــم تــحــديــد رتــبــة الــدعــم بــعــد', ephemeral: true });
            }

            try {
                const updateStmt = db.prepare('UPDATE ticket_system2 SET ticket_counter = ticket_counter + 1 WHERE guild_id = ?');
                updateStmt.run(interaction.guildId);

                const counterStmt = db.prepare('SELECT ticket_counter FROM ticket_system2 WHERE guild_id = ?');
                const counter = counterStmt.get(interaction.guildId).ticket_counter;

                const ticketChannel = await interaction.guild.channels.create({
                    name: `ticket-${counter}`,
                    type: ChannelType.GuildText,
                    parent: settings.category_id || null,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: interaction.user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                        },
                        {
                            id: settings.support_role_id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                        }
                    ]
                });

                const welcomeEmbed = new EmbedBuilder()
                    .setDescription(`مــرحــبــاً <@${interaction.user.id}>!\nفــريــق الــدعــم ســيــرد عــلــيــك قــريــبــاً`)
                    .setColor('#5865F2');

                const closeButton = new ButtonBuilder()
                    .setCustomId(`close_ticket_system2_${ticketChannel.id}_${interaction.user.id}`)
                    .setLabel('قــفــل')
                    .setStyle(ButtonStyle.Danger);

                const row = new ActionRowBuilder().addComponents(closeButton);

                await ticketChannel.send({ embeds: [welcomeEmbed], components: [row] });
                await interaction.reply({ content: `تــم فــتــح تــكــت: <#${ticketChannel.id}>`, ephemeral: true });
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'صــار خــطــأ', ephemeral: true });
            }
        }

        // قفل تكت للنظام الأول
        if (interaction.customId.startsWith('close_ticket_system1_')) {
            const parts = interaction.customId.split('_');
            const ticketId = parts[3];
            const ownerId = parts[4];

            if (interaction.user.id === ownerId) {
                return interaction.reply({ content: 'لا يــمــكــنــك قــفــل الــتــكــت الــخــاص بــك', ephemeral: true });
            }

            const stmt = db.prepare('SELECT support_role_id FROM ticket_system1 WHERE guild_id = ?');
            const settings = stmt.get(interaction.guildId);

            if (!interaction.member.roles.cache.has(settings.support_role_id)) {
                return interaction.reply({ content: 'لا تــمــلــك صــلاحــيــة قــفــل الــتــكــت', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('تــم قــفــل الــتــكــت')
                .setDescription('هــل تــريــد حــذفــه؟')
                .setColor('#FFA500');

            const deleteButton = new ButtonBuilder()
                .setCustomId(`delete_ticket_${ticketId}`)
                .setLabel('حــذف')
                .setStyle(ButtonStyle.Danger);

            const reopenButton = new ButtonBuilder()
                .setCustomId(`reopen_ticket_system1_${ticketId}_${ownerId}`)
                .setLabel('فــتــح')
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder().addComponents(deleteButton, reopenButton);

            await interaction.reply({ embeds: [embed], components: [row] });
        }

        // قفل تكت للنظام الثاني
        if (interaction.customId.startsWith('close_ticket_system2_')) {
            const parts = interaction.customId.split('_');
            const ticketId = parts[3];
            const ownerId = parts[4];

            if (interaction.user.id === ownerId) {
                return interaction.reply({ content: 'لا يــمــكــنــك قــفــل الــتــكــت الــخــاص بــك', ephemeral: true });
            }

            const stmt = db.prepare('SELECT support_role_id FROM ticket_system2 WHERE guild_id = ?');
            const settings = stmt.get(interaction.guildId);

            if (!interaction.member.roles.cache.has(settings.support_role_id)) {
                return interaction.reply({ content: 'لا تــمــلــك صــلاحــيــة قــفــل الــتــكــت', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('تــم قــفــل الــتــكــت')
                .setDescription('هــل تــريــد حــذفــه؟')
                .setColor('#FFA500');

            const deleteButton = new ButtonBuilder()
                .setCustomId(`delete_ticket_${ticketId}`)
                .setLabel('حــذف')
                .setStyle(ButtonStyle.Danger);

            const reopenButton = new ButtonBuilder()
                .setCustomId(`reopen_ticket_system2_${ticketId}_${ownerId}`)
                .setLabel('فــتــح')
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder().addComponents(deleteButton, reopenButton);

            await interaction.reply({ embeds: [embed], components: [row] });
        }

        // حذف التكت
        if (interaction.customId.startsWith('delete_ticket_')) {
            const ticketId = interaction.customId.split('_')[2];
            const channel = interaction.guild.channels.cache.get(ticketId);

            try {
                await channel.delete();
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'صــار خــطــأ', ephemeral: true });
            }
        }

        // إعادة فتح التكت للنظام الأول
        if (interaction.customId.startsWith('reopen_ticket_system1_')) {
            const parts = interaction.customId.split('_');
            const ticketId = parts[3];
            const ownerId = parts[4];

            const closeButton = new ButtonBuilder()
                .setCustomId(`close_ticket_system1_${ticketId}_${ownerId}`)
                .setLabel('قــفــل')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(closeButton);

            const embed = new EmbedBuilder()
                .setDescription(`تــم إعــادة فــتــح الــتــكــت`)
                .setColor('#00FF00');

            await interaction.update({ embeds: [embed], components: [row] });
        }

        // إعادة فتح التكت للنظام الثاني
        if (interaction.customId.startsWith('reopen_ticket_system2_')) {
            const parts = interaction.customId.split('_');
            const ticketId = parts[3];
            const ownerId = parts[4];

            const closeButton = new ButtonBuilder()
                .setCustomId(`close_ticket_system2_${ticketId}_${ownerId}`)
                .setLabel('قــفــل')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(closeButton);

            const embed = new EmbedBuilder()
                .setDescription(`تــم إعــادة فــتــح الــتــكــت`)
                .setColor('#00FF00');

            await interaction.update({ embeds: [embed], components: [row] });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
