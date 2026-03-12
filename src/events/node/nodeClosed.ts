import { AutoFixLavalink } from "../../autofix/AutoFixLavalink.js";
import { Manager } from "../../manager.js";
import { Node } from "shoukaku";

export default class {
  async execute(client: Manager, node: Node) {
    client.logger.debug("NodeClosed", `Lavalink ${node.name}: Closed`);
    if (client.config.utilities.AUTOFIX_LAVALINK.enable) {
      new AutoFixLavalink(client, node.name);
    }
  }
}
