import { PlayOptions, VoiceChannelOptions } from "../Interface/Player.js";
import { Wacelink } from "../Wacelink.js";
import { WacelinkNode } from "../Node/WacelinkNode.js";
import { WacelinkQueue } from "./WacelinkQueue.js";
import {
  WacelinkEvents,
  WacelinkFilterData,
  WacelinkLoopMode,
  WacelinkPlayerState,
  VoiceConnectState,
  VoiceState,
} from "../Interface/Constants.js";
import { WacelinkTrack } from "./WacelinkTrack.js";
import { UpdatePlayerInfo, UpdatePlayerOptions } from "../Interface/Rest.js";
import { WacelinkSearchOptions, WacelinkSearchResult } from "../Interface/Manager.js";
import { WacelinkPlugin } from "../Plugin/VoiceReceiver/Plugin.js";
import { ServerUpdate, StateUpdatePartial } from "../Interface/Connection.js";
import { EventEmitter } from "node:events";
import { WacelinkDatabase } from "../Utilities/WacelinkDatabase.js";
import { WacelinkFilter } from "./WacelinkFilter.js";

export class WacelinkPlayer extends EventEmitter {
  /**
   * Main manager class
   */
  public manager: Wacelink;
  /**
   * Player's current using lavalink server
   */
  public node: WacelinkNode;
  /**
   * Player's guild id
   */
  public guildId: string;
  /**
   * Player's voice id
   */
  public voiceId: string | null;
  /**
   * Player's text id
   */
  public textId: string;
  /**
   * Player's queue
   */
  public readonly queue: WacelinkQueue;
  /**
   * The temporary database of player, u can set any thing here and us like Map class!
   */
  public readonly data: WacelinkDatabase<unknown>;
  /**
   * Whether the player is paused or not
   */
  public paused: boolean;
  /**
   * Get the current track's position of the player
   */
  public position: number;
  /**
   * Get the current volume of the player
   */
  public volume: number;
  /**
   * Whether the player is playing or not
   */
  public playing: boolean;
  /**
   * Get the current loop mode of the player
   */
  public loop: WacelinkLoopMode;
  /**
   * Get the current state of the player
   */
  public state: WacelinkPlayerState;
  /**
   * Whether the player is deafened or not
   */
  public deaf: boolean;
  /**
   * Whether the player is muted or not
   */
  public mute: boolean;
  /**
   * ID of the current track
   */
  public track: string | null;
  /**
   * All function to extend support driver
   */
  public functions: WacelinkDatabase<(...args: any) => unknown>;
  /**
   * ID of the Shard that contains the guild that contains the connected voice channel
   */
  public shardId: number;
  /**
   * ID of the last voiceId connected to
   */
  public lastvoiceId: string | null;
  /**
   * ID of current session
   */
  public sessionId: string | null;
  /**
   * Region of connected voice channel
   */
  public region: string | null;
  /**
   * Last region of the connected voice channel
   */
  public lastRegion: string | null;
  /**
   * Cached serverUpdate event from Lavalink
   */
  public serverUpdate: ServerUpdate | null;
  /**
   * Connection state
   */
  public voiceState: VoiceConnectState;
  /** @ignore */
  public sudoDestroy: boolean;
  public filter: WacelinkFilter;

  /**
   * The wacelink player handler class
   * @param manager The wacelink manager
   * @param voiceOptions The wacelink voice option, use VoiceChannelOptions interface
   * @param node The wacelink current use node
   */
  constructor(manager: Wacelink, voiceOptions: VoiceChannelOptions, node: WacelinkNode) {
    super();
    this.manager = manager;
    this.guildId = voiceOptions.guildId;
    this.voiceId = voiceOptions.voiceId;
    this.shardId = voiceOptions.shardId;
    this.mute = voiceOptions.mute ?? false;
    this.deaf = voiceOptions.deaf ?? false;
    this.lastvoiceId = null;
    this.sessionId = null;
    this.region = null;
    this.lastRegion = null;
    this.serverUpdate = null;
    this.voiceState = VoiceConnectState.DISCONNECTED;
    this.node = node;
    this.guildId = voiceOptions.guildId;
    this.voiceId = voiceOptions.voiceId;
    this.textId = voiceOptions.textId;
    const customQueue =
      this.manager.wacelinkOptions.options!.structures && this.manager.wacelinkOptions.options!.structures.queue;
    this.queue = customQueue ? new customQueue(this.manager, this) : new WacelinkQueue(this.manager, this);
    this.filter = new WacelinkFilter(this);
    this.data = new WacelinkDatabase<unknown>();
    this.paused = true;
    this.position = 0;
    this.volume = this.manager.wacelinkOptions.options!.defaultVolume!;
    this.playing = false;
    this.loop = WacelinkLoopMode.NONE;
    this.state = WacelinkPlayerState.DESTROYED;
    this.deaf = voiceOptions.deaf ?? false;
    this.mute = voiceOptions.mute ?? false;
    this.sudoDestroy = false;
    this.track = null;
    this.functions = new WacelinkDatabase<(...args: any) => unknown>();
    if (this.node.driver.playerFunctions.size !== 0) {
      this.node.driver.playerFunctions.forEach((data, index) => {
        this.functions.set(index, data.bind(null, this));
      });
    }
    if (voiceOptions.volume && voiceOptions.volume !== this.volume) this.volume = voiceOptions.volume;
  }

