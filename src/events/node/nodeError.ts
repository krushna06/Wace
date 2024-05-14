import { Manager } from "../../manager.js";
import { WacelinkNode } from "../../wacelink/main.js";

export default class {
  async execute(client: Manager, node: WacelinkNode, error: Error) {
    client.logger.debug(import.meta.url, `Lavalink "${node.options.name}" error ${error}`);
  }
}
