import { formatDuration } from "../../utilities/FormatDuration.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Player } from "../../structures/Player.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

const fastForwardNum = 10;

export default class implements Command {
  public name = ["forward"];
  public description = "Forward timestamp in the song! (10s)";
  public category = "Music";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = [];
  public lavalink = true;
  public options = [];
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public permissions = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const player = client.players.get(handler.guild!.id) as Player;

    const song = player.current;
    const song_position = player.position;
    const CurrentDuration = formatDuration(song_position + fastForwardNum * 1000);

    if (song_position + fastForwardNum * 1000 < song!.duration!) {
      await player.shoukaku?.seekTo(song_position + fastForwardNum * 1000);

      await handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.music", "forward_msg", { duration: CurrentDuration })}`, client.color)],
      });
    } else {
      return await handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.music", "forward_beyond")}`, client.color)],
      });
    }
  }
}