  /**
   * Sends server update to lavalink
   * @internal
   */
  public async sendServerUpdate(): Promise<void> {
    const playerUpdate = {
      guildId: this.guildId,
      playerOptions: {
        voice: {
          token: this.serverUpdate!.token,
          endpoint: this.serverUpdate!.endpoint,
          sessionId: this.sessionId!,
        },
      },
    };
    this.node.rest.updatePlayer(playerUpdate);
  }

  /**
   * Destroy the player
   * @internal
   */
  public async destroy(): Promise<void> {
    this.checkDestroyed();
    this.sudoDestroy = true;
    this.clear(false);
    this.disconnect();
    const voiceReceiver = this.manager.plugins.get("wacelink-voiceReceiver") as WacelinkPlugin;
    if (voiceReceiver && this.node.driver.id.includes("nodelink")) voiceReceiver.close(this.guildId);
    this.node.rest.updatePlayer({
      guildId: this.guildId,
      playerOptions: {
        track: {
          encoded: null,
          length: 0,
        },
      },
    });
    this.node.rest.destroyPlayer(this.guildId);
    this.manager.players.delete(this.guildId);
    this.state = WacelinkPlayerState.DESTROYED;
    this.debug("Player destroyed at " + this.guildId);
    this.voiceId = "";
    this.manager.emit(WacelinkEvents.PlayerDestroy, this);
    this.sudoDestroy = false;
  }

  /**
   * Play a track
   * @param track Track to play
   * @param options Play options
   * @returns WacelinkPlayer
   */
  public async play(track?: WacelinkTrack, options?: PlayOptions): Promise<WacelinkPlayer> {
    this.checkDestroyed();

    if (track && !(track instanceof WacelinkTrack)) throw new Error("track must be a WacelinkTrack");

    if (!track && !this.queue.totalSize) throw new Error("No track is available to play");

    if (!options || typeof options.replaceCurrent !== "boolean") options = { ...options, replaceCurrent: false };

    if (track) {
      if (!options.replaceCurrent && this.queue.current) this.queue.unshift(this.queue.current);
      this.queue.current = track;
    } else if (!this.queue.current) this.queue.current = this.queue.shift();

    if (!this.queue.current) throw new Error("No track is available to play");

    const current = this.queue.current;

    let errorMessage: string | undefined;

    const resolveResult = await current.resolver(this.manager, { nodeName: this.node.options.name }).catch((e: any) => {
      errorMessage = e.message;
      return null;
    });

    if (!resolveResult || (resolveResult && !resolveResult.isPlayable)) {
      this.manager.emit(WacelinkEvents.TrackResolveError, this, current, errorMessage);
      this.debug(`Player ${this.guildId} resolve error: ${errorMessage}`);
      this.queue.current = null;
      this.queue.size ? await this.play() : this.manager.emit(WacelinkEvents.QueueEmpty, this);
      return this;
    }

    this.playing = true;
    this.track = current.encoded;

    const playerOptions: UpdatePlayerOptions = {
      track: {
        encoded: current.encoded,
        length: current.duration,
      },
      ...options,
      volume: this.volume,
    };

    if (playerOptions.paused) {
      this.paused = playerOptions.paused;
      this.playing = !this.paused;
    }
    if (playerOptions.position) this.position = playerOptions.position;

    this.node.rest.updatePlayer({
      guildId: this.guildId,
      noReplace: options?.noReplace ?? false,
      playerOptions,
    });

    return this;
  }

