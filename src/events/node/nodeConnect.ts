import { Manager } from "../../manager.js";
import { WacelinkNode } from "../../wacelink/main.js";

export default class {
  async execute(client: Manager, node: WacelinkNode) {
    client.lavalinkUsing.push({
      host: node.options.host,
      port: Number(node.options.port) | 0,
      pass: node.options.auth,
      secure: node.options.secure,
      name: node.options.name,
    });

    client.wacelink.players.forEach(async (player, guildId) => {
      const isLavalinkDisconnected = player.data.get("lavalink-disconnected");
      if (isLavalinkDisconnected) {
        try {
          player.node = node;
          
          player.data.delete("lavalink-disconnected");
          
          if (!player.paused) {
            await player.resume();
          }
          
          client.logger.info(
            "NodeConnect", 
            `Reconnected player for guild ${guildId} to new Lavalink node [${node.options.name}]`
          );
        } catch (error) {
          client.logger.error(
            "NodeConnect", 
            `Failed to reconnect player for guild ${guildId}: ${error}`
          );
        }
      }
    });

    client.logger.info("NodeConnect", `Lavalink [${node.options.name}] connected.`);
  }
}
