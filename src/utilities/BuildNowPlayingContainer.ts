import { Manager } from "../manager.js";
import { Player } from "../structures/Player.js";
import { cv2 } from "./ComponentsV2.js";
import { filterSelect, playerRowOne, playerRowOneEdited, playerRowTwo } from "./PlayerControlButton.js";
import { formatDuration } from "./FormatDuration.js";
import { getTitle } from "./GetTitle.js";

export function buildNowPlayingContainer(client: Manager, player: Player, language: string) {
  const song = player.current;
  const rowOne = player.paused ? playerRowOneEdited(client) : playerRowOne(client);

  const embedFields = [
    {
      name: `${client.i18n.get(language, "event.player", "author_title")}`,
      value: `${song?.author ?? "Unknown"}`,
      inline: true,
    },
    {
      name: `${client.i18n.get(language, "event.player", "duration_title")}`,
      value: `${formatDuration(song?.duration)}`,
      inline: true,
    },
    {
      name: `${client.i18n.get(language, "event.player", "request_title")}`,
      value: `${song?.requester}`,
      inline: true,
    },
    {
      name: `${client.i18n.get(language, "event.player", "download_title")}`,
      value: `**[${song?.title} - 000tube.com](https://www.000tube.com/watch?v=${song?.identifier})**`,
    },
  ];

  let dashboardUrl = client.config.utilities.DASHBOARD_URL;
  if (dashboardUrl && dashboardUrl.trim() !== "") {
    dashboardUrl = dashboardUrl.replace(/\/$/, "");
    embedFields.push({
      name: "Dashboard",
      value: `[Music Controller](${dashboardUrl}/guild/${player.guildId})`,
    });
  }

  return cv2.build({
    color: client.color,
    author: `${client.i18n.get(language, "event.player", "track_title")}`,
    title: song ? getTitle(client, song) : "Unknown",
    thumbnail: song?.info?.artworkUrl ?? `https://img.youtube.com/vi/${song?.identifier}/hqdefault.jpg`,
    fields: embedFields,
    timestamp: true,
    components: [filterSelect(client, false), rowOne, playerRowTwo(client)],
  });
}
