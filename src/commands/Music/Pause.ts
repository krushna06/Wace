import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Player } from "../../structures/Player.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["pause"];
  public description = "Pause the music!";
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

    await player.pause();

    try {
      handler.editReply({ flags: CV2_FLAG, components: [cv2.simple(`${client.i18n.get(handler.language, "command.music", "pause_msg")}`, client.color)] });
    } catch (error: any) {
      if (error?.code === 10062) {
        client.logger.warn("Pause", "Interaction expired (took too long to respond)");
        return;
      }
      client.logger.error("Pause", error);
    }
  }
}
