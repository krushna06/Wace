import { ButtonInteraction, CacheType, InteractionCollector, Message } from "discord.js";
import { Manager } from "../manager.js";
import { WacelinkPlayer } from "../wacelink/main.js";

export class PlayerButton {
  name: string = "";
  async run(
    client: Manager,
    message: ButtonInteraction,
    language: string,
    player: WacelinkPlayer,
    nplaying: Message,
    collector: InteractionCollector<ButtonInteraction<"cached">>
  ): Promise<any> {}
}
