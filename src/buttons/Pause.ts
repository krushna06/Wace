import { ButtonInteraction, CacheType, InteractionCollector, Message } from "discord.js";
import { PlayerButton } from "../@types/Button.js";
import { Manager } from "../manager.js";
import { ReplyInteractionService } from "../services/ReplyInteractionService.js";
import { Player } from "../structures/Player.js";
import { buildNowPlayingContainer } from "../utilities/BuildNowPlayingContainer.js";
import { CV2_FLAG } from "../utilities/ComponentsV2.js";

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
    nplaying
      .edit({ flags: CV2_FLAG, components: [buildNowPlayingContainer(client, player, language)] })
      .catch(() => null);
    new ReplyInteractionService(
      client,
      message,
      `${client.i18n.get(language, "button.music", player.paused ? "pause_msg" : "resume_msg")}`
    );
  }
}