import { WacelinkEvents, WacelinkPluginType } from "../../Interface/Constants.js";
import { Wacelink } from "../../Wacelink.js";
import { WacelinkPlugin as Plugin } from "../WacelinkPlugin.js";

export class WacelinkPlugin extends Plugin {
  private wacelink: Wacelink | null = null;

  /**
   * Initialize the plugin.
   * @param client Discord.Client
   */
  constructor(public client: any) {
    super();
  }

  /**
   * Type of the plugin
   * @returns WacelinkPluginType
   */
  public type(): WacelinkPluginType {
    return WacelinkPluginType.Default;
  }

  /**
   * Load the plugin.
   * @param wacelink wacelink
   */
  public load(wacelink: Wacelink): void {
    this.wacelink = wacelink;
    this.client.on("voiceStateUpdate", this.onVoiceStateUpdate.bind(this));
  }

  /**
   * The name of the plugin
   * @returns string
   */
  public name(): string {
    return "wacelink-playerMoved";
  }

  /**
   * Unload the plugin.
   */
  public unload(): void {
    this.client.removeListener("voiceStateUpdate", this.onVoiceStateUpdate.bind(this));
    this.wacelink = null;
  }

  private onVoiceStateUpdate(oldState: any, newState: any): void {
    if (!this.wacelink || oldState.id !== this.client.user.id) return;

    const newChannelId = newState.channelID || newState.channelId;
    const oldChannelId = oldState.channelID || oldState.channelId;
    const guildId = newState.guild.id;

    const player = this.wacelink.players.get(guildId);
    if (!player) return;

    let state = "UNKNOWN";
    if (!oldChannelId && newChannelId) state = "JOINED";
    else if (oldChannelId && !newChannelId) state = "LEFT";
    else if (oldChannelId && newChannelId && oldChannelId !== newChannelId) state = "MOVED";

    if (state === "UNKNOWN") return;
    // @ts-ignore
    this.wacelink.emit(WacelinkEvents.PlayerMoved, player, state, {
      oldChannelId,
      newChannelId,
    });
  }
}
