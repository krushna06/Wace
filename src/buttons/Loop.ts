import { ButtonInteraction, CacheType, InteractionCollector, Message } from "discord.js";
import { PlayerButton } from "../@types/Button.js";
import { Manager } from "../manager.js";
import { ReplyInteractionService } from "../services/ReplyInteractionService.js";
import { WacelinkLoopMode, WacelinkPlayer } from "../wacelink/main.js";

export default class implements PlayerButton {
  name = "loop";
  async run(
    client: Manager,
    message: ButtonInteraction<CacheType>,
    language: string,
    player: WacelinkPlayer,
    nplaying: Message<boolean>,
    collector: InteractionCollector<ButtonInteraction<"cached">>
  ): Promise<any> {
    if (!player) {
      collector.stop();
    }

    async function setLoop247(loop: string) {
      if (await client.db.autoreconnect.get(player.guildId)) {
        await client.db.autoreconnect.set(`${player.guildId}.config.loop`, loop);
      }
    }

    switch (player.loop) {
      case "none":
        player.setLoop(WacelinkLoopMode.SONG);

        if (client.config.utilities.AUTO_RESUME) setLoop247(WacelinkLoopMode.SONG);

        new ReplyInteractionService(
          client,
          message,
          `${client.i18n.get(language, "button.music", "loop_current")}`
        );

        client.wsl.get(message.guild!.id)?.send({
          op: "playerLoop",
          guild: message.guild!.id,
          mode: "song",
        });

        break;

      case "song":
        player.setLoop(WacelinkLoopMode.QUEUE);

        if (client.config.utilities.AUTO_RESUME) setLoop247(WacelinkLoopMode.QUEUE);

        new ReplyInteractionService(
          client,
          message,
          `${client.i18n.get(language, "button.music", "loop_all")}`
        );

        client.wsl.get(message.guild!.id)?.send({
          op: "playerLoop",
          guild: message.guild!.id,
          mode: "queue",
        });

        break;

      case "queue":
        player.setLoop(WacelinkLoopMode.NONE);

        if (client.config.utilities.AUTO_RESUME) setLoop247(WacelinkLoopMode.NONE);

        new ReplyInteractionService(
          client,
          message,
          `${client.i18n.get(language, "button.music", "unloop_all")}`
        );

        client.wsl.get(message.guild!.id)?.send({
          op: "playerLoop",
          guild: message.guild!.id,
          mode: "none",
        });

        break;
    }
  }
}
