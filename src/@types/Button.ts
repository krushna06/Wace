import { ButtonInteraction, CacheType, InteractionCollector, Message } from "discord.js";
import { Manager } from "../manager.js";
import { Player } from "../structures/Player.js";

export class PlayerButton {
  name: string = "";
  async run(
    client: Manager,
    message: ButtonInteraction,
    language: string,
    player: Player,
    nplaying: Message,
    collector: InteractionCollector<ButtonInteraction<"cached">>
  ): Promise<any> {}
}
