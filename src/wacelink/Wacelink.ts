import {
  WacelinkAdditionalOptions,
  WacelinkOptions,
  WacelinkSearchOptions,
  WacelinkSearchResult,
  WacelinkSearchResultType,
} from "./Interface/Manager.js";
import { EventEmitter } from "node:events";
import { WacelinkNode } from "./Node/WacelinkNode.js";
import { AbstractLibrary } from "./Library/AbstractLibrary.js";
import { VoiceChannelOptions } from "./Interface/Player.js";
import { WacelinkPlayerManager } from "./Manager/WacelinkPlayerManager.js";
import { WacelinkNodeManager } from "./Manager/WacelinkNodeManager.js";
import {
  LavalinkLoadType,
  WacelinkEvents,
  WacelinkPluginType,
  SourceIDs,
} from "./Interface/Constants.js";
import { WacelinkTrack } from "./Player/WacelinkTrack.js";
import { RawTrack } from "./Interface/Rest.js";
import { WacelinkPlayer } from "./Player/WacelinkPlayer.js";
import { SourceWacelinkPlugin } from "./Plugin/SourceWacelinkPlugin.js";
import { WacelinkQueue } from "./Player/WacelinkQueue.js";
import { metadata } from "./metadata.js";
import { WacelinkPlugin } from "./Plugin/WacelinkPlugin.js";
import { AbstractDriver } from "./Drivers/AbstractDriver.js";
import { Lavalink3 } from "./Drivers/Lavalink3.js";
import { Nodelink2 } from "./Drivers/Nodelink2.js";
import { Lavalink4 } from "./Drivers/Lavalink4.js";
import { WacelinkDatabase } from "./Utilities/WacelinkDatabase.js";

export declare interface Wacelink {
  /* tslint:disable:unified-signatures */
  // ------------------------- ON EVENT ------------------------- //
  /**
   * Emitted when wacelink have a debug log.
   * @event Wacelink#debug
   */
  on(event: "debug", listener: (logs: string) => void): this;

  ////// ------------------------- Node Event ------------------------- /////
  /**
   * Emitted when a lavalink server is connected.
   * @event Wacelink#nodeConnect
   */
  on(event: "nodeConnect", listener: (node: WacelinkNode) => void): this;
  /**
   * Emitted when a lavalink server is disconnected.
   * @event Wacelink#nodeDisconnect
   */
  on(
    event: "nodeDisconnect",
    listener: (node: WacelinkNode, code: number, reason: Buffer) => void
  ): this;
  /**
   * Emitted when a lavalink server is closed.
   * @event Wacelink#nodeClosed
   */
  on(event: "nodeClosed", listener: (node: WacelinkNode) => void): this;
  /**
   * Emitted when a lavalink server is errored.
   * @event Wacelink#nodeError
   */
  on(event: "nodeError", listener: (node: WacelinkNode, error: Error) => void): this;
  ////// ------------------------- Node Event ------------------------- /////

  ////// ------------------------- Player Event ------------------------- /////
  /**
   * Emitted when a player is created.
   * @event Wacelink#playerCreate
   */
  on(event: "playerCreate", listener: (player: WacelinkPlayer) => void): this;
  /**
   * Emitted when a player is going to destroyed.
   * @event Wacelink#playerDestroy
   */
  on(event: "playerDestroy", listener: (player: WacelinkPlayer) => void): this;
  /**
   * Emitted when a player have an exception.
   * @event Wacelink#playerException
   */
  on(
    event: "playerException",
    listener: (player: WacelinkPlayer, data: Record<string, any>) => void
  ): this;
  /**
   * Emitted when a player updated info.
   * @event Wacelink#playerUpdate
   */
  on(
    event: "playerUpdate",
    listener: (player: WacelinkPlayer, data: Record<string, any>) => void
  ): this;
  /**
   * Emitted when a playuer is moved into another channel. [Require plugin]
   * @event Wacelink#playerMoved
   */
  on(
    event: "playerMoved",
    listener: (player: WacelinkPlayer, oldChannelId: string, newChannelId: string) => void
  ): this;
  /**
   * Emitted when a track paused.
   * @event Wacelink#playerPause
   */
  on(event: "playerPause", listener: (player: WacelinkPlayer, track: WacelinkTrack) => void): this;
  /**
   * Emitted when a track resumed.
   * @event Wacelink#playerResume
   */
  on(event: "playerResume", listener: (player: WacelinkPlayer, data: WacelinkTrack) => void): this;
  /**
   * Emitted when a player's websocket closed.
   * @event Wacelink#playerWebsocketClosed
   */
  on(
    event: "playerWebsocketClosed",
    listener: (player: WacelinkPlayer, data: Record<string, any>) => void
  ): this;
  /**
   * Emitted when a player is stopped (not destroyed).
   * @event Wacelink#playerResume
   */
  on(event: "playerStop", listener: (player: WacelinkPlayer) => void): this;
  ////// ------------------------- Player Event ------------------------- /////

