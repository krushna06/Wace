import { Manager } from "../../manager.js";
import { Player } from "../../structures/Player.js";

export default class {
  async execute(client: Manager, player: Player) {
    client.wsl.get(player.guildId)?.send({
      op: "playerDestroy",
      guild: player.guildId,
    });
  }
}