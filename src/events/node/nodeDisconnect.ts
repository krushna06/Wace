import { Manager } from "../../manager.js";
import { WacelinkNode } from "../../wacelink/main.js";
import { AutoReconnectBuilderService } from "../../services/AutoReconnectBuilderService.js";

export default class {
  async execute(client: Manager, node: WacelinkNode, code: number, reason: Buffer) {
    const players = Array.from(client.wacelink.players.entries());
    
    for (const [guildId, player] of players) {
      if (player.node.options.name == node.options.name) {
        const data = await new AutoReconnectBuilderService(client, player).get(guildId);
        const p: any = player;
        if (data && data.twentyfourseven) {
          if (!p.__originalDisconnect) {
            p.__originalDisconnect = player.disconnect;
            player.disconnect = function() {
              this.data.set("lavalink-disconnected", true);
              return this;
            };
          }
          if (!p.__originalDestroy) {
            p.__originalDestroy = player.destroy;
            player.destroy = async function() {
              this.data.set("lavalink-disconnected", true);
              return;
            };
          }
          player.clear(false);
          player.pause();
          player.data.set("lavalink-disconnected", true);
          player.data.set("original-voice-id", player.voiceId);
          player.data.set("original-text-id", player.textId);
          client.logger.debug(
            "NodeDisconnect",
            `Lavalink ${node.options.name}: Disconnected but keeping player in VC due to 24/7 mode for guild ${guildId}`
          );
        } else {
          if (p.__originalDisconnect) player.disconnect = p.__originalDisconnect;
          if (p.__originalDestroy) player.destroy = p.__originalDestroy;
          player.destroy().catch(() => {});
        }
      }
    }
    client.logger.debug(
      "NodeDisconnect",
      `Lavalink ${node.options.name}: Disconnected, Code: ${code}, Reason: ${reason}`
    );
  }
}