  /**
   * Set the loop mode of the track
   * @param mode Mode to loop
   * @returns WacelinkPlayer
   */
  public setLoop(mode: WacelinkLoopMode): WacelinkPlayer {
    this.checkDestroyed();
    this.loop = mode;
    return this;
  }

  /**
   * Search track directly from player
   * @param query The track search query link
   * @param options The track search options
   * @returns WacelinkSearchResult
   */
  public async search(query: string, options?: WacelinkSearchOptions): Promise<WacelinkSearchResult> {
    this.checkDestroyed();
    return await this.manager.search(query, options);
  }

  /**
   * Pause the track
   * @returns WacelinkPlayer
   */
  public async pause(): Promise<WacelinkPlayer> {
    this.checkDestroyed();
    if (this.paused == true) return this;
    await this.node.rest.updatePlayer({
      guildId: this.guildId,
      playerOptions: {
        paused: true,
      },
    });
    this.paused = true;
    this.playing = false;
    this.manager.emit(WacelinkEvents.PlayerPause, this, this.queue.current);
    return this;
  }

  /**
   * Resume the track
   * @returns WacelinkPlayer
   */
  public async resume(): Promise<WacelinkPlayer> {
    this.checkDestroyed();
    if (this.paused == false) return this;
    this.node.rest.updatePlayer({
      guildId: this.guildId,
      playerOptions: {
        paused: false,
      },
    });
    this.paused = false;
    this.playing = true;
    this.manager.emit(WacelinkEvents.PlayerResume, this, this.queue.current);
    return this;
  }

  /**
   * Pause or resume a track but different method
   * @param mode Whether to pause or not
   * @returns WacelinkPlayer
   */
  public async setPause(mode: boolean): Promise<WacelinkPlayer> {
    this.checkDestroyed();
    if (this.paused == mode) return this;
    await this.node.rest.updatePlayer({
      guildId: this.guildId,
      playerOptions: {
        paused: mode,
      },
    });
    this.paused = mode;
    this.playing = !mode;
    this.manager.emit(mode ? WacelinkEvents.PlayerPause : WacelinkEvents.PlayerResume, this, this.queue.current);
    return this;
  }

  /**
   * Play the previous track
   * @returns WacelinkPlayer
   */
  public async previous(): Promise<WacelinkPlayer> {
    this.checkDestroyed();
    const prevoiusData = this.queue.previous;
    const current = this.queue.current;
    const index = prevoiusData.length - 1;
    if (index === -1 || !current) return this;
    await this.play(prevoiusData[index]);
    this.queue.previous.splice(index, 1);
    return this;
  }

  /**
   * Get all previous track
   * @returns WacelinkTrack[]
   */
  public getPrevious(): WacelinkTrack[] {
    this.checkDestroyed();
    return this.queue.previous;
  }

  /**
   * Skip the current track
   * @returns WacelinkPlayer
   */
  public async skip(): Promise<WacelinkPlayer> {
    this.checkDestroyed();
    this.node.rest.updatePlayer({
      guildId: this.guildId,
      playerOptions: {
        track: {
          encoded: null,
        },
      },
    });
    return this;
  }

  /**
   * Seek to another position in track
   * @param position Position to seek
   * @returns WacelinkPlayer
   */
  public async seek(position: number): Promise<WacelinkPlayer> {
    this.checkDestroyed();
    if (!this.queue.current) throw new Error("Player has no current track in it's queue");
    if (!this.queue.current.isSeekable) throw new Error("The current track isn't seekable");

    position = Number(position);

    if (isNaN(position)) throw new Error("position must be a number");
    if (position < 0 || position > (this.queue.current.duration ?? 0))
      position = Math.max(Math.min(position, this.queue.current.duration ?? 0), 0);

    await this.node.rest.updatePlayer({
      guildId: this.guildId,
      playerOptions: {
        position: position,
      },
    });
    this.queue.current.position = position;
    return this;
  }

  /**
   * Set another volume in player
   * @param volume Volume to cange
   * @returns WacelinkPlayer
   */
  public async setVolume(volume: number): Promise<WacelinkPlayer> {
    this.checkDestroyed();
    if (isNaN(volume)) throw new Error("volume must be a number");
    await this.node.rest.updatePlayer({
      guildId: this.guildId,
      playerOptions: {
        volume: volume,
      },
    });
    this.volume = volume;
    return this;
  }

