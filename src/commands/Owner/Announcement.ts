import { GuildBasedChannel, PermissionFlagsBits, TextChannel } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["announcement"];
  public description = "Send announcement message to all servers";
  public category = "Owner";
  public accessableby = [Accessableby.Admin];
  public usage = "<your_message>";
  public aliases = ["an"];
  public lavalink = false;
  public usingInteraction = false;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    if (!handler.args[0] || !handler.message)
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple("`⚠️` | Empty args!", client.color)],
      });

    const avalibleChannel: GuildBasedChannel[] = [];
    const allGuild = client.guilds.cache.map((guild) => guild);
    let sentSuccesfully = 0;

    for (const guild of allGuild) {
      const channelFilterTextBased = guild.channels.cache.filter((channel) => channel.isTextBased());
      const channelFilterPermission = channelFilterTextBased.filter((channel) =>
        channel.guild.members.me?.permissions.has(PermissionFlagsBits.SendMessages)
      );
      const channelFilterGeneral = channelFilterPermission.filter((channel) => channel.name.includes("commands"));
      const channelFilterNonGeneral = channelFilterPermission.filter((channel) => !channel.name.includes("commands"));
      if (channelFilterGeneral.size !== 0) {
        avalibleChannel.push(channelFilterGeneral.first()!);
      } else {
        avalibleChannel.push(channelFilterNonGeneral.first()!);
      }
    }

    const parsed = handler.message.content.replace(handler.prefix, "").split(" ");
    const block = this.parse(parsed.slice(1).join(" "));
    const announcementText = block !== null ? block[2] : parsed.slice(1).join(" ")!;

    for (const channel of avalibleChannel) {
      sentSuccesfully = sentSuccesfully + 1;
      await (channel as TextChannel)
        .send({
          flags: CV2_FLAG,
          components: [cv2.build({
            author: "💫 | Announcement",
            description: announcementText,
            color: client.color,
            footer: `${handler.guild!.members.me!.displayName}`,
          })],
        })
        .catch(() => (sentSuccesfully = sentSuccesfully - 1));
    }

    await handler.editReply({
      flags: CV2_FLAG,
      components: [cv2.build({
        description: `\`🟢\` | **Sent successfully in ${sentSuccesfully}**\n\`🔴\` | **Sent failed in ${avalibleChannel.length - sentSuccesfully}**`,
        color: client.color,
        footer: `${handler.guild!.members.me!.displayName}`,
      })],
    });
  }

  protected parse(content: string): string[] | null {
    // @ts-ignore
    const result = content.match(/^```(.*?)\n(.*?)```$/ms);
    return result ? result.slice(0, 3).map((el) => el.trim()) : null;
  }
}
