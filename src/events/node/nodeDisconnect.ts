import { Manager } from "../../manager.js";
import { WacelinkNode } from "../../wacelink/main.js";

export default class {
  execute(client: Manager, node: WacelinkNode, code: number, reason: Buffer) {
    client.wacelink.players.forEach((player, index) => {
      if (player.node.options.name == node.options.name) player.destroy();
    });
    client.logger.debug(
      import.meta.url,
      `Lavalink ${node.options.name}: Disconnected, Code: ${code}, Reason: ${reason}`
    );
  }
}