  /**
   * Set player to mute or unmute
   * @param enable Enable or not
   * @returns WacelinkPlayer
   */
  public setMute(enable: boolean): WacelinkPlayer {
    this.checkDestroyed();
    if (enable == this.mute) return this;
    this.mute = enable;
    this.sendVoiceUpdate();
    return this;
  }

  /**
   * Stop all avtivities and reset to default
   * @param destroy Whenever you want to destroy a player or not
   * @returns WacelinkPlayer
   */
  public async stop(destroy: boolean): Promise<WacelinkPlayer> {
    this.checkDestroyed();

    if (destroy) {
      await this.destroy();
      return this;
    }

    this.clear(false);

    this.node.rest.updatePlayer({
      guildId: this.guildId,
      playerOptions: {
        track: {
          encoded: null,
        },
      },
    });
    this.manager.emit(WacelinkEvents.TrackEnd, this, this.queue.current);
    this.manager.emit(WacelinkEvents.PlayerStop, this);
    return this;
  }

  /**
   * Reset all data to default
   * @param Whenever emit empty event or not
   * @inverval
   */
  public clear(emitEmpty: boolean): void {
    this.loop = WacelinkLoopMode.NONE;
    this.queue.clear();
    this.queue.current = undefined;
    this.queue.previous.length = 0;
    this.volume = this.manager.wacelinkOptions!.options!.defaultVolume ?? 100;
    this.paused = true;
    this.playing = false;
    this.track = null;
    if (!this.data.get("sudo-destroy")) this.data.clear();
    this.position = 0;
    if (emitEmpty) this.manager.emit(WacelinkEvents.QueueEmpty, this);
    return;
  }

  /**
   * Set player to deaf or undeaf
   * @param enable Enable or not
   * @returns WacelinkPlayer
   */
  public setDeaf(enable: boolean): WacelinkPlayer {
    this.checkDestroyed();
    if (enable == this.deaf) return this;
    this.deaf = enable;
    this.sendVoiceUpdate();
    return this;
  }

  /**
   * Disconnect from the voice channel
   * @returns WacelinkPlayer
   */
  public disconnect(): WacelinkPlayer {
    this.checkDestroyed();
    if (this.voiceState === VoiceConnectState.DISCONNECTED) return this;
    this.voiceId = null;
    this.deaf = false;
    this.mute = false;
    this.removeAllListeners();
    this.sendVoiceUpdate();
    this.voiceState = VoiceConnectState.DISCONNECTED;
    this.pause();
    this.state = WacelinkPlayerState.DISCONNECTED;
    this.debug(`Player disconnected; Guild id: ${this.guildId}`);
    return this;
  }

  /**
   * Connect from the voice channel
   * @returns WacelinkPlayer
   */
  public async connect(): Promise<WacelinkPlayer> {
    if (this.state === WacelinkPlayerState.CONNECTED || !this.voiceId) return this;
    if (this.voiceState === VoiceConnectState.CONNECTING || this.voiceState === VoiceConnectState.CONNECTED)
      return this;
    this.voiceState = VoiceConnectState.CONNECTING;
    this.sendVoiceUpdate();
    this.debugDiscord(`Requesting Connection | Guild: ${this.guildId}`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.manager.wacelinkOptions.options!.voiceConnectionTimeout);
    try {
      const [status] = await WacelinkPlayer.once(this, "connectionUpdate", {
        signal: controller.signal,
      });
      if (status !== VoiceState.SESSION_READY) {
        switch (status) {
          case VoiceState.SESSION_ID_MISSING:
            throw new Error("The voice connection is not established due to missing session id");
          case VoiceState.SESSION_ENDPOINT_MISSING:
            throw new Error("The voice connection is not established due to missing connection endpoint");
        }
      }
      this.voiceState = VoiceConnectState.CONNECTED;
    } catch (error: any) {
      this.debugDiscord(`Request Connection Failed | Guild: ${this.guildId}`);
      if (error.name === "AbortError")
        throw new Error(
          `The voice connection is not established in ${this.manager.wacelinkOptions.options!.voiceConnectionTimeout}ms`
        );
      throw error;
    } finally {
      clearTimeout(timeout);
      this.state = WacelinkPlayerState.CONNECTED;
      this.debug(`Player ${this.guildId} connected`);
    }
    return this;
  }

  /**
   * Set text channel
   * @param textId Text channel ID
   * @returns WacelinkPlayer
   */
  public setTextChannel(textId: string): WacelinkPlayer {
    this.checkDestroyed();
    this.textId = textId;
    return this;
  }

