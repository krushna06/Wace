import { Manager } from "../../manager.js";
import { WacelinkPlayer } from "../../wacelink/main.js";

export default class {
  async execute(client: Manager, player: WacelinkPlayer) {
    client.wsl.get(player.guildId)?.send({
      op: "playerUpdate",
      guild: player.guildId,
      position: player.position,
    });
  }
}
