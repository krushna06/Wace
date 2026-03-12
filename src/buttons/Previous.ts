import { ButtonInteraction, CacheType, InteractionCollector, Message } from "discord.js";
import { PlayerButton } from "../@types/Button.js";
import { Manager } from "../manager.js";
import { ReplyInteractionService } from "../services/ReplyInteractionService.js";
import { Player } from "../structures/Player.js";
export default class implements PlayerButton {
  name = "replay";
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
    if (!player.previousQueue || player.previousQueue.length === 0)
      return new ReplyInteractionService(
        client,
        message,
        `${client.i18n.get(language, "button.music", "previous_notfound")}`
      );
    await player.previous();
    player.data.set("endMode", "previous");
    new ReplyInteractionService(
      client,
      message,
      `${client.i18n.get(language, "button.music", "previous_msg")}`
    );
    return;
  }
}