  ////// ------------------------- Track Event ------------------------- /////
  /**
   * Emitted when a track is going to play.
   * @event Wacelink#trackStart
   */
  on(event: "trackStart", listener: (player: WacelinkPlayer, track: WacelinkTrack) => void): this;
  /**
   * Emitted when a track is going to end.
   * @event Wacelink#trackEnd
   */
  on(event: "trackEnd", listener: (player: WacelinkPlayer) => void): this;
  /**
   * Emitted when a track stucked.
   * @event Wacelink#trackStuck
   */
  on(
    event: "trackStuck",
    listener: (player: WacelinkPlayer, data: Record<string, any>) => void
  ): this;
  /**
   * Emitted when a track is failed to resolve using fallback search engine.
   * @event Wacelink#trackResolveError
   */
  on(
    event: "trackResolveError",
    listener: (player: WacelinkPlayer, track: WacelinkTrack, message: string) => void
  ): this;
  ////// ------------------------- Track Event ------------------------- /////

  ////// ------------------------- Queue Event ------------------------- /////
  /**
   * Emitted when a track added into queue.
   * @event Wacelink#queueAdd
   */
  on(
    event: "queueAdd",
    listener: (player: WacelinkPlayer, queue: WacelinkQueue, track: WacelinkTrack) => void
  ): this;
  /**
   * Emitted when a track removed from queue.
   * @event Wacelink#queueRemove
   */
  on(
    event: "queueRemove",
    listener: (player: WacelinkPlayer, queue: WacelinkQueue, track: WacelinkTrack) => void
  ): this;
  /**
   * Emitted when a queue shuffled.
   * @event Wacelink#queueShuffle
   */
  on(event: "queueShuffle", listener: (player: WacelinkPlayer, queue: WacelinkQueue) => void): this;
  /**
   * Emitted when a queue cleared.
   * @event Wacelink#queueClear
   */
  on(event: "queueClear", listener: (player: WacelinkPlayer, queue: WacelinkQueue) => void): this;
  /**
   * Emitted when a queue is empty.
   * @event Wacelink#queueEmpty
   */
  on(event: "queueEmpty", listener: (player: WacelinkPlayer, queue: WacelinkQueue) => void): this;
  ////// ------------------------- Queue Event ------------------------- /////

  ////// ------------------------- Voice Event ------------------------- /////
  /**
   * Emitted when connected to voice receive server [ONLY Nodelink DRIVER!!!!!!].
   * @event Wacelink#voiceConnect
   */
  on(event: "voiceConnect", listener: (node: WacelinkNode) => void): this;
  /**
   * Emitted when disconnected to voice receive server [ONLY Nodelink DRIVER!!!!!!].
   * @event Wacelink#voiceDisconnect
   */
  on(
    event: "voiceDisconnect",
    listener: (node: WacelinkNode, code: number, reason: Buffer) => void
  ): this;
  /**
   * Emitted when voice receive server errored [ONLY Nodelink DRIVER!!!!!!].
   * @event Wacelink#VoiceError
   */
  on(event: "VoiceError", listener: (node: WacelinkNode, error: Error) => void): this;
  /**
   * Emitted when user started speaking [ONLY Nodelink DRIVER!!!!!!].
   * @event Wacelink#voiceStartSpeaking
   */
  on(
    event: "voiceStartSpeaking",
    listener: (node: WacelinkNode, userId: string, guildId: string) => void
  ): this;
  /**
   * Emitted when user finished speaking [ONLY Nodelink DRIVER!!!!!!].
   * @event Wacelink#voiceEndSpeaking
   */
  on(
    event: "voiceEndSpeaking",
    listener: (node: WacelinkNode, userTrack: string, userId: string, guildId: string) => void
  ): this;
  ////// ------------------------- Voice Event ------------------------- /////
  // ------------------------- ON EVENT ------------------------- //

