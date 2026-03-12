import { Manager } from "../../manager.js";
import { Node } from "shoukaku";
import { AutoReconnectBuilderService } from "../../services/AutoReconnectBuilderService.js";

export default class {
  async execute(client: Manager, node: Node, code: number, reason: Buffer) {
    const players = Array.from(client.players.entries());
    
    for (const [guildId, player] of players) {
      // Shoukaku players don't have a node property with options
      // We'll check if the player's shoukaku instance is connected to this node
      if (player.shoukaku && player.shoukaku.node.name === node.name) {
        const data = await new AutoReconnectBuilderService(client, player).get(guildId);
        const p: any = player;
        if (data && data.twentyfourseven) {
          // Store original methods if not already stored
          if (!p.__originalDestroy) {
            p.__originalDestroy = player.destroy;
            player.destroy = async function() {
              this.data.set("lavalink-disconnected", true);
              return;
            };
          }
          // Clear queue and pause
          player.queue = [];
          if (player.shoukaku) {
            await player.shoukaku.setPaused(true).catch(() => {});
          }
          player.data.set("lavalink-disconnected", true);
          player.data.set("original-voice-id", player.voiceId);
          player.data.set("original-text-id", player.textId);
          client.logger.debug(
            "NodeDisconnect",
            `Lavalink ${node.name}: Disconnected but keeping player in VC due to 24/7 mode for guild ${guildId}`
          );
        } else {
          if (p.__originalDestroy) player.destroy = p.__originalDestroy;
          player.destroy().catch(() => {});
        }
      }
    }
    client.logger.debug(
      "NodeDisconnect",
      `Lavalink ${node.name}: Disconnected, Code: ${code}, Reason: ${reason}`
    );
  }
}
