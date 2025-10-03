const { Client, GatewayIntentBits, SlashCommandBuilder, Routes, EmbedBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const BOT_TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CLIENT_ID = process.env.CLIENT_ID;

const commands = [
  new SlashCommandBuilder()
    .setName('send-embed')
    .setDescription('إرسال رسالة ايمبد مع كلام مفرّغ إلى روم معين')
    .addChannelOption(option =>
      option.setName('الروم')
        .setDescription('اختر الروم')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('الكلام')
        .setDescription('اكتب الكلام الي تبيه يروح مفرغ')
        .setRequired(true))
].map(command => command.toJSON());

// تسجيل الأوامر
const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('✅ تم تسجيل الأوامر');
  } catch (error) {
    console.error(error);
  }
})();

// فنكشن تفريغ الحروف
function stretchText(text) {
  return text.split('').map(char => `${char}ـــــ`).join('').replace(/ـ+$/, '');
}

client.on('ready', () => {
  console.log(`👑 البوت شغّال كبيــر باسم ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'send-embed') {
    const channel = interaction.options.getChannel('الروم');
    const message = interaction.options.getString('الكلام');
    const stretched = stretchText(message);

    const embed = new EmbedBuilder()
      .setTitle('📢 رسالة جديدة')
      .setDescription(stretched)
      .setColor('Random');

    try {
      await channel.send({ embeds: [embed] });
      await interaction.reply({ content: '✅ تم الإرسال بنجاح يا أسطورة', ephemeral: true });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ صار خطأ، شيّك صلاحيات البوت!', ephemeral: true });
    }
  }
});

client.login(BOT_TOKEN);
