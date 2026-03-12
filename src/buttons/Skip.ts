import {
  ButtonInteraction,
  CacheType,
  InteractionCollector,
  Message,
  EmbedBuilder,
} from "discord.js";
import { PlayerButton } from "../@types/Button.js";
import { Manager } from "../manager.js";
import { ReplyInteractionService } from "../services/ReplyInteractionService.js";
import { Player } from "../structures/Player.js";

export default class implements PlayerButton {
  name = "skip";
  async run(
    client: Manager,
    message: ButtonInteraction<CacheType>,
    language: string,
    player: Player,
    nplaying: Message<boolean>,
    collector: InteractionCollector<ButtonInteraction<"cached">>
  ): Promise<any> {
    if (!player) {
      collector.stop();
    }

    if (player.queue.length == 0 && player.data.get("autoplay") !== true) {
      player.data.set("sudo-destroy", true);
      const is247 = await client.db.autoreconnect.get(`${message.guildId}`);
      player.stop(is247 && is247.twentyfourseven ? false : true);

      const embed = new EmbedBuilder().setDescription(
        `${client.i18n.get(language, "button.music", "stop_msg")}`
      );

      await message.reply({ embeds: [embed] });

      return new ReplyInteractionService(
        client,
        message,
        `${client.i18n.get(language, "button.music", "stop_msg")}`
      );
    }

    player.skip();

    const embed = new EmbedBuilder().setDescription(
      `${client.i18n.get(language, "button.music", "skip_msg")}`
    );

    await message.reply({ embeds: [embed] });

    new ReplyInteractionService(
      client,
      message,
      `${client.i18n.get(language, "button.music", "skip_msg")}`
    );
  }
}
