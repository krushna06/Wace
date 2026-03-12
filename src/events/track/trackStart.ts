import { Manager } from "../../manager.js";
import { ComponentType, TextChannel } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { formatDuration } from "../../utilities/FormatDuration.js";
import { filterSelect, playerRowOne, playerRowTwo } from "../../utilities/PlayerControlButton.js";
import { AutoReconnectBuilderService } from "../../services/AutoReconnectBuilderService.js";
import { SongNotiEnum } from "../../database/schema/SongNoti.js";
import { Player, ExtendedTrack } from "../../structures/Player.js";
import { FilterName } from "../../structures/Filters.js";
import { getTitle } from "../../utilities/GetTitle.js";
import { incrementUserSongPlay, incrementGuildSongPlay, incrementGuildSongStats, setGuildLastPlayed, setUserLastPlayed, logUserPlayHistory } from "../../database/handler.js";

export default class {
  async execute(client: Manager, player: Player, track: ExtendedTrack) {
    if (!client.isDatabaseConnected)
      return client.logger.warn(
        "DatabaseService",
        "The database is not yet connected so this event will temporarily not execute. Please try again later!"
      );

    const guild = await client.guilds.fetch(player.guildId).catch(() => undefined);
    client.logger.info("TrackStart", `Track Started in @ ${guild!.name} / ${player.guildId}`);

    let SongNoti = await client.db.songNoti.get(`${player.guildId}`);
    if (!SongNoti)
      SongNoti = await client.db.songNoti.set(`${player.guildId}`, SongNotiEnum.Enable);

    if (!player) return;

    client.logger.debug("TrackStart", `Track parameter: ${track?.info.title}, requester: ${JSON.stringify(track?.requester)}`);

    const playlistUri = player.data.get("playlist-uri");
    const isFirstTrackOfPlaylist = player.data.get("playlist-first-track");

    if (track && track.requester && player.guildId) {
      let userId: string;
      if (typeof track.requester === 'object' && track.requester !== null) {
        userId = (track.requester as any).id || String(track.requester);
      } else {
        userId = String(track.requester);
      }

      if (userId && userId !== '[object Object]' && userId.length > 0) {
        try {
          await incrementUserSongPlay(client.db, userId, player.guildId);
          await incrementGuildSongPlay(client.db, player.guildId);
          await incrementGuildSongStats(client.db, player.guildId, track, userId);

          const uriToSave = (playlistUri && isFirstTrackOfPlaylist) ? playlistUri : track.info.uri;
          const trackToSave = (playlistUri && isFirstTrackOfPlaylist)
            ? { ...track, uri: playlistUri }
            : track;

          await setGuildLastPlayed(client.db, player.guildId, trackToSave);
          await setUserLastPlayed(client.db, userId, trackToSave);
          await logUserPlayHistory(client.db, userId, player.guildId, track);

          if (isFirstTrackOfPlaylist) {
            player.data.delete("playlist-first-track");
          }
        } catch (error) {
          client.logger.error("TrackStart", `Failed to save track stats: ${error instanceof Error ? error.message : String(error)}`);
          if (error instanceof Error && error.message.includes('EPERM')) {
            client.logger.warn("TrackStart", "Database file is locked. This can happen on Windows. The track will still play normally.");
          }
        }
      }
    }


    await client.UpdateQueueMsg(player);


    const channel = (await client.channels
      .fetch(player.textId)
      .catch(() => undefined)) as TextChannel;
    if (!channel) return;

    if (client.config.utilities.AUTO_RESUME) {
      const autoreconnect = new AutoReconnectBuilderService(client, player);
      const getData = await autoreconnect.get(player.guildId);
      if (!getData) await autoreconnect.playerBuild(player.guildId);
      else {
        await client.db.autoreconnect.set(`${player.guildId}.current`, player.current?.uri);
        await client.db.autoreconnect.set(`${player.guildId}.config.loop`, player.loop);

        function queueUri() {
          const res = [];
          for (let data of player.queue) {
            res.push(data.uri);
          }
          return res.length !== 0 ? res : [];
        }

        function previousUri() {
          const res = [];
          if (player.previousQueue) {
            for (let data of player.previousQueue) {
              res.push(data.uri);
            }
          }
          return res.length !== 0 ? res : [];
        }

        await client.db.autoreconnect.set(`${player.guildId}.queue`, queueUri());
        await client.db.autoreconnect.set(`${player.guildId}.previous`, previousUri());
      }
    }

    const song = player.current;

    let data = await client.db.setup.get(`${channel.guild.id}`);
    if (data && player.textId === data.channel) return;

    let guildModel = await client.db.language.get(`${channel.guild.id}`);
    if (!guildModel) {
      guildModel = await client.db.language.set(`${channel.guild.id}`, client.config.bot.LANGUAGE);
    }

    const language = guildModel;

    if (song) {

      for (const [key] of player.data.entries()) {
        if (key.startsWith("voteskip_")) {
          player.data.delete(key);
        }
      }
    }

    if (SongNoti == SongNotiEnum.Disable) return;

    let dashboardUrl = client.config.utilities.DASHBOARD_URL;
    let dashboardGuildUrl = "";
    if (dashboardUrl && dashboardUrl.trim() !== "") {
      dashboardUrl = dashboardUrl.replace(/\/$/, "");
      dashboardGuildUrl = `${dashboardUrl}/guild/${player.guildId}`;
    }
    const embedFields = [
      {
        name: `${client.i18n.get(language, "event.player", "author_title")}`,
        value: `${song!.author}`,
        inline: true,
      },
      {
        name: `${client.i18n.get(language, "event.player", "duration_title")}`,
        value: `${formatDuration(song!.duration)}`,
        inline: true,
      },
      {
        name: `${client.i18n.get(language, "event.player", "request_title")}`,
        value: `${song!.requester}`,
        inline: true,
      },
      {
        name: `${client.i18n.get(language, "event.player", "download_title")}`,
        value: `**[${song!.title} - 000tube.com](https://www.000tube.com/watch?v=${song?.identifier})**`,
        inline: false,
      },
    ];
    if (dashboardGuildUrl) {
      embedFields.push({
        name: `Dashboard`,
        value: `[Music Controller](${dashboardGuildUrl})`,
        inline: false,
      });
    }
    const embeded = new EmbedBuilder()
      .setAuthor({
        name: `${client.i18n.get(language, "event.player", "track_title")}`,
        iconURL: `${client.i18n.get(language, "event.player", "track_icon")}`,
      })
      .setDescription(`**${getTitle(client, track)}**`)
      .addFields(embedFields)
      .setColor(client.color)
      .setThumbnail(
        track.info.artworkUrl ?? `https://img.youtube.com/vi/${track.identifier}/hqdefault.jpg`
      )
      .setTimestamp();

    const playing_channel = (await client.channels
      .fetch(player.textId)
      .catch(() => undefined)) as TextChannel;

    const nplaying = playing_channel
      ? await playing_channel.send({
          embeds: [embeded],
          components: [filterSelect(client), playerRowOne(client), playerRowTwo(client)],

        })
      : undefined;

    if (!nplaying) return;

    const collector = nplaying.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (message) => {
        if (
          message.guild!.members.me!.voice.channel &&
          message.guild!.members.me!.voice.channelId === message.member!.voice.channelId
        )
          return true;
        else {
          message.reply({
            content: `${client.i18n.get(language, "event.player", "join_voice")}`,
            ephemeral: true,
          });
          return false;
        }
      },
    });

    const collectorFilter = nplaying.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: (message) => {
        if (
          message.guild!.members.me!.voice.channel &&
          message.guild!.members.me!.voice.channelId === message.member!.voice.channelId
        )
          return true;
        else {
          message.reply({
            content: `${client.i18n.get(language, "event.player", "join_voice")}`,
            ephemeral: true,
          });
          return false;
        }
      },
    });

    client.nplayingMsg.set(player.guildId, {
      coll: collector,
      msg: nplaying,
      filterColl: collectorFilter,
    });

    collectorFilter.on("collect", async (message): Promise<void> => {
      const filterMode = message.values[0] as FilterName;

      if (player.data.get("filter-mode") == filterMode) {
        const embed = new EmbedBuilder()
          .setDescription(
            `${client.i18n.get(language, "button.music", "filter_already", { name: filterMode })}`
          )
          .setColor(client.color);
        const msg = await message
          .reply({
            embeds: [embed],
          })
          .catch(() => {});
        if (msg)
          setTimeout(
            () => msg.delete().catch(() => {}),
            client.config.utilities.DELETE_MSG_TIMEOUT
          );
        return;
      }

      if (filterMode == "clear" && !player.data.get("filter-mode")) {
        const embed = new EmbedBuilder()
          .setDescription(`${client.i18n.get(language, "button.music", "reset_already")}`)
          .setColor(client.color);
        const msg = await message
          .reply({
            embeds: [embed],
          })
          .catch(() => {});
        if (msg)
          setTimeout(
            () => msg.delete().catch(() => {}),
            client.config.utilities.DELETE_MSG_TIMEOUT
          );
        return;
      }

      filterMode == "clear"
        ? player.data.delete("filter-mode")
        : player.data.set("filter-mode", filterMode);
      filterMode == "clear" ? await player.filters.clear() : await player.filters.set(filterMode);

      const embed = new EmbedBuilder()
        .setDescription(
          filterMode == "clear"
            ? `${client.i18n.get(language, "button.music", "reset_on")}`
            : `${client.i18n.get(language, "button.music", "filter_on", { name: filterMode })}`
        )
        .setColor(client.color);

      const msg = await message
        .reply({
          embeds: [embed],
        })
        .catch(() => {});
      if (msg)
        setTimeout(() => msg.delete().catch(() => {}), client.config.utilities.DELETE_MSG_TIMEOUT);
    });

    collector.on("collect", async (message): Promise<void> => {
      const id = message.customId;
      const button = client.plButton.get(id);

      const language = guildModel;

      if (button) {
        try {
          button.run(client, message, String(language), player, nplaying, collector);
        } catch (err) {
          client.logger.error("ButtonError", err);
        }
      }
    });

    collector.on("end", (): void => {
      // @ts-ignore
      collector.removeAllListeners();
    });

    collectorFilter.on("end", (): void => {
      // @ts-ignore
      collectorFilter.removeAllListeners();
    });
  }
}