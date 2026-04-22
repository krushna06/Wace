import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["invite"];
  public description = "Shows the invite information of the Bot";
  public category = "Info";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = [];
  public lavalink = false;
  public options = [];
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Invite Me")
        .setStyle(ButtonStyle.Link)
        .setURL(
          `https://discord.com/api/oauth2/authorize?client_id=${
            client.user!.id
          }&permissions=8&scope=bot%20applications.commands`
        )
    );

    await handler.editReply({
      flags: CV2_FLAG,
      components: [
        cv2.build({
          title: `${client.i18n.get(handler.language, "command.info", "inv_title", { username: client.user!.username })}`,
          description: `${client.i18n.get(handler.language, "command.info", "inv_desc", { username: client.user!.username })}`,
          fields: [
            {
              name: client.config.bot.BOT_NAME,
              value: client.config.bot.INVITE_LINK,
              inline: false,
            },
          ],
          timestamp: true,
          color: client.color,
        }),
        row2,
      ],
    });
  }
}
