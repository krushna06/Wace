import {
  ButtonInteraction,
  CacheType,
  InteractionCollector,
  Message,
} from "discord.js";
import { PlayerButton } from "../@types/Button.js";
import { Manager } from "../manager.js";
import { formatDuration } from "../utilities/FormatDuration.js";
import { Player } from "../structures/Player.js";
import { getTitle } from "../utilities/GetTitle.js";
import { cv2, CV2_FLAG } from "../utilities/ComponentsV2.js";
export default class implements PlayerButton {
  name = "queue";
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
    const song = player.current;
    const qduration = `${formatDuration(song!.duration + player.queue.reduce((acc, t) => acc + (t.duration || t.info?.length || 0), 0))}`;
    const thumbnail =
      song?.artworkUrl ?? `https://img.youtube.com/vi/${song!.identifier}/hqdefault.jpg`;
    let pagesNum = Math.ceil(player.queue.length / 10);
    if (pagesNum === 0) pagesNum = 1;
    const songStrings = [];
    for (let i = 0; i < player.queue.length; i++) {
      const song = player.queue[i];
      songStrings.push(
        `**${i + 1}.** ${getTitle(client, song)} \`[${formatDuration(song.duration)}]\`
        `
      );
    }
    const pages = [];
    for (let i = 0; i < pagesNum; i++) {
      const str = songStrings.slice(i * 10, i * 10 + 10).join("");
      const page = cv2.build({
        author: `${client.i18n.get(language, "button.music", "queue_author", { guild: message.guild!.name })}`,
        thumbnail,
        color: client.color,
        description: `${client.i18n.get(language, "button.music", "queue_description", {
          track: getTitle(client, song!),
          duration: formatDuration(song?.duration),
          requester: `${song!.requester}`,
          list_song: str == "" ? "  Nothing" : "\n" + str,
        })}`,
      });
      pages.push(page);
    }
    message.reply({ flags: CV2_FLAG, components: [pages[0]], ephemeral: true });
  }
}