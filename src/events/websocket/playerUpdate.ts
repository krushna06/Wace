import { Manager } from "../../manager.js";
import { Player } from "../../structures/Player.js";

export default class {
  async execute(client: Manager, player: Player) {
    client.wsl.get(player.guildId)?.send({
      op: "playerUpdate",
      guild: player.guildId,
      data: {
        position: player.position,
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