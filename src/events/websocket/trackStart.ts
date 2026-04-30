import { User } from "discord.js";
import { Manager } from "../../manager.js";
import { Player } from "../../structures/Player.js";

export default class {
  async execute(client: Manager, player: Player) {
    const song = player.current;
    
    if (!song) return;
    
    const requesterQueue = song.requester as User;

    const currentData = {
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
    };

    client.wsl.get(player.guildId)?.send({
      op: "trackStart",
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
      }
    });
  }
}