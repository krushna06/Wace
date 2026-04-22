import { ApplicationCommandOptionType, Message, CommandInteraction, AutocompleteInteraction } from "discord.js";
import { formatDuration } from "../../utilities/FormatDuration.js";
import { PageQueue } from "../../structures/PageQueue.js";
import { Manager } from "../../manager.js";
import { PlaylistTrack } from "../../database/schema/Playlist.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { AutocompleteInteractionChoices, GlobalInteraction } from "../../@types/Interaction.js";
import { getPlaylistAutocomplete } from "../../utilities/PlaylistAutocomplete.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["pl", "detail"];
  public description = "View all your playlists";
  public category = "Playlist";
  public accessableby = [Accessableby.Member];
  public usage = "<playlist_id> <number>";
  public aliases = [];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  public options = [
    {
      name: "id",
      description: "The id of the playlist",
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    },
    {
      name: "page",
      description: "The page you want to view",
      required: false,
      type: ApplicationCommandOptionType.Integer,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
      await handler.deferReply();

      const value = handler.args[0] ? handler.args[0] : null;
      const number = handler.args[1];
      const reply = (desc: string) => handler.editReply({ flags: CV2_FLAG, components: [cv2.simple(desc, client.color)] });

      if (number && isNaN(+number)) return reply(`${client.i18n.get(handler.language, "error", "number_invalid")}`);
      if (!value) return reply(`${client.i18n.get(handler.language, "command.playlist", "detail_notfound")}`);

      const playlist = await client.db.playlist.get(value!);
      if (!playlist) return reply(`${client.i18n.get(handler.language, "command.playlist", "detail_notfound")}`);
      if (playlist.private && playlist.owner !== handler.user?.id) return reply(`${client.i18n.get(handler.language, "command.playlist", "detail_private")}`);

      let pagesNum = Math.ceil(playlist.tracks!.length / 10);
      if (pagesNum === 0) pagesNum = 1;

      const playlistStrings = playlist.tracks!.map((playlists, i) =>
        `${client.i18n.get(handler.language, "command.playlist", "detail_track", { num: String(i + 1), title: this.getTitle(client, playlists), author: String(playlists.author), duration: formatDuration(playlists.length) })}`
      );

      const totalDuration = formatDuration(playlist.tracks!.reduce((acc: number, cur: PlaylistTrack) => acc + cur.length!, 0));

      const pages = [];
      for (let i = 0; i < pagesNum; i++) {
        const str = playlistStrings.slice(i * 10, i * 10 + 10).join("\n");
        pages.push(cv2.build({
          author: `${client.i18n.get(handler.language, "command.playlist", "detail_embed_title", { name: playlist.name })}`,
          description: str == "" ? "  Nothing" : "\n" + str,
          color: client.color,
        }));
      }

      if (!number) {
        if (pages.length == pagesNum && playlist.tracks!.length > 10) {
          if (handler.message) await new PageQueue(client, pages, 30000, playlist.tracks!.length, handler.language).prefixPage(handler.message, totalDuration);
          else if (handler.interaction) await new PageQueue(client, pages, 30000, playlist.tracks!.length, handler.language).slashPage(handler.interaction, totalDuration);
        } else return handler.editReply({ flags: CV2_FLAG, components: [pages[0]] });
      } else {
        if (isNaN(+number)) return reply(`${client.i18n.get(handler.language, "command.playlist", "detail_notnumber")}`);
        if (Number(number) > pagesNum) return reply(`${client.i18n.get(handler.language, "command.playlist", "detail_page_notfound", { page: String(pagesNum) })}`);
        const pageNum = Number(number) == 0 ? 1 : Number(number) - 1;
        return handler.editReply({ flags: CV2_FLAG, components: [pages[pageNum]] });
      }
    }

  getTitle(client: Manager, tracks: PlaylistTrack): string {
    if (client.config.player.AVOID_SUSPEND) return String(tracks.title);
    else {
      return `[${tracks.title}](${tracks.uri})`;
    }
  }

  public async autocomplete(client: Manager, interaction: GlobalInteraction, language: string) {
    // @ts-ignore
    const idOption = (interaction as CommandInteraction).options.get("id");
    const focusedValue = String(idOption?.value || "").toLowerCase();

    const choices = await getPlaylistAutocomplete(client, interaction, focusedValue);
    await (interaction as AutocompleteInteraction).respond(choices).catch(() => {});
  }
}