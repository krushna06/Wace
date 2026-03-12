import { Manager } from "../../manager.js";
import { Player } from "../../structures/Player.js";

export default class {
  async execute(client: Manager, player: Player) {
    const guild = await client.guilds.fetch(player.guildId).catch(() => undefined);
    client.logger.info("PlayerCreate", `Player Created in @ ${guild?.name} / ${player.guildId}`);
    // Don't re-emit playerCreate - that causes an infinite loop!
  }
}
