import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Player } from "../../structures/Player.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["skip"];
  public description = "Skips the song currently playing.";
  public category = "Music";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = [];
  public lavalink = true;
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public permissions = [];
  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const player = client.players.get(handler.guild!.id) as Player;

    if (player.queue.length == 0 && player.data.get("autoplay") !== true) {
      player.data.set("sudo-destroy", true);
      const is247 = await client.db.autoreconnect.get(`${handler.guild!.id}`);
      player.stop(is247 && is247.twentyfourseven ? false : true);

      return handler.editReply({ flags: CV2_FLAG, components: [cv2.simple(`${client.i18n.get(handler.language, "button.music", "stop_msg")}`, client.color)] });
    } else {
      await player.skip();

      handler.editReply({ flags: CV2_FLAG, components: [cv2.simple(`${client.i18n.get(handler.language, "command.music", "skip_msg")}`, client.color)] });
    }
  }
}
