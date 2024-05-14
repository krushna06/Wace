import { Manager } from "../../manager.js";
import { WacelinkPlayer } from "../../wacelink/main.js";

export default class {
  async execute(client: Manager, player: WacelinkPlayer) {
    const guild = await client.guilds.fetch(player.guildId).catch(() => undefined);
    client.logger.info(import.meta.url, `Player Created in @ ${guild?.name} / ${player.guildId}`);
    client.emit("playerCreate", player);
  }
}