  // ------------------------- ONCE EVENT ------------------------- //
  /** @ignore */
  once(event: "debug", listener: (logs: string) => void): this;
  ////// ------------------------- Node Event ------------------------- /////
  /** @ignore */
  once(event: "nodeConnect", listener: (node: WacelinkNode) => void): this;
  /** @ignore */
  once(
    event: "nodeDisconnect",
    listener: (node: WacelinkNode, code: number, reason: Buffer) => void
  ): this;
  /** @ignore */
  once(event: "nodeClosed", listener: (node: WacelinkNode) => void): this;
  /** @ignore */
  once(event: "nodeError", listener: (node: WacelinkNode, error: Error) => void): this;
  ////// ------------------------- Node Event ------------------------- /////

  ////// ------------------------- Player Event ------------------------- /////
  /** @ignore */
  once(event: "playerCreate", listener: (player: WacelinkPlayer) => void): this;
  /** @ignore */
  once(event: "playerDestroy", listener: (player: WacelinkPlayer) => void): this;
  /** @ignore */
  once(
    event: "playerException",
    listener: (player: WacelinkPlayer, data: Record<string, any>) => void
  ): this;
  /** @ignore */
  once(
    event: "playerUpdate",
    listener: (player: WacelinkPlayer, data: Record<string, any>) => void
  ): this;
  /** @ignore */
  once(
    event: "playerMoved",
    listener: (player: WacelinkPlayer, oldChannelId: string, newChannelId: string) => void
  ): this;
  /** @ignore */
  once(
    event: "playerPause",
    listener: (player: WacelinkPlayer, track: WacelinkTrack) => void
  ): this;
  /** @ignore */
  once(
    event: "playerResume",
    listener: (player: WacelinkPlayer, data: WacelinkTrack) => void
  ): this;
  /** @ignore */
  once(
    event: "playerWebsocketClosed",
    listener: (player: WacelinkPlayer, data: Record<string, any>) => void
  ): this;
  /** @ignore */
  once(event: "playerStop", listener: (player: WacelinkPlayer) => void): this;
  ////// ------------------------- Player Event ------------------------- /////

  ////// ------------------------- Track Event ------------------------- /////
  /** @ignore */
  once(event: "trackStart", listener: (player: WacelinkPlayer, track: WacelinkTrack) => void): this;
  /** @ignore */
  once(event: "trackEnd", listener: (player: WacelinkPlayer) => void): this;
  /** @ignore */
  once(
    event: "trackStuck",
    listener: (player: WacelinkPlayer, data: Record<string, any>) => void
  ): this;
  /** @ignore */
  once(
    event: "trackResolveError",
    listener: (player: WacelinkPlayer, track: WacelinkTrack, message: string) => void
  ): this;
  ////// ------------------------- Track Event ------------------------- /////

  ////// ------------------------- Queue Event ------------------------- /////
  /** @ignore */
  once(
    event: "queueAdd",
    listener: (player: WacelinkPlayer, queue: WacelinkQueue, track: WacelinkTrack) => void
  ): this;
  /** @ignore */
  once(
    event: "queueRemove",
    listener: (player: WacelinkPlayer, queue: WacelinkQueue, track: WacelinkTrack) => void
  ): this;
  /** @ignore */
  once(
    event: "queueShuffle",
    listener: (player: WacelinkPlayer, queue: WacelinkQueue) => void
  ): this;
  /** @ignore */
  once(event: "queueClear", listener: (player: WacelinkPlayer, queue: WacelinkQueue) => void): this;
  /** @ignore */
  once(event: "queueEmpty", listener: (player: WacelinkPlayer, queue: WacelinkQueue) => void): this;
  ////// ------------------------- Queue Event ------------------------- /////

  ////// ------------------------- Voice Event ------------------------- /////
  /** @ignore */
  once(event: "voiceConnect", listener: (node: WacelinkNode) => void): this;
  /** @ignore */
  once(
    event: "voiceDisconnect",
    listener: (node: WacelinkNode, code: number, reason: Buffer) => void
  ): this;
  /** @ignore */
  once(event: "VoiceError", listener: (node: WacelinkNode, error: Error) => void): this;
  /** @ignore */
  once(
    event: "voiceStartSpeaking",
    listener: (node: WacelinkNode, userId: string, guildId: string) => void
  ): this;
  /** @ignore */
  once(
    event: "voiceEndSpeaking",
    listener: (node: WacelinkNode, userTrack: string, userId: string, guildId: string) => void
  ): this;
  ////// ------------------------- Voice Event ------------------------- /////
  // ------------------------- ONCE EVENT ------------------------- //

