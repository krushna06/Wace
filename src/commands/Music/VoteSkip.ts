import { EmbedBuilder } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { WacelinkPlayer } from "../../wacelink/main.js";

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

    const player = client.wacelink.players.get(handler.guild!.id) as WacelinkPlayer;
    const { channel } = handler.member!.voice;
    if (!channel)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${client.i18n.get(handler.language, "error", "no_in_voice")}`)
            .setColor(client.color),
        ],
      });

    const members = channel.members.filter((m) => !m.user.bot);
    const requiredVotes = Math.ceil(members.size / 2);
    if (members.size <= 1) {
      await player.skip();
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${client.i18n.get(handler.language, "command.music", "skip_msg")} (Only one user in channel)`)
            .setColor(client.color),
        ],
      });
    }

    const currentTrack = player.queue.current;
    if (!currentTrack) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`No song is currently playing.`)
            .setColor(client.color),
        ],
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
        embeds: [
          new EmbedBuilder()
            .setDescription(`⏭️ Song skipped! (${votes.size}/${requiredVotes} votes)`)
            .setColor(client.color),
        ],
      });
    } else {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`🗳️ You voted to skip! (${votes.size}/${requiredVotes} votes). ${requiredVotes - votes.size} more vote(s) needed to skip.`)
            .setColor(client.color),
        ],
      });
    }
  }
} 