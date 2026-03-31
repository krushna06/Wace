import { EmbedBuilder, ApplicationCommandOptionType, Message } from "discord.js";
import { convertTime } from "../../utilities/ConvertTime.js";
import { Manager } from "../../manager.js";
import { Playlist } from "../../database/schema/Playlist.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { AutocompleteInteractionChoices, GlobalInteraction } from "../../@types/Interaction.js";
import { CommandInteraction, AutocompleteInteraction } from "discord.js";
let playlist: Playlist | null;

export default class implements Command {
  public name = ["pl", "import"];
  public description = "Import a playlist to queue.";
  public category = "Playlist";
  public accessableby = [Accessableby.Member];
  public usage = "<playlist_id>";
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
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const value = handler.args[0] ? handler.args[0] : null;

    let player = client.players.get(handler.guild!.id);

    if (value == null)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${client.i18n.get(handler.language, "command.playlist", "invalid")}`)
            .setColor(client.color),
        ],
      });

    if (value) {
      playlist = await client.db.playlist.get(`${value}`);
    }

    if (!playlist)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${client.i18n.get(handler.language, "command.playlist", "invalid")}`)
            .setColor(client.color),
        ],
      });

    if (playlist.private && playlist.owner !== handler.user?.id) {
      handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "command.playlist", "import_private")}`
            )
            .setColor(client.color),
        ],
      });
      return;
    }

    const { channel } = handler.member!.voice;
    if (!channel)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "command.playlist", "import_voice")}`
            )
            .setColor(client.color),
        ],
      });
    const SongAdd = [];
    let SongLoad = 0;

    const totalDuration = convertTime(playlist.tracks!.reduce((acc, cur) => acc + cur.length!, 0));

    if (playlist.tracks?.length == 0)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "command.playlist", "import_empty")}`
            )
            .setColor(client.color),
        ],
      });

    if (!player)
      player = await client.playerManager.create({
        guildId: handler.guild!.id,
        voiceId: handler.member!.voice.channel!.id,
        textId: handler.channel!.id,
        shardId: handler.guild?.shardId ?? 0,
        deaf: true,
        volume: client.config.player.DEFAULT_VOLUME,
      });

    player.textId = handler.channel!.id;

    for (let i = 0; i < playlist.tracks!.length; i++) {
      const res = await player.search(playlist.tracks![i].uri, {
        requester: handler.user,
      });
      if (res.type == "TRACK") {
        SongAdd.push(res.tracks[0]);
        SongLoad++;
      } else if (res.type == "PLAYLIST") {
        for (let t = 0; t < res.tracks.length; t++) {
          SongAdd.push(res.tracks[t]);
          SongLoad++;
        }
      } else if (res.type == "SEARCH") {
        SongAdd.push(res.tracks[0]);
        SongLoad++;
      }
      if (SongLoad == playlist.tracks!.length) {
        player.queue.push(...SongAdd);
        const embed = new EmbedBuilder()
          .setDescription(
            `${client.i18n.get(handler.language, "command.playlist", "import_imported", {
              name: playlist.name,
              tracks: String(playlist.tracks!.length),
              duration: totalDuration,
              user: String(handler.user),
            })}`
          )
          .setColor(client.color);

        handler.editReply({ content: " ", embeds: [embed] });
        if (!player.playing) {
          player.play();
        }
      }
    }
  }

  public async autocomplete(client: Manager, interaction: GlobalInteraction, language: string) {
    let choice: AutocompleteInteractionChoices[] = [];
    
    try {
      // @ts-ignore
      const idOption = (interaction as CommandInteraction).options.get("id");
      const focusedValue = String(idOption?.value || "").toLowerCase();
      
      const fullList = await client.db.playlist.all();
      
      if (fullList && Array.isArray(fullList)) {
        const userId = (interaction as CommandInteraction).user.id;
        const userPlaylists = fullList
          .filter((data: any) => {
            return data && data.value && data.value.owner === userId;
          })
          .map((data: any) => data.value)
          .filter((playlist: any) => {
            if (!playlist || !playlist.name || !playlist.id) return false;
            return playlist.name.toLowerCase().includes(focusedValue) || 
                   playlist.id.toLowerCase().includes(focusedValue);
          })
          .slice(0, 25);

        for (const playlist of userPlaylists) {
          choice.push({
            name: playlist.name,
            value: playlist.id,
          });
        }
      }
    } catch (error) {
      client.logger.error("Autocomplete playlist error:", error);
    }

    await (interaction as AutocompleteInteraction).respond(choice).catch(() => {});
  }
}