import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler, ParseMentionEnum } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import { ApplicationCommandOptionType, EmbedBuilder, User } from "discord.js";
import { profileImage } from "discord-arts";

export default class implements Command {
  public name = ["userinfo"];
  public description = "Show your or someone else's profile picture";
  public category = "Image";
  public accessableby = [Accessableby.Member];
  public usage = "<mention>";
  public aliases = [];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "user",
      description: "Type your user here",
      type: ApplicationCommandOptionType.User,
      required: false,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();
    const data = handler.args[0];
    const getData = await handler.parseMentions(data);

    if (data && getData && getData.type !== ParseMentionEnum.USER)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.getString(handler.language, "error", "arg_error", {
                text: "**@mention**!",
              })}`
            )
            .setColor(client.color),
        ],
      });

    const value = getData.data as User;

    if (value && (value as any) !== "error") {
      const buffer = await profileImage(value.id, {
        customTag: 'Avatar',
        squareAvatar: true,
        presenceStatus: 'online',
        badgesFrame: true,
        borderColor: ['#722AE6', '#E4B5CB'],
        customBackground: 'https://w0.peakpx.com/wallpaper/1011/741/HD-wallpaper-planet-ring-purple-clouds-space.jpg'
      });

      await handler.editReply({ files: [buffer] });
    } else {
      const buffer = await profileImage(handler.user!.id, {
        customTag: 'Avatar',
        squareAvatar: true,
        presenceStatus: 'online',
        badgesFrame: true,
        borderColor: ['#722AE6', '#E4B5CB'],
        customBackground: 'https://w0.peakpx.com/wallpaper/1011/741/HD-wallpaper-planet-ring-purple-clouds-space.jpg'
      });

      await handler.editReply({ files: [buffer] });
    }
  }
}
