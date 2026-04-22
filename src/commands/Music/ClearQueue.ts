import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Player } from "../../structures/Player.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["clearqueue"];
  public description = "Clear song in queue!";
  public category = "Music";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = ["clear", "cq"];
  public lavalink = true;
  public options = [];
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public permissions = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const player = client.players.get(handler.guild!.id) as Player;
    player.queue = [];

    await handler.editReply({ flags: CV2_FLAG, components: [cv2.simple(`${client.i18n.get(handler.language, "command.music", "clearqueue_msg")}`, client.color)] });

    client.wsl.get(handler.guild!.id)?.send({
      op: "playerClearQueue",
      guild: handler.guild!.id,
    });
  }
}
