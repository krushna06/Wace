import { Manager } from "../manager.js";
import { ExtendedTrack } from "../structures/Player.js";

export function getTitle(client: Manager, track: ExtendedTrack) {
  if (client.config.player.AVOID_SUSPEND) return track.info.title;
  return `[${track.info.title}](${track.info.uri})`;
}