import { Manager } from "../../manager.js";
import { Node } from "shoukaku";

export default class {
  async execute(client: Manager, node: Node) {
    // Shoukaku nodes don't have the same structure as Wacelink nodes
    // We need to get the node info from Shoukaku's node map
    const nodeName = node.name;
    const nodeInfo = client.shoukaku.nodes.get(nodeName);
    
    if (!nodeInfo) {
      client.logger.warn("NodeConnect", `Node ${nodeName} not found in Shoukaku nodes map`);
      return;
    }

    // Add to lavalinkUsing array for backward compatibility
    const existingIndex = client.lavalinkUsing.findIndex(n => n.name === nodeName);
    if (existingIndex === -1) {
      // Parse the node URL - Shoukaku format is "host:port"
      const [host, portStr] = nodeInfo.url.split(':');
      const port = parseInt(portStr) || 2333;
      
      client.lavalinkUsing.push({
        host: host,
        port: port,
        pass: nodeInfo.auth || '',
        secure: nodeInfo.secure || false,
        name: nodeName,
      });
      
      client.logger.info("NodeConnect", `Added node to lavalinkUsing: ${host}:${port} (secure: ${nodeInfo.secure})`);
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
