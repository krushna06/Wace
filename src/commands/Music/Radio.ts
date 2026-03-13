import {
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  CommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { convertTime } from "../../utilities/ConvertTime.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { AutocompleteInteractionChoices, GlobalInteraction } from "../../@types/Interaction.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Player, ExtendedTrack } from "../../structures/Player.js";
import { AutoFixSearch } from "../../autofix/AutoFixSearch.js";
import { getNode } from "../../utilities/GetNode.js";

type SearchResultType = "TRACK" | "PLAYLIST" | "SEARCH";

export default class implements Command {
  public name = ["radio"];
  public description = "Play a radio.";
  public category = "Music";
  public accessableby = [Accessableby.Member];
  public usage = "select";
  public aliases = ["radio", "rad", "rd"];
  public lavalink = true;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "iloveradio",
      description: "Select a radio station from ILOVERADIO",
      required: false,
      type: ApplicationCommandOptionType.String,
      choices: [
        { name: "Standard", value: "https://streams.ilovemusic.de/iloveradio1.mp3" },
        { name: "Dance", value: "https://streams.ilovemusic.de/iloveradio2.mp3" },
        { name: "Hip-hop", value: "https://streams.ilovemusic.de/iloveradio3.mp3" },
        { name: "Top-100-Charts", value: "https://streams.ilovemusic.de/iloveradio9.mp3" },
      ],
    },
    {
      name: "reyfm",
      description: "Select a radio station from REYFM",
      required: false,
      type: ApplicationCommandOptionType.String,
      choices: [
        { name: "ORIGINAL", value: "https://listen.reyfm.de/original_320kbps.mp3" },
        { name: "NIGHTLIFE", value: "https://listen.reyfm.de/nightlife_320kbps.mp3" },
        { name: "HITSONLY", value: "https://listen.reyfm.de/hitsonly_320kbps.mp3" },
        { name: "GAMING", value: "https://listen.reyfm.de/gaming_320kbps.mp3" },
        { name: "HOUSEPARTY", value: "https://listen.reyfm.de/houseparty_320kbps.mp3" },
        { name: "CHILLOUT", value: "https://listen.reyfm.de/chillout_320kbps.mp3" },
        { name: "LOFI", value: "https://listen.reyfm.de/lofi_320kbps.mp3" },
        { name: "OLDSCHOOL", value: "https://listen.reyfm.de/oldschool_320kbps.mp3" },
        { name: "MASHUP", value: "https://listen.reyfm.de/mashup_320kbps.mp3" },
        { name: "PARTYHARD", value: "https://listen.reyfm.de/partyhard_320kbps.mp3" },
        { name: "KPOP", value: "https://listen.reyfm.de/kpop_320kbps.mp3" },
      ],
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    try {
      await handler.deferReply();

      let player = client.players.get(handler.guild!.id);

      const value = handler.args.join(" ");

      if (!value)
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`${client.i18n.get(handler.language, "command.music", "play_arg")}`)
              .setColor(client.color),
          ],
        });

      const { channel } = handler.member!.voice;
      if (!channel)
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`${client.i18n.get(handler.language, "error", "no_in_voice")}`)
              .setColor(client.color),
          ],
        });

      const emotes = (str: string) => str.match(/<a?:.+?:\d{18}>|\p{Extended_Pictographic}/gu);

      if (emotes(value) !== null)
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`${client.i18n.get(handler.language, "command.music", "play_emoji")}`)
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
      else if (player && !this.checkSameVoice(client, handler, handler.language)) {
        return;
      }

      const result = await player.search(value, { requester: handler.user });
      const tracks = result.tracks;

      if (!result.tracks.length && client.config.utilities.AUTOFIX_LAVALINK.enable) {
        const autoFixSearch = new AutoFixSearch(client, player, value, handler.user);
        const autoFixResult = await autoFixSearch.execute();

        if (!autoFixResult || !autoFixResult.tracks.length) {
          return handler.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(`${client.i18n.get(handler.language, "command.music", "play_match")}`)
                .setColor(client.color),
            ],
          });
        }
      } else if (!result.tracks.length) {
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`${client.i18n.get(handler.language, "command.music", "play_match")}`)
              .setColor(client.color),
          ],
        });
      }
      if (result.type === "PLAYLIST") for (let track of tracks) player.queue.push(track);
      else if (player.playing && result.type === "SEARCH") player.queue.push(tracks[0]);
      else if (player.playing && result.type !== "SEARCH")
        for (let track of tracks) player.queue.push(track);
      else player.queue.push(tracks[0]);

      const TotalDuration = player.queue.reduce((acc, t) => acc + (t.duration || t.info?.length || 0), 0);

      if (handler.message) await handler.message.delete().catch(() => null);

      if (!player.playing) await player.play().catch((err) => {
        client.logger.error("Radio command error:", err);
      });

      if (result.type === "TRACK") {
        const embed = new EmbedBuilder()
          .setDescription(
            `${client.i18n.get(handler.language, "command.music", "play_track", {
              title: this.getTitle(client, result.type, tracks),
              duration: convertTime(tracks[0].duration as number),
              request: String(tracks[0].requester),
            })}`
          )
          .setColor(client.color);

        handler.editReply({ content: " ", embeds: [embed] });
      } else if (result.type === "PLAYLIST") {
        const embed = new EmbedBuilder()
          .setDescription(
            `${client.i18n.get(handler.language, "command.music", "play_playlist", {
              title: this.getTitle(client, result.type, tracks, value),
              duration: convertTime(TotalDuration),
              songs: String(tracks.length),
              request: String(tracks[0].requester),
            })}`
          )
          .setColor(client.color);

        handler.editReply({ content: " ", embeds: [embed] });
      } else if (result.type === "SEARCH") {
        const embed = new EmbedBuilder().setColor(client.color).setDescription(
          `${client.i18n.get(handler.language, "command.music", "play_result", {
            title: this.getTitle(client, result.type, tracks),
            duration: convertTime(tracks[0].duration as number),
            request: String(tracks[0].requester),
          })}`
        );

        handler.editReply({ content: " ", embeds: [embed] });
      }
    } catch (error: any) {
      if (error?.code === 10062) {
        client.logger.warn("Radio", "Interaction expired (took too long to respond)");
        return;
      }
      client.logger.error("Radio", error);
    }
  }

  checkSameVoice(client: Manager, handler: CommandHandler, language: string) {
    if (handler.member!.voice.channel !== handler.guild!.members.me!.voice.channel) {
      handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${client.i18n.get(handler.language, "error", "no_same_voice")}`)
            .setColor(client.color),
        ],
      });
      return false;
    }

    return true;
  }

  getTitle(
    client: Manager,
    type: SearchResultType,
    tracks: ExtendedTrack[],
    value?: string
  ): string {
    if (client.config.player.AVOID_SUSPEND) return tracks[0].title;
    else {
      if (type === "PLAYLIST") {
        return `[${tracks[0].title}](${value})`;
      } else {
        return `[${tracks[0].title}](${tracks[0].uri})`;
      }
    }
  }


  async autocomplete(client: Manager, interaction: GlobalInteraction, language: string) {
    let choice: AutocompleteInteractionChoices[] = [];
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