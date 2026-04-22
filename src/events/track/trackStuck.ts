import { Manager } from "../../manager.js";
import { TextChannel } from "discord.js";
import { AutoReconnectBuilderService } from "../../services/AutoReconnectBuilderService.js";
import { ClearMessageService } from "../../services/ClearMessageService.js";
import { Player } from "../../structures/Player.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class {
  async execute(client: Manager, player: Player, data: Record<string, any>) {
    if (!client.isDatabaseConnected)
      return client.logger.warn(
        "DatabaseService",
        "The database is not yet connected so this event will temporarily not execute. Please try again later!"
      );


    await client.UpdateMusic(player);


    const guild = await client.guilds.fetch(player.guildId).catch(() => undefined);

    const channel = (await client.channels
      .fetch(player.textId)
      .catch(() => undefined)) as TextChannel;
    if (!channel) return player.destroy().catch(() => {});

    let guildModel = await client.db.language.get(`${channel.guild.id}`);
    if (!guildModel) {
      guildModel = await client.db.language.set(`${channel.guild.id}`, client.config.bot.LANGUAGE);
    }

    const language = guildModel;

    if (channel) {
      const setup = await client.db.setup.get(player.guildId);
      const msg = await channel.send({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(language, "event.player", "error_desc")}`, client.color)],
      });
      setTimeout(
        async () =>
          !setup || setup == null || setup.channel !== channel.id
            ? msg.delete().catch(() => null)
            : true,
        client.config.utilities.DELETE_MSG_TIMEOUT
      );
    }

    client.logger.error("TrackStuck", `Track Stuck in ${guild!.name} / ${player.guildId}.`);

    const data247 = await new AutoReconnectBuilderService(client, player).get(player.guildId);
    if (data247 !== null && data247 && data247.twentyfourseven && channel)
      new ClearMessageService(client, channel, player);
    const currentPlayer = client.players.get(player.guildId) as Player;
    if (!currentPlayer) return;
    if (currentPlayer.queue.length > 0) return await player.skip().catch(() => {});

    if (!player.data.get("sudo-destroy")) {
      await player.destroy().catch(() => {});
    }
  }
}