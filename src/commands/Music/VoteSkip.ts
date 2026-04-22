import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Player } from "../../structures/Player.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["voteskip"];
  public description = "Vote to skip the current song. Requires a majority of users in the voice channel.";
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
    const { channel } = handler.member!.voice;
    if (!channel)
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "error", "no_in_voice")}`, client.color)],
      });

    const members = channel.members.filter((m) => !m.user.bot);
    const requiredVotes = Math.ceil(members.size / 2);
    if (members.size <= 1) {
      await player.skip();
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.music", "skip_msg")} (Only one user in channel)`, client.color)],
      });
    }

    const currentTrack = player.current;
    if (!currentTrack) {
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`No song is currently playing.`, client.color)],
      });
    }
    const voteKey = `voteskip_${currentTrack.identifier}`;
    let votes: Set<string> = player.data.get(voteKey) || new Set();
    votes = new Set(votes);
    votes.add(handler.user.id);
    player.data.set(voteKey, Array.from(votes));

    if (votes.size >= requiredVotes) {
      await player.skip();
      player.data.delete(voteKey);
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`⏭️ Song skipped! (${votes.size}/${requiredVotes} votes)`, client.color)],
      });
    } else {
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`🗳️ You voted to skip! (${votes.size}/${requiredVotes} votes). ${requiredVotes - votes.size} more vote(s) needed to skip.`, client.color)],
      });
    }
  }
}
