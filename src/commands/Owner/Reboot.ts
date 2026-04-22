import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["reboot"];
  public description = "Reboots the client!";
  public category = "Owner";
  public accessableby = [Accessableby.Owner];
  public usage = "";
  public aliases = ["reboot"];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];

  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    await handler.editReply({
      flags: CV2_FLAG,
      components: [cv2.build({
        description: `${client.i18n.get(handler.language, "command.utils", "restart_msg")}`,
        footer: `${handler.guild!.members.me!.displayName}`,
        color: client.color,
      })],
    });

    process.exit();
  }
}
