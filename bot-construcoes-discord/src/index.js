import 'dotenv/config';
import {
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  MessageFlags,
} from 'discord.js';
import { readConstructions, updateConstructions } from './storage.js';

if (!process.env.DISCORD_TOKEN) {
  console.error('A variável DISCORD_TOKEN não foi encontrada no arquivo .env.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const platformNames = {
  tiktok: 'TikTok',
  twitch: 'Twitch',
};

const platformEmojis = {
  tiktok: '🎵',
  twitch: '🟣',
};

function normalizeText(text) {
  return text.trim().replace(/\s+/g, ' ');
}

async function getPublicationChannel(interaction) {
  const configuredChannelId = process.env.CONSTRUCOES_CHANNEL_ID?.trim();

  if (!configuredChannelId) {
    return interaction.channel;
  }

  const channel = await interaction.guild.channels
    .fetch(configuredChannelId)
    .catch(() => null);

  if (!channel?.isTextBased()) {
    throw new Error(
      'CONSTRUCOES_CHANNEL_ID não aponta para um canal de texto válido.',
    );
  }

  return channel;
}

async function handleLaunch(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const subscriber = normalizeText(
    interaction.options.getString('inscrito', true),
  );
  const construction = normalizeText(
    interaction.options.getString('construcao', true),
  );
  const platform = interaction.options.getString('plataforma', true);

  const record = await updateConstructions((items) => {
    const nextId = items.reduce(
      (largestId, item) => Math.max(largestId, Number(item.id) || 0),
      0,
    ) + 1;

    const newRecord = {
      id: nextId,
      subscriber,
      construction,
      platform,
      createdAt: new Date().toISOString(),
      createdById: interaction.user.id,
      createdByTag: interaction.user.tag,
      guildId: interaction.guildId,
    };

    return {
      data: [...items, newRecord],
      value: newRecord,
    };
  });

  const embed = new EmbedBuilder()
    .setTitle(`${platformEmojis[platform]} Nova construção lançada!`)
    .setDescription(
      `A construção **${record.construction}** foi cadastrada para **${record.subscriber}**.`,
    )
    .addFields(
      {
        name: 'Inscrito',
        value: record.subscriber,
        inline: true,
      },
      {
        name: 'Plataforma',
        value: platformNames[record.platform],
        inline: true,
      },
      {
        name: 'ID',
        value: `#${record.id}`,
        inline: true,
      },
    )
    .setFooter({
      text: `Lançado por ${interaction.user.tag}`,
    })
    .setTimestamp();

  const publicationChannel = await getPublicationChannel(interaction);
  await publicationChannel.send({ embeds: [embed] });

  await interaction.editReply(
    `Construção **#${record.id}** cadastrada e publicada em ${publicationChannel}.`,
  );
}

async function handleList(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const platformFilter = interaction.options.getString('plataforma');
  let items = await readConstructions();

  items = items.filter((item) => item.guildId === interaction.guildId);

  if (platformFilter) {
    items = items.filter((item) => item.platform === platformFilter);
  }

  items = items
    .sort((first, second) =>
      second.createdAt.localeCompare(first.createdAt),
    )
    .slice(0, 10);

  if (items.length === 0) {
    await interaction.editReply('Nenhuma construção foi encontrada.');
    return;
  }

  const description = items
    .map(
      (item) =>
        `**#${item.id} — ${item.construction}**\n` +
        `Inscrito: ${item.subscriber} • ${platformNames[item.platform] ?? item.platform}`,
    )
    .join('\n\n');

  const embed = new EmbedBuilder()
    .setTitle('🏗️ Construções cadastradas')
    .setDescription(description)
    .setFooter({ text: 'Mostrando no máximo 10 construções' })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleRemove(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const id = interaction.options.getInteger('id', true);

  const removed = await updateConstructions((items) => {
    const record = items.find(
      (item) => item.id === id && item.guildId === interaction.guildId,
    );

    if (!record) {
      return {
        data: items,
        value: null,
      };
    }

    return {
      data: items.filter(
        (item) => !(item.id === id && item.guildId === interaction.guildId),
      ),
      value: record,
    };
  });

  if (!removed) {
    await interaction.editReply(`Não encontrei a construção **#${id}**.`);
    return;
  }

  await interaction.editReply(
    `A construção **#${removed.id} — ${removed.construction}** foi removida.`,
  );
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Bot conectado como ${readyClient.user.tag}.`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || !interaction.inGuild()) {
    return;
  }

  try {
    switch (interaction.commandName) {
      case 'lancar':
        await handleLaunch(interaction);
        break;
      case 'construcoes':
        await handleList(interaction);
        break;
      case 'remover-construcao':
        await handleRemove(interaction);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(error);

    const message =
      'Ocorreu um erro ao executar o comando. Verifique o terminal do bot.';

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(message).catch(() => null);
    } else {
      await interaction
        .reply({
          content: message,
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => null);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
