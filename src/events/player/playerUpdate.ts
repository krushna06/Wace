import { Manager } from "../../manager.js";
import { WacelinkPlayer } from "../../wacelink/main.js";

export default class {
  async execute(client: Manager, player: WacelinkPlayer, data: unknown) {
    client.emit("playerUpdate", player);
  }
}
