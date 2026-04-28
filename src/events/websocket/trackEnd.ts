import { User } from "discord.js";
import { Manager } from "../../manager.js";
import { Player } from "../../structures/Player.js";

export default class {
  async execute(client: Manager, player: Player) {
    const song = player.previousQueue.at(-1);
    const requesterQueue = song?.requester as User;

    const currentData = song
      ? {
          title: song.title,
          uri: song.uri,
          length: song.duration,
          thumbnail: song.artworkUrl,
          author: song.author,
          requester: requesterQueue
            ? {
                id: requesterQueue.id,
                username: requesterQueue.username,
                globalName: requesterQueue.globalName,
                defaultAvatarURL: requesterQueue.defaultAvatarURL ?? null,
              }
            : null,
        }
      : null;

    client.wsl.get(player.guildId)?.send({
      op: "trackEnd",
      guild: player.guildId,
      data: {
        track: currentData,
        state: {
          current: player.current,
          queue: player.queue,
          position: player.position,
          pause: player.paused,
          volume: player.volume,
          loop: player.loop,
          shuffle: player.shuffle,
        }
      },
      mode: player.data.get("endMode") ?? "normal",
    });
  }
}