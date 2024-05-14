import { AutoFixLavalink } from "../../autofix/AutoFixLavalink.js";
import { Manager } from "../../manager.js";
import { WacelinkNode } from "../../wacelink/main.js";

export default class {
  async execute(client: Manager, node: WacelinkNode) {
    client.logger.debug(import.meta.url, `Lavalink ${node.options.name}: Closed`);
    if (client.config.features.AUTOFIX_LAVALINK.enable) {
      new AutoFixLavalink(client, node.options.name);
    }
  }
}
