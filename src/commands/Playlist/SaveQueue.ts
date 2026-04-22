import { ApplicationCommandOptionType, CommandInteraction, AutocompleteInteraction } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { ExtendedTrack } from "../../structures/Player.js";
import { AutocompleteInteractionChoices, GlobalInteraction } from "../../@types/Interaction.js";
import { getPlaylistAutocomplete } from "../../utilities/PlaylistAutocomplete.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

const TrackAdd: ExtendedTrack[] = [];
const TrackExist: string[] = [];
let Result: ExtendedTrack[] | null = null;

export default class implements Command {
  public name = ["pl", "savequeue"];
  public description = "Save the current queue to a playlist";
  public category = "Playlist";
  public accessableby = [Accessableby.Member];
  public usage = "<playlist_id>";
  public aliases = ["pl-sq"];
  public lavalink = true;
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public permissions = [];
  public options = [
    {
      name: "id",
      description: "The id of the playlist",
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
      await handler.deferReply();

      const value = handler.args[0] ? handler.args[0] : null;
      const reply = (desc: string) => handler.editReply({ flags: CV2_FLAG, components: [cv2.simple(desc, client.color)] });

      if (value == null) return reply(`${client.i18n.get(handler.language, "command.playlist", "invalid")}`);

      const playlist = await client.db.playlist.get(`${value}`);
      if (!playlist) return reply(`${client.i18n.get(handler.language, "command.playlist", "savequeue_notfound")}`);
      if (playlist.owner !== handler.user?.id) return reply(`${client.i18n.get(handler.language, "command.playlist", "savequeue_owner")}`);

      const player = client.players.get(handler.guild!.id);
      const queue = player?.queue || [];
      const current = player?.current;

      if (queue.length == 0 && !current) return reply(`${client.i18n.get(handler.language, "noplayer", "savequeue_no_tracks")}`);

      TrackAdd.push(current as ExtendedTrack);
      TrackAdd.push(...queue);

      if (!playlist) Result = TrackAdd;

      if (playlist.tracks) {
        for (let i = 0; i < playlist.tracks.length; i++) {
          TrackExist.push(playlist.tracks[i].uri);
        }
        Result = TrackAdd.filter((track) => !TrackExist.includes(String(track.info.uri)));
      }

      if (Result!.length == 0) {
        TrackAdd.length = 0;
        TrackExist.length = 0;
        Result = null;
        return reply(`${client.i18n.get(handler.language, "command.playlist", "savequeue_no_new_saved", { name: value })}`);
      }

      await handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.playlist", "savequeue_saved", { name: value, tracks: String(queue.length + 1) })}`, client.color)],
      });

      Result!.forEach(async (track) => {
        await client.db.playlist.push(`${value}.tracks`, {
          title: track.info.title,
          uri: track.info.uri,
          length: track.duration || track.info?.length,
          thumbnail: track.info.artworkUrl,
          author: track.info.author,
          requester: track.requester,
        });
      });

      TrackAdd.length = 0;
      TrackExist.length = 0;
      Result = null;
    }

  public async autocomplete(client: Manager, interaction: GlobalInteraction, language: string) {
    // @ts-ignore
    const idOption = (interaction as CommandInteraction).options.get("id");
    const focusedValue = String(idOption?.value || "").toLowerCase();

    const choices = await getPlaylistAutocomplete(client, interaction, focusedValue);
    await (interaction as AutocompleteInteraction).respond(choices).catch(() => {});
  }
}