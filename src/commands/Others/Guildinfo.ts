import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import {
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
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

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
    } catch {}
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

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("member_info").setLabel("Member Info").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("channel_info").setLabel("Channel Info").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("role_emoji_info").setLabel("Role & Emoji Info").setStyle(ButtonStyle.Danger)
    );

    await handler.editReply({
      flags: CV2_FLAG,
      components: [
        cv2.build({
          author: guild.name,
          title: "Guild Information",
          thumbnail: guild.iconURL({ size: 2048 }) || undefined,
          color: client.color,
          timestamp: true,
          description: `**Server Name:** ${guild.name}\n**Server ID:** ${guild.id}\n**Owner:** ${ownerName}\n**Verify Level:** ${guild.verificationLevel}\n**Boost Tier:** ${guild.premiumTier}\n**Boost Count:** ${guild.premiumSubscriptionCount}\n**Created On:** <t:${Math.floor(guild.createdAt.getTime() / 1000)}:F>`,
          components: [row],
        }),
      ],
    });

    const filter = (i: Interaction) => i.user.id === interaction.user.id;
    const collector = interaction.channel?.createMessageComponentCollector({
      filter,
      componentType: ComponentType.Button,
      time: 60000,
    });

    collector?.on("collect", async (i) => {
      if (!i.isButton()) return;
      let description = "";
      let title = "";
      if (i.customId === "member_info") {
        title = "Member Information";
        description = this.getMemberInfo(guild);
      } else if (i.customId === "channel_info") {
        title = "Channel Information";
        description = this.getChannelInfo(guild);
      } else if (i.customId === "role_emoji_info") {
        title = "Role & Emoji Information";
        description = this.getRoleEmojiInfo(guild);
      }
      await i.reply({ flags: CV2_FLAG, components: [cv2.build({ title, description, color: client.color, timestamp: true })], ephemeral: true });
    });

    collector?.on("end", async () => {
      await handler.editReply({
        flags: CV2_FLAG,
        components: [
          cv2.build({
            author: guild.name,
            title: "Guild Information",
            thumbnail: guild.iconURL({ size: 2048 }) || undefined,
            color: client.color,
            timestamp: true,
            description: `**Server Name:** ${guild.name}\n**Server ID:** ${guild.id}\n**Owner:** ${ownerName}\n**Verify Level:** ${guild.verificationLevel}\n**Boost Tier:** ${guild.premiumTier}\n**Boost Count:** ${guild.premiumSubscriptionCount}\n**Created On:** <t:${Math.floor(guild.createdAt.getTime() / 1000)}:F>`,
          }),
        ],
      }).catch(() => {});
    });
  }

  private getMemberInfo(guild: Guild): string {
    const members = guild.members.cache;
    return `**Members:** ${members.filter((m) => !m.user.bot).size} members\n**Bots:** ${members.filter((m) => m.user.bot).size} bots`;
  }

  private getChannelInfo(guild: Guild): string {
    const ch = guild.channels.cache;
    return `**Text:** ${ch.filter((c) => c.type === ChannelType.GuildText).size}\n**Voice:** ${ch.filter((c) => c.type === ChannelType.GuildVoice).size}\n**Stage:** ${ch.filter((c) => c.type === ChannelType.GuildStageVoice).size}\n**News:** ${ch.filter((c) => c.type === ChannelType.GuildNews).size}`;
  }

  private getRoleEmojiInfo(guild: Guild): string {
    return `**Roles:** ${guild.roles.cache.size}\n**Emojis:** ${guild.emojis.cache.size}\n**Stickers:** ${guild.stickers.cache.size}`;
  }
}