  // ------------------------- OFF EVENT ------------------------- //
  /** @ignore */
  off(event: "debug", listener: (logs: string) => void): this;
  ////// ------------------------- Node Event ------------------------- /////
  /** @ignore */
  off(event: "nodeConnect", listener: (node: WacelinkNode) => void): this;
  /** @ignore */
  off(
    event: "nodeDisconnect",
    listener: (node: WacelinkNode, code: number, reason: Buffer) => void
  ): this;
  /** @ignore */
  off(event: "nodeClosed", listener: (node: WacelinkNode) => void): this;
  /** @ignore */
  off(event: "nodeError", listener: (node: WacelinkNode, error: Error) => void): this;
  ////// ------------------------- Node Event ------------------------- /////

  ////// ------------------------- Player Event ------------------------- /////
  /** @ignore */
  off(event: "playerCreate", listener: (player: WacelinkPlayer) => void): this;
  /** @ignore */
  off(event: "playerDestroy", listener: (player: WacelinkPlayer) => void): this;
  /** @ignore */
  off(
    event: "playerException",
    listener: (player: WacelinkPlayer, data: Record<string, any>) => void
  ): this;
  /** @ignore */
  off(
    event: "playerUpdate",
    listener: (player: WacelinkPlayer, data: Record<string, any>) => void
  ): this;
  /** @ignore */
  off(
    event: "playerMoved",
    listener: (player: WacelinkPlayer, oldChannelId: string, newChannelId: string) => void
  ): this;
  /** @ignore */
  off(event: "playerPause", listener: (player: WacelinkPlayer, track: WacelinkTrack) => void): this;
  /** @ignore */
  off(event: "playerResume", listener: (player: WacelinkPlayer, data: WacelinkTrack) => void): this;
  /** @ignore */
  off(
    event: "playerWebsocketClosed",
    listener: (player: WacelinkPlayer, data: Record<string, any>) => void
  ): this;
  /** @ignore */
  off(event: "playerStop", listener: (player: WacelinkPlayer) => void): this;
  ////// ------------------------- Player Event ------------------------- /////

  ////// ------------------------- Track Event ------------------------- /////
  /** @ignore */
  off(event: "trackStart", listener: (player: WacelinkPlayer, track: WacelinkTrack) => void): this;
  /** @ignore */
  off(event: "trackEnd", listener: (player: WacelinkPlayer) => void): this;
  /** @ignore */
  off(
    event: "trackStuck",
    listener: (player: WacelinkPlayer, data: Record<string, any>) => void
  ): this;
  /** @ignore */
  off(
    event: "trackResolveError",
    listener: (player: WacelinkPlayer, track: WacelinkTrack, message: string) => void
  ): this;
  ////// ------------------------- Track Event ------------------------- /////

  ////// ------------------------- Queue Event ------------------------- /////
  /** @ignore */
  off(
    event: "queueAdd",
    listener: (player: WacelinkPlayer, queue: WacelinkQueue, track: WacelinkTrack) => void
  ): this;
  /** @ignore */
  off(
    event: "queueRemove",
    listener: (player: WacelinkPlayer, queue: WacelinkQueue, track: WacelinkTrack) => void
  ): this;
  /** @ignore */
  off(
    event: "queueShuffle",
    listener: (player: WacelinkPlayer, queue: WacelinkQueue) => void
  ): this;
  /** @ignore */
  off(event: "queueClear", listener: (player: WacelinkPlayer, queue: WacelinkQueue) => void): this;
  /** @ignore */
  off(event: "queueEmpty", listener: (player: WacelinkPlayer, queue: WacelinkQueue) => void): this;
  ////// ------------------------- Queue Event ------------------------- /////

  ////// ------------------------- Voice Event ------------------------- /////
  /** @ignore */
  off(event: "voiceConnect", listener: (node: WacelinkNode) => void): this;
  /** @ignore */
  off(
    event: "voiceDisconnect",
    listener: (node: WacelinkNode, code: number, reason: Buffer) => void
  ): this;
  /** @ignore */
  off(event: "VoiceError", listener: (node: WacelinkNode, error: Error) => void): this;
  /** @ignore */
  off(
    event: "voiceStartSpeaking",
    listener: (node: WacelinkNode, userId: string, guildId: string) => void
  ): this;
  /** @ignore */
  off(
    event: "voiceEndSpeaking",
    listener: (node: WacelinkNode, userTrack: string, userId: string, guildId: string) => void
  ): this;
  ////// ------------------------- Voice Event ------------------------- /////
  // ------------------------- OFF EVENT ------------------------- //
}

