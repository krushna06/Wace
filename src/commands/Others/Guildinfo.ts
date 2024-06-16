import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Interaction,
  ComponentType,
  CommandInteraction,
  Guild,
  GuildMember,
  ChannelType,
} from "discord.js";

export default class implements Command {
  public name = ["guildinfo"];
  public description = "Shows the information of the guild";
  public category = "Others";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = ["serverinfo", "sinfo"];
  public lavalink = false;
  public options = [];
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  private async getGuildOwner(guild: Guild): Promise<string> {
    let owner: GuildMember | null = null;
    try {
      owner = await guild.members.fetch(guild.ownerId);
    } catch (error) {
      console.error("Error fetching guild owner:", error);
    }
    return owner ? `<@${owner.id}>` : "N/A";
  }

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const interaction = handler.interaction as CommandInteraction;
    const guild = interaction.guild;

    if (!guild) {
      await handler.editReply({ content: "Could not fetch guild information." });
      return;
    }

    const ownerName = await this.getGuildOwner(guild);

    const embed = new EmbedBuilder()
      .setAuthor({
        name: guild.name,
        iconURL: guild.iconURL({ size: 2048 }) || undefined,
      })
      .setColor(client.color)
      .setTitle("Guild Information")
      .setDescription(
        `
**Server Name:** ${guild.name}
**Server ID:** ${guild.id}
**Owner:** ${ownerName}
**Verify Level:** ${guild.verificationLevel}
**Boost Tier:** ${guild.premiumTier}
**Boost Count:** ${guild.premiumSubscriptionCount}
**Created On:** <t:${Math.floor(guild.createdAt.getTime() / 1000)}:F>
      `
      )
      .setThumbnail(guild.iconURL({ size: 2048 }) || undefined)
      .setTimestamp();

    const memberInfoButton = new ButtonBuilder()
      .setCustomId("member_info")
      .setLabel("Member Info")
      .setStyle(ButtonStyle.Secondary);

    const channelInfoButton = new ButtonBuilder()
      .setCustomId("channel_info")
      .setLabel("Channel Info")
      .setStyle(ButtonStyle.Success);

    const roleEmojiInfoButton = new ButtonBuilder()
      .setCustomId("role_emoji_info")
      .setLabel("Role & Emoji Info")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      memberInfoButton,
      channelInfoButton,
      roleEmojiInfoButton
    );

    await handler.editReply({ embeds: [embed], components: [row] });

    const filter = (i: Interaction) => i.user.id === interaction.user.id;
    const collector = interaction.channel?.createMessageComponentCollector({
      filter,
      componentType: ComponentType.Button,
      time: 60000,
    });

    collector?.on("collect", async (i) => {
      if (!i.isButton()) return;

      let infoEmbed;
      if (i.customId === "member_info") {
        infoEmbed = new EmbedBuilder()
          .setTitle("Member Information")
          .setDescription(this.getMemberInfo(guild))
          .setColor(client.color)
          .setTimestamp();
      } else if (i.customId === "channel_info") {
        infoEmbed = new EmbedBuilder()
          .setTitle("Channel Information")
          .setDescription(this.getChannelInfo(guild))
          .setColor(client.color)
          .setTimestamp();
      } else if (i.customId === "role_emoji_info") {
        infoEmbed = new EmbedBuilder()
          .setTitle("Role & Emoji Information")
          .setDescription(this.getRoleEmojiInfo(guild))
          .setColor(client.color)
          .setTimestamp();
      }

      await i.reply({ embeds: [infoEmbed], ephemeral: true });
    });

    collector?.on("end", async () => {
      await handler.editReply({ components: [] });
    });
  }

  private getMemberInfo(guild: Guild): string {
    const members = guild.members.cache;
    const memberCount = members.filter((member) => !member.user.bot).size;
    const botCount = members.filter((member) => member.user.bot).size;
    return `
**Members:** ${memberCount} members
**Bots:** ${botCount} bots
    `;
  }

  private getChannelInfo(guild: Guild): string {
    const textChannels = guild.channels.cache.filter(
      (ch) => ch.type === ChannelType.GuildText
    ).size;
    const voiceChannels = guild.channels.cache.filter(
      (ch) => ch.type === ChannelType.GuildVoice
    ).size;
    const stageChannels = guild.channels.cache.filter(
      (ch) => ch.type === ChannelType.GuildStageVoice
    ).size;
    const newsChannels = guild.channels.cache.filter(
      (ch) => ch.type === ChannelType.GuildNews
    ).size;
    const publicThreads = guild.channels.cache.filter(
      (ch) => ch.type === ChannelType.GuildPublicThread
    ).size;
    const privateThreads = guild.channels.cache.filter(
      (ch) => ch.type === ChannelType.GuildPrivateThread
    ).size;
    return `
**Text Channels:** ${textChannels} channels
**Voice Channels:** ${voiceChannels} channels
**Stage Channels:** ${stageChannels} channels
**News Channels:** ${newsChannels} channels
**Public Threads:** ${publicThreads} threads
**Private Threads:** ${privateThreads} threads
    `;
  }

  private getRoleEmojiInfo(guild: Guild): string {
    const roles = guild.roles.cache.size;
    const emojis = guild.emojis.cache.size;
    const stickers = guild.stickers.cache.size;
    return `
**Roles:** ${roles} roles
**Emoji Count:** ${emojis} emoji's
**Sticker Count:** ${stickers} stickers
    `;
  }
}