  /**
   * Set voice channel and move the player to the voice channel
   * @param voiceId Voice channel ID
   * @returns WacelinkPlayer
   */
  public setVoiceChannel(voiceId: string): WacelinkPlayer {
    this.checkDestroyed();
    this.disconnect();
    this.voiceId = voiceId;
    this.connect();
    this.debugDiscord(`Player ${this.guildId} moved to voice channel ${voiceId}`);
    return this;
  }

  /**
   * Set a filter that prebuilt in wacelink
   * @param filter The filter name
   * @returns WacelinkPlayer
   */
  public async setFilter(filter: keyof typeof WacelinkFilterData): Promise<WacelinkPlayer> {
    this.checkDestroyed();

    const filterData = WacelinkFilterData[filter as keyof typeof WacelinkFilterData];

    if (!filterData) throw new Error("Filter not found");

    await this.send({
      guildId: this.guildId,
      playerOptions: {
        filters: filterData,
      },
    });

    return this;
  }

  /**
   * Send custom player update data to lavalink server
   * @param data Data to change
   * @returns WacelinkPlayer
   */
  public send(data: UpdatePlayerInfo): WacelinkPlayer {
    this.checkDestroyed();
    this.node.rest.updatePlayer(data);
    return this;
  }

  protected debug(logs: string): void {
    this.manager.emit(WacelinkEvents.Debug, `[Wacelink] / [Player @ ${this.guildId}] | ${logs}`);
  }

  protected debugDiscord(logs: string): void {
    this.manager.emit(WacelinkEvents.Debug, `[Wacelink] / [Player @ ${this.guildId}] / [Voice] | ${logs}`);
  }

  protected checkDestroyed(): void {
    if (this.state === WacelinkPlayerState.DESTROYED) throw new Error("Player is destroyed");
  }

  /**
   * Send voice data to discord
   * @internal
   */
  public sendVoiceUpdate() {
    this.sendDiscord({
      guild_id: this.guildId,
      channel_id: this.voiceId,
      self_deaf: this.deaf,
      self_mute: this.mute,
    });
  }

  /**
   * Send data to Discord
   * @param data The data to send
   * @internal
   */
  public sendDiscord(data: any): void {
    this.manager.library.sendPacket(this.shardId, { op: 4, d: data }, false);
  }

  /**
   * Sets the server update data for this connection
   * @internal
   */
  public setServerUpdate(data: ServerUpdate): void {
    if (!data.endpoint) {
      this.emit("connectionUpdate", VoiceState.SESSION_ENDPOINT_MISSING);
      return;
    }
    if (!this.sessionId) {
      this.emit("connectionUpdate", VoiceState.SESSION_ID_MISSING);
      return;
    }

    this.lastRegion = this.region?.repeat(1) || null;
    this.region = data.endpoint.split(".").shift()?.replace(/[0-9]/g, "") || null;

    if (this.region && this.lastRegion !== this.region) {
      this.debugDiscord(
        `Voice Region Moved | Old Region: ${this.lastRegion} New Region: ${this.region} Guild: ${this.guildId}`
      );
    }

    this.serverUpdate = data;
    this.emit("connectionUpdate", VoiceState.SESSION_READY);
    this.debugDiscord(`Server Update Received | Server: ${this.region} Guild: ${this.guildId}`);
  }

  /**
   * Update Session ID, Channel ID, Deafen status and Mute status of this instance
   * @internal
   */
  public setStateUpdate({ session_id, channel_id, self_deaf, self_mute }: StateUpdatePartial): void {
    this.lastvoiceId = this.voiceId?.repeat(1) || null;
    this.voiceId = channel_id || null;

    if (this.voiceId && this.lastvoiceId !== this.voiceId) {
      this.debugDiscord(`Channel Moved | Old Channel: ${this.voiceId} Guild: ${this.guildId}`);
    }

    if (!this.voiceId) {
      this.voiceState = VoiceConnectState.DISCONNECTED;
      this.debugDiscord(`Channel Disconnected | Guild: ${this.guildId}`);
    }

    this.deaf = self_deaf;
    this.mute = self_mute;
    this.sessionId = session_id || null;
    this.debugDiscord(
      `State Update Received | Channel: ${this.voiceId} Session ID: ${session_id} Guild: ${this.guildId}`
    );
  }
}
