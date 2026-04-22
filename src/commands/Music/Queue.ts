import { ApplicationCommandOptionType } from "discord.js";
import { formatDuration } from "../../utilities/FormatDuration.js";
import { PageQueue } from "../../structures/PageQueue.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Player } from "../../structures/Player.js";
import { getTitle } from "../../utilities/GetTitle.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["queue"];
  public description = "Show the queue of songs.";
  public category = "Music";
  public accessableby = [Accessableby.Member];
  public usage = "<page_number>";
  public aliases = [];
  public lavalink = true;
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public permissions = [];
  public options = [
    {
      name: "page",
      description: "Page number to show.",
      type: ApplicationCommandOptionType.Number,
      required: false,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const value = handler.args[0];

    if (value && isNaN(+value))
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "error", "number_invalid")}`, client.color)],
      });

    const player = client.players.get(handler.guild!.id) as Player;

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
        `**${i + 1}.** ${getTitle(client, song)} \`[${formatDuration(song.duration)}]\``
      );
    }

    const pages = [];
    for (let i = 0; i < pagesNum; i++) {
      const str = songStrings.slice(i * 10, i * 10 + 10).join("\n");

      const page = cv2.build({
        author: `${client.i18n.get(handler.language, "command.music", "queue_author", { guild: handler.guild!.name })}`,
        thumbnail,
        color: client.color,
        description: `${client.i18n.get(handler.language, "command.music", "queue_description", {
          title: getTitle(client, song!),
          request: String(song!.requester),
          duration: formatDuration(song!.duration),
          rest: str == "" ? "  Nothing" : "\n" + str,
        })}`,
      });

      pages.push(page);
    }

    if (!value) {
      if (pages.length == pagesNum && player.queue.length > 10) {
        if (handler.message) {
          await new PageQueue(client, pages, 60000, player.queue.length, handler.language).prefixPage(handler.message, qduration);
        } else if (handler.interaction) {
          await new PageQueue(client, pages, 60000, player.queue.length, handler.language).slashPage(handler.interaction, qduration);
        } else return;
      } else return handler.editReply({ flags: CV2_FLAG, components: [pages[0]] });
    } else {
      if (isNaN(+value))
        return handler.editReply({
          flags: CV2_FLAG,
          components: [cv2.simple(`${client.i18n.get(handler.language, "command.music", "queue_notnumber")}`, client.color)],
        });
      if (Number(value) > pagesNum)
        return handler.editReply({
          flags: CV2_FLAG,
          components: [cv2.simple(`${client.i18n.get(handler.language, "command.music", "queue_page_notfound", { page: String(pagesNum) })}`, client.color)],
        });
      const pageNum = Number(value) == 0 ? 1 : Number(value) - 1;
      return handler.editReply({ flags: CV2_FLAG, components: [pages[pageNum]] });
    }
  }
}
