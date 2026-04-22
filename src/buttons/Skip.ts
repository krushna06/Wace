import {
  ButtonInteraction,
  CacheType,
  InteractionCollector,
  Message,
} from "discord.js";
import { PlayerButton } from "../@types/Button.js";
import { Manager } from "../manager.js";
import { ReplyInteractionService } from "../services/ReplyInteractionService.js";
import { Player } from "../structures/Player.js";
import { cv2, CV2_FLAG } from "../utilities/ComponentsV2.js";
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
      await message.reply({ flags: CV2_FLAG, components: [cv2.simple(`${client.i18n.get(language, "button.music", "stop_msg")}`, client.color)] });
      return new ReplyInteractionService(client, message, `${client.i18n.get(language, "button.music", "stop_msg")}`);
    }
    player.skip();
    await message.reply({ flags: CV2_FLAG, components: [cv2.simple(`${client.i18n.get(language, "button.music", "skip_msg")}`, client.color)] });
    new ReplyInteractionService(client, message, `${client.i18n.get(language, "button.music", "skip_msg")}`);
  }
}