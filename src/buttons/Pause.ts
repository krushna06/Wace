import { ButtonInteraction, CacheType, InteractionCollector, Message } from "discord.js";
import { PlayerButton } from "../@types/Button.js";
import { Manager } from "../manager.js";
import {
  filterSelect,
  playerRowOne,
  playerRowOneEdited,
  playerRowTwo,
} from "../utilities/PlayerControlButton.js";
import { ReplyInteractionService } from "../services/ReplyInteractionService.js";
import { Player } from "../structures/Player.js";

export default class implements PlayerButton {
  name = "pause";
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

    await player.setPause(!player.paused);

    player.paused
      ? nplaying
          .edit({
            components: [playerRowOneEdited(client), playerRowTwo(client), filterSelect(client)],
          })
          .catch(() => null)
      : nplaying
          .edit({
            components: [playerRowOne(client), playerRowTwo(client), filterSelect(client)],
          })
          .catch(() => null);

    new ReplyInteractionService(
      client,
      message,
      `${client.i18n.get(language, "button.music", player.paused ? "pause_msg" : "resume_msg")}`
    );
  }
}
