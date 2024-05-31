import { Manager } from "../manager.js";
import { WacelinkTrack } from "../wacelink/main.js";

export function getTitle(client: Manager, track: WacelinkTrack) {
  if (client.config.player.AVOID_SUSPEND) return track.title;
  return `[${track.title}](${track.uri})`;
}
