import 'dotenv/config';
import {
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from 'discord.js';

const requiredVariables = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    console.error(`Variável ${variable} não encontrada no arquivo .env.`);
    process.exit(1);
  }
}

const platformChoices = [
  { name: 'TikTok', value: 'tiktok' },
  { name: 'Twitch', value: 'twitch' },
];

const moderatorPermission = PermissionFlagsBits.ManageMessages;

const commands = [
  new SlashCommandBuilder()
    .setName('lancar')
    .setDescription('Cadastra e publica a construção de um inscrito.')
    .setDefaultMemberPermissions(moderatorPermission)
    .addStringOption((option) =>
      option
        .setName('inscrito')
        .setDescription('Nome do inscrito.')
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(100),
    )
    .addStringOption((option) =>
      option
        .setName('construcao')
        .setDescription('Nome da construção.')
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(100),
    )
    .addStringOption((option) =>
      option
        .setName('plataforma')
        .setDescription('Plataforma do inscrito.')
        .setRequired(true)
        .addChoices(...platformChoices),
    ),

  new SlashCommandBuilder()
    .setName('construcoes')
    .setDescription('Mostra as últimas construções cadastradas.')
    .addStringOption((option) =>
      option
        .setName('plataforma')
        .setDescription('Filtra por plataforma.')
        .setRequired(false)
        .addChoices(...platformChoices),
    ),

  new SlashCommandBuilder()
    .setName('remover-construcao')
    .setDescription('Remove uma construção cadastrada pelo ID.')
    .setDefaultMemberPermissions(moderatorPermission)
    .addIntegerOption((option) =>
      option
        .setName('id')
        .setDescription('ID da construção.')
        .setRequired(true)
        .setMinValue(1),
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

try {
  console.log('Registrando os comandos no servidor...');

  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID,
    ),
    { body: commands },
  );

  console.log('Comandos registrados com sucesso.');
} catch (error) {
  console.error('Não foi possível registrar os comandos:');
  console.error(error);
  process.exit(1);
}