export class Wacelink extends EventEmitter {
  /**
   * Discord library connector
   */
  public readonly library: AbstractLibrary;
  /**
   * Lavalink server that has been configured
   */
  public nodes: WacelinkNodeManager;
  /**
   * Wacelink options
   */
  public wacelinkOptions: WacelinkOptions;
  /**
   * Bot id
   */
  public id: string | undefined;
  /**
   * Player maps
   */
  public players: WacelinkPlayerManager;
  /**
   * All search engine
   */
  public searchEngines: WacelinkDatabase<string>;
  /**
   * All search plugins (resolver plugins)
   */
  public searchPlugins: WacelinkDatabase<SourceWacelinkPlugin>;
  /**
   * All plugins (include resolver plugins)
   */
  public plugins: WacelinkDatabase<WacelinkPlugin>;
  /**
   * The wacelink manager
   */
  public drivers: AbstractDriver[];
  /**
   * The current bott's shard count
   */
  public shardCount: number = 1;

  /**
   * The main class that handle all works in lavalink server.
   * Call this class by using new Wacelink(your_params) to use!
   * @param options The main ranlink options
   */
  constructor(options: WacelinkOptions) {
    super();
    if (!options.library)
      throw new Error(
        "Please set an new lib to connect, example: \nlibrary: new Library.DiscordJS(client) "
      );
    this.library = options.library.set(this);
    this.drivers = [new Lavalink3(), new Nodelink2(), new Lavalink4()];
    this.wacelinkOptions = options;
    this.wacelinkOptions.options = this.mergeDefault<WacelinkAdditionalOptions>(
      this.defaultOptions,
      this.wacelinkOptions.options ?? {}
    );
    if (
      this.wacelinkOptions.options.additionalDriver &&
      this.wacelinkOptions.options.additionalDriver?.length !== 0
    )
      this.drivers.push(...this.wacelinkOptions.options.additionalDriver);
    this.nodes = new WacelinkNodeManager(this);
    this.players = new WacelinkPlayerManager(this);
    this.searchEngines = new WacelinkDatabase<string>();
    this.searchPlugins = new WacelinkDatabase<SourceWacelinkPlugin>();
    this.plugins = new WacelinkDatabase<WacelinkPlugin>();
    this.initialSearchEngines();
    if (
      !this.wacelinkOptions.options.defaultSearchEngine ||
      this.wacelinkOptions.options.defaultSearchEngine.length == 0
    )
      this.wacelinkOptions.options.defaultSearchEngine == "youtube";

    if (this.wacelinkOptions.plugins) {
      for (const [, plugin] of this.wacelinkOptions.plugins.entries()) {
        if (plugin.constructor.name !== "WacelinkPlugin")
          throw new Error("Plugin must be an instance of WacelinkPlugin or SourceWacelinkPlugin");
        plugin.load(this);

        this.plugins.set(plugin.name(), plugin);

        if (plugin.type() == WacelinkPluginType.SourceResolver) {
          const newPlugin = plugin as SourceWacelinkPlugin;
          const sourceName = newPlugin.sourceName();
          const sourceIdentify = newPlugin.sourceIdentify();
          this.searchEngines.set(sourceName, sourceIdentify);
          this.searchPlugins.set(sourceName, newPlugin);
        }
      }
    }
    this.library.listen(this.wacelinkOptions.nodes);
  }

  protected initialSearchEngines() {
    for (const data of SourceIDs) {
      this.searchEngines.set(data.name, data.id);
    }
  }

  /**
   * Create a new player.
   * @returns WacelinkNode
   */
  async create(options: VoiceChannelOptions): Promise<WacelinkPlayer> {
    return await this.players.create(options);
  }

  /**
   * Destroy a specific player.
   * @returns void
   */
  async destroy(guildId: string): Promise<void> {
    this.players.destroy(guildId);
  }

