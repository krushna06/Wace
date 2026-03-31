import {
  EmbedBuilder,
  ApplicationCommandOptionType,
  CommandInteraction,
  AutocompleteInteraction,
} from "discord.js";
import { convertTime } from "../../utilities/ConvertTime.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { AutocompleteInteractionChoices, GlobalInteraction } from "../../@types/Interaction.js";
import { ExtendedTrack } from "../../structures/Player.js";
import { getNode } from "../../utilities/GetNode.js";

type SearchResultType = "TRACK" | "PLAYLIST" | "SEARCH";

const TrackAdd: ExtendedTrack[] = [];

export default class implements Command {
  public name = ["pl", "add"];
  public description = "Add song to a playlist";
  public category = "Playlist";
  public accessableby = [Accessableby.Member];
  public usage = "<playlist_id> <url_or_name>";
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
      name: "search",
      description: "The song link or name",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const value = handler.args[0] ? handler.args[0] : null;
    if (value == null || !value)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${client.i18n.get(handler.language, "command.playlist", "invalid")}`)
            .setColor(client.color),
        ],
      });

    const input = handler.args[1];

    const Inputed = input;

    if (!input)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${client.i18n.get(handler.language, "command.playlist", "add_match")}`)
            .setColor(client.color),
        ],
      });

    const result = await getNode(client)?.rest.resolve(input);
    
    if (!result) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${client.i18n.get(handler.language, "command.playlist", "add_match")}`)
            .setColor(client.color),
        ],
      });
    }

    let tracks: ExtendedTrack[] = [];
    let resultType: SearchResultType = "SEARCH";

    switch (result.loadType) {
      case "track":
        const trackData = result.data as any;
        tracks = [{
          ...trackData,
          requester: handler.user,
          duration: trackData.info?.length || trackData.length,
          title: trackData.info?.title || trackData.title,
          uri: trackData.info?.uri || trackData.uri,
          author: trackData.info?.author || trackData.author,
          artworkUrl: trackData.info?.artworkUrl || trackData.artworkUrl,
          identifier: trackData.info?.identifier || trackData.identifier,
        }];
        resultType = "TRACK";
        break;
      case "playlist":
        const playlistData = result.data as any;
        tracks = (playlistData.tracks || []).map((track: any) => ({
          ...track,
          requester: handler.user,
          duration: track.info?.length || track.length,
          title: track.info?.title || track.title,
          uri: track.info?.uri || track.uri,
          author: track.info?.author || track.author,
          artworkUrl: track.info?.artworkUrl || track.artworkUrl,
          identifier: track.info?.identifier || track.identifier,
        }));
        resultType = "PLAYLIST";
        break;
      case "search":
        tracks = (result.data as any[]).map((track: any) => ({
          ...track,
          requester: handler.user,
          duration: track.info?.length || track.length,
          title: track.info?.title || track.title,
          uri: track.info?.uri || track.uri,
          author: track.info?.author || track.author,
          artworkUrl: track.info?.artworkUrl || track.artworkUrl,
          identifier: track.info?.identifier || track.identifier,
        }));
        resultType = "SEARCH";
        break;
      case "empty":
      case "error":
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`${client.i18n.get(handler.language, "command.playlist", "add_match")}`)
              .setColor(client.color),
          ],
        });
    }

    if (!tracks || tracks.length === 0)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${client.i18n.get(handler.language, "command.playlist", "add_match")}`)
            .setColor(client.color),
        ],
      });
    if (resultType === "PLAYLIST") for (let track of tracks) TrackAdd.push(track);
    else TrackAdd.push(tracks[0]);

    const Duration = convertTime(tracks[0].duration as number);
    const TotalDuration = tracks.reduce(
      (acc, cur) => acc + (cur.duration || 0),
      0
    );

    if (resultType === "PLAYLIST") {
      const embed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(handler.language, "command.playlist", "add_playlist", {
            title: this.getTitle(client, resultType, tracks, Inputed),
            duration: convertTime(TotalDuration),
            track: String(tracks.length),
            user: String(handler.user),
          })}`
        )
        .setColor(client.color);
      handler.editReply({ content: " ", embeds: [embed] });
    } else if (resultType === "TRACK") {
      const embed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(handler.language, "command.playlist", "add_track", {
            title: this.getTitle(client, resultType, tracks),
            duration: Duration,
            user: String(handler.user),
          })}`
        )
        .setColor(client.color);
      handler.editReply({ content: " ", embeds: [embed] });
    } else if (resultType === "SEARCH") {
      const embed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(handler.language, "command.playlist", "add_search", {
            title: this.getTitle(client, resultType, tracks),
            duration: Duration,
            user: String(handler.user),
          })}`
        )
        .setColor(client.color);
      handler.editReply({ content: " ", embeds: [embed] });
    } else {

      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${client.i18n.get(handler.language, "command.playlist", "add_match")}`)
            .setColor(client.color),
        ],
      });
    }

    const playlist = await client.db.playlist.get(value);

    if (!playlist)
      return handler.followUp({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${client.i18n.get(handler.language, "command.playlist", "invalid")}`)
            .setColor(client.color),
        ],
      });

    if (playlist.owner !== handler.user?.id) {
      handler.followUp({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${client.i18n.get(handler.language, "command.playlist", "add_owner")}`)
            .setColor(client.color),
        ],
      });
      TrackAdd.length = 0;
      return;
    }
    const LimitTrack = playlist.tracks!.length + TrackAdd.length;

    if (LimitTrack > client.config.player.LIMIT_TRACK) {
      handler.followUp({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "command.playlist", "add_limit_track", {
                limit: String(client.config.player.LIMIT_TRACK),
              })}`
            )
            .setColor(client.color),
        ],
      });
      TrackAdd.length = 0;
      return;
    }

    TrackAdd.forEach(async (track) => {
      await client.db.playlist.push(`${value}.tracks`, {
        title: track.info.title,
        uri: track.info.uri,
        length: track.duration || track.info?.length,
        thumbnail: track.info.artworkUrl,
        author: track.info.author,
        requester: track.requester,
      });
    });

    const embed = new EmbedBuilder()
      .setDescription(
        `${client.i18n.get(handler.language, "command.playlist", "add_added", {
          count: String(TrackAdd.length),
          playlist: value,
        })}`
      )
      .setColor(client.color);

    handler.followUp({ content: " ", embeds: [embed] });
    TrackAdd.length = 0;
  }

  getTitle(
    client: Manager,
    type: SearchResultType,
    tracks: ExtendedTrack[],
    value?: string
  ): string {
    const title = tracks[0]?.title || tracks[0]?.info?.title || "Unknown";
    if (client.config.player.AVOID_SUSPEND) return title;
    else {
      if (type === "PLAYLIST") {
        return `[${title}](${value})`;
      } else {
        return `[${title}](${tracks[0]?.uri || tracks[0]?.info?.uri || ""})`;
      }
    }
  }


  public async autocomplete(client: Manager, interaction: GlobalInteraction, language: string) {
    let choice: AutocompleteInteractionChoices[] = [];
    // @ts-ignore
    const focusedOption = (interaction as CommandInteraction).options.getFocused(true);

    if (focusedOption.name === "id") {
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
      return;
    }

    // @ts-ignore
    const url = String((interaction as CommandInteraction).options.get("search")!.value);

    const Random =
      client.config.player.AUTOCOMPLETE_SEARCH[
        Math.floor(Math.random() * client.config.player.AUTOCOMPLETE_SEARCH.length)
      ];

    const match = client.REGEX.some((match) => {
      return match.test(url) == true;
    });

    if (match == true) {
      choice.push({ name: url, value: url });
      await (interaction as AutocompleteInteraction).respond(choice).catch(() => {});
      return;
    }

    if (client.lavalinkUsing.length == 0) {
      choice.push({
        name: `${client.i18n.get(language, "error", "no_node")}`,
        value: `${client.i18n.get(language, "error", "no_node")}`,
      });
      return;
    }

    try {
      const searchRes = await getNode(client)?.rest.resolve(url || Random);

      if (!searchRes) {
        return choice.push({ name: "Error song not matches", value: url });
      }


      let tracks: any[] = [];
      switch (searchRes.loadType) {
        case "track":
          tracks = [searchRes.data];
          break;
        case "playlist":
          tracks = (searchRes.data as any).tracks || [];
          break;
        case "search":
          tracks = searchRes.data as any[];
          break;
        case "empty":
        case "error":
          return choice.push({ name: "Error song not matches", value: url });
      }

      if (!tracks || tracks.length === 0) {
        return choice.push({ name: "Error song not matches", value: url });
      }

      for (let i = 0; i < Math.min(10, tracks.length); i++) {
        const x = tracks[i];
        choice.push({
          name: x && x.info?.title ? x.info.title : "Unknown track name",
          value: x && x.info?.uri ? x.info.uri : url,
        });
      }
    } catch (error) {
      client.logger.error("Autocomplete search error:", error);
      choice.push({ name: "Search error - try again", value: url });
    }

    await (interaction as AutocompleteInteraction).respond(choice).catch(() => {});
  }
}