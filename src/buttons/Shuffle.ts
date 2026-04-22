import {
  ButtonInteraction,
  CacheType,
  InteractionCollector,
  Message,
  User,
} from "discord.js";
import { PlayerButton } from "../@types/Button.js";
import { Manager } from "../manager.js";
import { formatDuration } from "../utilities/FormatDuration.js";
import { PageQueue } from "../structures/PageQueue.js";
import { Player } from "../structures/Player.js";
import { getTitle } from "../utilities/GetTitle.js";
import { cv2, CV2_FLAG } from "../utilities/ComponentsV2.js";
export default class implements PlayerButton {
  name = "shuffle";
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
    await player.shuffle();
    const song = player.current;
    const qduration = `${formatDuration((song?.info.length || 0) + player.queue.reduce((acc, t) => acc + (t.duration || t.info?.length || 0), 0))}`;
    const thumbnail =
      song?.info.artworkUrl ?? `https://img.youtube.com/vi/${song?.info.identifier}/hqdefault.jpg`;
    let pagesNum = Math.ceil(player.queue.length / 10);
    if (pagesNum === 0) pagesNum = 1;
    const songStrings = [];
    for (let i = 0; i < player.queue.length; i++) {
      const song = player.queue[i];
      songStrings.push(
        `**${i + 1}.** ${getTitle(client, song)} \`[${formatDuration(song.duration || song.info?.length)}]\`
        `
      );
    }
    const pages = [];
    for (let i = 0; i < pagesNum; i++) {
      const str = songStrings.slice(i * 10, i * 10 + 10).join("");
      const page = cv2.build({
        author: `${client.i18n.get(language, "button.music", "shuffle_msg")}`,
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
    client.wsl.get(message.guild!.id)?.send({
      op: "playerQueueShuffle",
      guild: message.guild!.id,
      queue: player.queue.map((track) => {
        const requesterQueue = track.requester as User;
        return {
          title: track.info.title,
          uri: track.info.uri,
          length: track.duration || track.info?.length,
          thumbnail: track.info.artworkUrl,
          author: track.info.author,
          requester: requesterQueue
            ? {
                id: requesterQueue.id,
                username: requesterQueue.username,
                globalName: requesterQueue.globalName,
                defaultAvatarURL: requesterQueue.defaultAvatarURL ?? null,
              }
            : null,
        };
      }),
    });
    if (pages.length == pagesNum && player.queue.length > 10) {
      await new PageQueue(client, pages, 60000, player.queue.length, language).buttonPage(message, qduration);
    } else message.reply({ flags: CV2_FLAG, components: [pages[0]], ephemeral: true });
  }
}