  /**
   * Search a specific track.
   * @returns WacelinkSearchResult
   */
  async search(query: string, options?: WacelinkSearchOptions): Promise<WacelinkSearchResult> {
    const node =
      options && options?.nodeName
        ? this.nodes.get(options.nodeName) ?? (await this.nodes.getLeastUsed())
        : await this.nodes.getLeastUsed();

    if (!node) throw new Error("No node is available");

    let pluginData: WacelinkSearchResult;

    const directSearchRegex = /directSearch=(.*)/;
    const isDirectSearch = directSearchRegex.exec(query);
    const isUrl = /^https?:\/\/.*/.test(query);

    const pluginSearch = this.searchPlugins.get(String(options?.engine));

    if (
      options &&
      options!.engine &&
      options!.engine !== null &&
      pluginSearch &&
      isDirectSearch == null
    ) {
      pluginData = await pluginSearch.searchDirect(query, options);
      if (pluginData.tracks.length !== 0) return pluginData;
    }

    const source =
      options && options?.engine
        ? this.searchEngines.get(options.engine)
        : this.searchEngines.get(
            this.wacelinkOptions.options!.defaultSearchEngine
              ? this.wacelinkOptions.options!.defaultSearchEngine
              : "youtube"
          );

    const finalQuery =
      isDirectSearch !== null ? isDirectSearch[1] : !isUrl ? `${source}search:${query}` : query;

    const result = await node.rest.resolver(finalQuery).catch(() => null);
    if (!result || result.loadType === LavalinkLoadType.EMPTY) {
      return this.buildSearch(undefined, [], WacelinkSearchResultType.SEARCH);
    }

    let loadType: WacelinkSearchResultType;
    let normalizedData: {
      playlistName?: string;
      tracks: RawTrack[];
    } = { tracks: [] };
    switch (result.loadType) {
      case LavalinkLoadType.TRACK: {
        loadType = WacelinkSearchResultType.TRACK;
        normalizedData.tracks = [result.data];
        break;
      }

      case LavalinkLoadType.PLAYLIST: {
        loadType = WacelinkSearchResultType.PLAYLIST;
        normalizedData = {
          playlistName: result.data.info.name,
          tracks: result.data.tracks,
        };
        break;
      }

      case LavalinkLoadType.SEARCH: {
        loadType = WacelinkSearchResultType.SEARCH;
        normalizedData.tracks = result.data;
        break;
      }

      default: {
        loadType = WacelinkSearchResultType.SEARCH;
        normalizedData.tracks = [];
        break;
      }
    }

    this.emit(
      WacelinkEvents.Debug,
      `[Wacelink] / [Search] | Searched ${query}; Track results: ${normalizedData.tracks.length}`
    );

    return this.buildSearch(
      normalizedData.playlistName ?? undefined,
      normalizedData.tracks.map(
        (track) =>
          new WacelinkTrack(track, options && options.requester ? options.requester : undefined)
      ),
      loadType
    );
  }

  protected buildSearch(
    playlistName?: string,
    tracks: WacelinkTrack[] = [],
    type?: WacelinkSearchResultType
  ): WacelinkSearchResult {
    return {
      playlistName,
      tracks,
      type: type ?? WacelinkSearchResultType.SEARCH,
    };
  }

  protected get defaultOptions(): WacelinkAdditionalOptions {
    return {
      additionalDriver: [],
      retryTimeout: 3000,
      retryCount: 15,
      voiceConnectionTimeout: 15000,
      defaultSearchEngine: "soundcloud",
      defaultVolume: 100,
      searchFallback: {
        enable: true,
        engine: "soundcloud",
      },
      resume: false,
      userAgent: `Discord/Bot/${metadata.name}/${metadata.version} (${metadata.github})`,
      nodeResolver: undefined,
      structures: undefined,
      resumeTimeout: 300,
    };
  }

  // Modded from:
  // https://github.com/shipgirlproject/Shoukaku/blob/2677ecdf123ffef1c254c2113c5342b250ac4396/src/Utils.ts#L9-L23
  protected mergeDefault<T extends { [key: string]: any }>(def: T, given: T): Required<T> {
    if (!given) return def as Required<T>;
    const defaultKeys: (keyof T)[] = Object.keys(def);
    for (const key in given) {
      if (defaultKeys.includes(key)) continue;
      if (this.isNumber(key)) continue;
      delete given[key];
    }
    for (const key of defaultKeys) {
      if (Array.isArray(given[key]) && given[key] !== null && given[key] !== undefined) {
        if (given[key].length == 0) given[key] = def[key];
      }
      if (def[key] === null || (typeof def[key] === "string" && def[key].length === 0)) {
        if (!given[key]) given[key] = def[key];
      }
      if (given[key] === null || given[key] === undefined) given[key] = def[key];
      if (typeof given[key] === "object" && given[key] !== null) {
        this.mergeDefault(def[key], given[key]);
      }
    }
    return given as Required<T>;
  }

  protected isNumber(data: string): boolean {
    return /^[+-]?\d+(\.\d+)?$/.test(data);
  }
}
