import { Manager } from "../../manager.js";
import { EmbedBuilder, TextChannel } from "discord.js";
import util from "node:util";
import { AutoReconnectBuilderService } from "../../services/AutoReconnectBuilderService.js";
import { ClearMessageService } from "../../services/ClearMessageService.js";
import { WacelinkPlayer } from "../../wacelink/main.js";

export default class {
  async execute(client: Manager, player: WacelinkPlayer, data: Record<string, any>) {
    client.logger.error(
      "PlayerException",
      `Player got an exception ${util.inspect(data).slice(1).slice(0, -1)}`
    );
    /////////// Update Music Setup //////////
    await client.UpdateMusic(player);
    /////////// Update Music Setup ///////////
    const fetch_channel = await client.channels.fetch(player.textId).catch(() => undefined);
    const text_channel = fetch_channel! as TextChannel;
    if (text_channel) {
      await text_channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription("Player got an exception, please contact <@853620650592567304>\n Such error usually occurs from the lavalink server."),
        ],
      });
    }

    const data247 = await new AutoReconnectBuilderService(client, player).get(player.guildId);
    const channel = (await client.channels
      .fetch(player.textId)
      .catch(() => undefined)) as TextChannel;
    if (data247 !== null && data247 && data247.twentyfourseven && channel)
      new ClearMessageService(client, channel, player);

    const currentPlayer = client.wacelink.players.get(player.guildId) as WacelinkPlayer;
    if (!currentPlayer) return;
    if (currentPlayer.queue.length > 0) return await player.skip().catch(() => {});
    if (!currentPlayer.sudoDestroy) await player.destroy().catch(() => {});
  }
}
