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
import { WacelinkPlayer } from "../wacelink/main.js";

export default class implements PlayerButton {
  name = "stop";
  async run(
    client: Manager,
    message: ButtonInteraction<CacheType>,
    language: string,
    player: WacelinkPlayer,
    nplaying: Message<boolean>,
    collector: InteractionCollector<ButtonInteraction<"cached">>
  ): Promise<any> {
    collector.stop();

    player.data.set("sudo-destroy", true);
    const is247 = await client.db.autoreconnect.get(message.guildId);
    player.stop(is247 && is247.twentyfourseven ? false : true);

    const embed = new EmbedBuilder()
      .setDescription(client.i18n.get(language, "button.music", "stop_msg"))
      .setImage(
        "https://media.discordapp.net/attachments/890634398981042246/1251990013193879562/54.png?ex=6675dc0f&is=66748a8f&hm=d8da087fdf8cc829c1509a651ffd5028768f388d0d1b810c9dd1ce56e55683a6&=&format=webp&quality=lossless&width=1440&height=468"
      );

    await message.reply({ embeds: [embed] });

    new ReplyInteractionService(
      client,
      message,
      client.i18n.get(language, "button.music", "stop_msg")
    );
  }
}
