import { Manager } from "../../manager.js";
import { Node } from "shoukaku";

export default class {
  async execute(client: Manager, node: Node) {
    const nodeName = node.name;
    
    const configNode = client.config.player.NODES.find(n => n.name === nodeName);
    if (!configNode) {
      client.logger.warn("NodeConnect", `Node ${nodeName} not found in config`);
      return;
    }

    const existingIndex = client.lavalinkUsing.findIndex(n => n.name === nodeName);
    if (existingIndex === -1) {
      client.lavalinkUsing.push({
        host: configNode.host,
        port: configNode.port,
        pass: configNode.auth || '',
        secure: configNode.secure || false,
        name: nodeName,
      });

      client.logger.info("NodeConnect", `Added node to lavalinkUsing: ${configNode.host}:${configNode.port} (secure: ${configNode.secure})`);
    }

    client.players.forEach(async (player, guildId) => {
      const isLavalinkDisconnected = player.data.get("lavalink-disconnected");
      if (isLavalinkDisconnected) {
        try {
          player.data.delete("lavalink-disconnected");

          if (!player.paused && player.current) {
            await player.resume();
          }

          client.logger.info(
            "NodeConnect",
            `Reconnected player for guild ${guildId} to new Lavalink node [${nodeName}]`
          );
        } catch (error) {
          client.logger.error(
            "NodeConnect",
            `Failed to reconnect player for guild ${guildId}: ${error}`
          );
        }
      }
    });

    client.logger.info("NodeConnect", `Lavalink [${nodeName}] connected.`);
  }
}