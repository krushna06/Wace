import { Manager } from "../../manager.js";
import { TextChannel } from "discord.js";
import { ClearMessageService } from "../../services/ClearMessageService.js";
import { AutoReconnectBuilderService } from "../../services/AutoReconnectBuilderService.js";
import { Player } from "../../structures/Player.js";

export default class {
  async execute(client: Manager, player: Player) {
    if (!client.isDatabaseConnected)
      return client.logger.warn(
        "DatabaseService",
        "The database is not yet connected so this event will temporarily not execute. Please try again later!"
      );

    const guild = await client.guilds.fetch(player.guildId).catch(() => undefined);
    client.logger.info("TrackEnd", `Track ended in @ ${guild!.name} / ${player.guildId}`);

    const tempLavalinkNode = player.data.get("tempLavalinkNode") as string | undefined;
    if (tempLavalinkNode) {
      try {
        const tempNode = client.shoukaku.nodes.get(tempLavalinkNode);
        if (tempNode) {
          client.shoukaku.nodes.remove(tempLavalinkNode);
          client.logger.info("TrackEnd", `Removed temporary lavalink node: ${tempLavalinkNode}`);
        }
        player.data.delete("tempLavalinkNode");
      } catch (error) {
        client.logger.error("TrackEnd", `Error removing temporary node: ${error}`);
      }
    }

    await client.UpdateMusic(player);

    client.emit("playerEnd", player);
  }
}