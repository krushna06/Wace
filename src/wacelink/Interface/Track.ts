import { WacelinkPlayer } from "../Player/WacelinkPlayer.js";

export interface ResolveOptions {
  /** Whenever u want to overwrite the track or not */
  overwrite?: boolean;
  /** Wacelink player property */
  player?: WacelinkPlayer;
  /** The name of node */
  nodeName?: string;
}
