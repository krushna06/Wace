import { ApplicationCommandOptionType, CommandInteraction, AutocompleteInteraction } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { AutocompleteInteractionChoices, GlobalInteraction } from "../../@types/Interaction.js";
import { getPlaylistAutocomplete } from "../../utilities/PlaylistAutocomplete.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["pl", "remove"];
  public description = "Remove a song from a playlist";
  public category = "Playlist";
  public accessableby = [Accessableby.Member];
  public usage = "<playlist_id> <song_postion>";
  public aliases = [];
  public lavalink = true;
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
      name: "postion",
      description: "The position of the song",
      required: true,
      type: ApplicationCommandOptionType.Integer,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
      await handler.deferReply();

      const value = handler.args[0] ? handler.args[0] : null;
      const pos = handler.args[1];
      const reply = (desc: string) => handler.editReply({ flags: CV2_FLAG, components: [cv2.simple(desc, client.color)] });

      if (value == null) return reply(`${client.i18n.get(handler.language, "command.playlist", "invalid")}`);
      if (pos && isNaN(+pos)) return reply(`${client.i18n.get(handler.language, "error", "number_invalid")}`);

      const playlist = await client.db.playlist.get(`${value}`);
      if (!playlist) return reply(`${client.i18n.get(handler.language, "command.playlist", "remove_notfound")}`);
      if (playlist.owner !== handler.user?.id) return reply(`${client.i18n.get(handler.language, "command.playlist", "remove_owner")}`);

      const song = playlist.tracks![Number(pos) - 1];
      if (!song) return reply(`${client.i18n.get(handler.language, "command.playlist", "remove_song_notfound")}`);

      await client.db.playlist.pull(`${value}.tracks`, playlist.tracks![Number(pos) - 1]);
      return reply(`${client.i18n.get(handler.language, "command.playlist", "remove_removed", { name: value, position: pos })}`);
    }

  public async autocomplete(client: Manager, interaction: GlobalInteraction, language: string) {
    // @ts-ignore
    const idOption = (interaction as CommandInteraction).options.get("id");
    const focusedValue = String(idOption?.value || "").toLowerCase();

    const choices = await getPlaylistAutocomplete(client, interaction, focusedValue);
    await (interaction as AutocompleteInteraction).respond(choices).catch(() => {});
  }
}