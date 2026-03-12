import {
  ApplicationCommandOptionType,
  EmbedBuilder,
} from "discord.js";
import { convertTime } from "../../utilities/ConvertTime.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Player } from "../../structures/Player.js";
import { getLastPlayedSongForGuild, getLastPlayedSongForUser } from "../../database/handler.js";
import { AutoFixSearch } from "../../autofix/AutoFixSearch.js";

export default class implements Command {
  public name = ["lastplayed"];
  public description = "Play the last played song for guild or user";
  public category = "Music";
  public accessableby = [Accessableby.Member];
  public usage = "<type: guild/user>";
  public aliases = ["lp", "last"];
  public lavalink = true;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "type",
      description: "The type of last played song to play",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: "Guild",
          value: "guild",
        },
        {
          name: "User",
          value: "user",
        },
      ],
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const type = handler.args[0]?.toLowerCase();

    if (!type || !["guild", "user"].includes(type))
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${client.i18n.get(handler.language, "command.music", "lastplayed_invalid_type")}`)
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

    let player = client.players.get(handler.guild!.id);

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

    player.textId = handler.channel!.id;

    let lastPlayed;
    if (type === "guild") {
      lastPlayed = await getLastPlayedSongForGuild(client.db, handler.guild!.id);
      if (!lastPlayed)
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`${client.i18n.get(handler.language, "command.music", "lastplayed_notfound_guild")}`)
              .setColor(client.color),
          ],
        });
    } else {
      lastPlayed = await getLastPlayedSongForUser(client.db, handler.user!.id);
      if (!lastPlayed)
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`${client.i18n.get(handler.language, "command.music", "lastplayed_notfound_user")}`)
              .setColor(client.color),
          ],
        });
    }

    const result = await player.search(lastPlayed.uri, { requester: handler.user });
    const tracks = result.tracks;

    if (!result.tracks.length && client.config.utilities.AUTOFIX_LAVALINK.enable) {
      const autoFixSearch = new AutoFixSearch(client, player, lastPlayed.uri, handler.user);
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

    if (handler.message) await handler.message.delete().catch(() => null);

    if (!player.playing) player.play();

    const embed = new EmbedBuilder()
      .setDescription(
        type === "guild"
          ? `${client.i18n.get(handler.language, "command.music", "lastplayed_guild", {
              title: this.getTitle(client, result.type, tracks),
              duration: convertTime(tracks[0].duration as number),
              request: String(tracks[0].requester),
            })}`
          : `${client.i18n.get(handler.language, "command.music", "lastplayed_user", {
              title: this.getTitle(client, result.type, tracks),
              duration: convertTime(tracks[0].duration as number),
              request: String(tracks[0].requester),
            })}`
      )
      .setColor(client.color);

    handler.editReply({ content: " ", embeds: [embed] });
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
}