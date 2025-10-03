const { Client, GatewayIntentBits, SlashCommandBuilder, Routes, EmbedBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const BOT_TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const commands = [
  new SlashCommandBuilder()
    .setName('send-embed')
    .setDescription('إرسال رسالة داخل إيمبد بدون عنوان أو زخرفة أو رموز')
    .addChannelOption(option =>
      option.setName('الروم')
        .setDescription('الروم اللي تبي ترسل له')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('الكلام')
        .setDescription('اكتب الكلام كما تريده أن يظهر')
        .setRequired(true))
].map(command => command.toJSON());

// تسجيل الأمر
const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('✅ تم تسجيل الأمر بنجاح');
  } catch (error) {
    console.error(error);
  }
})();

// عند تشغيل البوت
client.on('ready', () => {
  console.log(`🚀 البوت شغّال باسم ${client.user.tag}`);
});

// تنفيذ الأمر
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === 'send-embed') {
    const channel = interaction.options.getChannel('الروم');
    const message = interaction.options.getString('الكلام');

    const embed = new EmbedBuilder()
      .setDescription(message)
      .setColor('#2f3136'); // لون ديسكورد الغامق الرسمي

    try {
      await channel.send({ embeds: [embed] });
      await interaction.reply({ content: '✅ تم الإرسال بنجاح', ephemeral: true });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ حدث خطأ أثناء الإرسال', ephemeral: true });
    }
  }
});

client.login(BOT_TOKEN);
