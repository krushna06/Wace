import { Manager } from "../../manager.js";
import { Node } from "shoukaku";

export default class {
  async execute(client: Manager, node: Node | undefined, error: Error) {
    if (!node) {
      client.logger.debug("NodeError", `Lavalink node error: ${error.message}`);
      return;
    }
    client.logger.debug("NodeError", `Lavalink "${node.name}" error: ${error.message}`);
  }
}
