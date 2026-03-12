import { Player as ShoukakuPlayer, Track } from "shoukaku";
import { Manager } from "../manager.js";
import { User } from "discord.js";
import { FilterPresets, FilterName } from "./Filters.js";
import { getNode } from "../utilities/GetNode.js";

export interface PlayerOptions {
  guildId: string;
  voiceId: string;
  textId: string;
  shardId: number;
  deaf?: boolean;
  volume?: number;
}

export interface SearchResult {
  type: "TRACK" | "PLAYLIST" | "SEARCH";
  playlistName?: string;
  tracks: ExtendedTrack[];
}

export interface ExtendedTrack extends Track {
  requester?: User;
  duration?: number; // Alias for info.length
  title?: string; // Alias for info.title
  uri?: string; // Alias for info.uri
  author?: string; // Alias for info.author
  artworkUrl?: string; // Alias for info.artworkUrl
  identifier?: string; // Alias for info.identifier
}

export class Player {
  public guildId: string;
  public voiceId: string;
  public textId: string;
  public shardId: number;
  public queue: ExtendedTrack[] = [];
  public current: ExtendedTrack | null = null;
  public previous: ExtendedTrack | null = null;
  public previousQueue: ExtendedTrack[] = []; // Track history for previous command
  public playing: boolean = false;
  public paused: boolean = false;
  public loop: "none" | "track" | "queue" = "none";
  public volume: number = 100;
  public data: Map<string, any> = new Map();
  public shoukaku: ShoukakuPlayer | null = null;
  public position: number = 0;
  public currentFilters: any = {};
  private positionInterval: NodeJS.Timeout | null = null;

  constructor(
    public client: Manager,
    options: PlayerOptions
  ) {
    this.guildId = options.guildId;
    this.voiceId = options.voiceId;
    this.textId = options.textId;
    this.shardId = options.shardId;
    this.volume = options.volume || 100;
  }

  async connect(): Promise<void> {
    const node = getNode(this.client);
    if (!node) throw new Error("No available nodes");

    // Use Shoukaku to join the channel, not the node directly
    this.shoukaku = await this.client.shoukaku.joinVoiceChannel({
      guildId: this.guildId,
      channelId: this.voiceId,
      shardId: this.shardId,
      deaf: true,
    });

    this.setupListeners();
  }

  private setupListeners(): void {
    if (!this.shoukaku) return;

    this.shoukaku.on("start", () => {
      this.playing = true;
      this.paused = false;
      this.startPositionTracking();
      this.client.emit("trackStart", this, this.current);
    });

    this.shoukaku.on("end", (data) => {
      this.stopPositionTracking();
      this.client.emit("trackEnd", this, this.current, data);
      
      if (data.reason === "finished" || data.reason === "loadFailed") {
        this.handleTrackEnd();
      }
    });

    this.shoukaku.on("stuck", (data) => {
      this.client.emit("trackStuck", this, this.current, data);
      this.handleTrackEnd();
    });

    this.shoukaku.on("closed", (data) => {
      this.client.emit("playerClosed", this, data);
    });

    this.shoukaku.on("exception", (data) => {
      this.client.emit("trackException", this, this.current, data);
    });

    this.shoukaku.on("update", (data) => {
      this.position = data.state.position;
      this.client.emit("playerUpdate", this, data);
    });

    this.shoukaku.on("resumed", () => {
      this.client.emit("playerResumed", this);
    });
  }

  private startPositionTracking(): void {
    this.stopPositionTracking();
    this.positionInterval = setInterval(() => {
      if (this.playing && !this.paused && this.current) {
        this.position += 1000;
      }
    }, 1000);
  }

  private stopPositionTracking(): void {
    if (this.positionInterval) {
      clearInterval(this.positionInterval);
      this.positionInterval = null;
    }
  }

  private async handleTrackEnd(): Promise<void> {
    if (this.loop === "track" && this.current) {
      await this.play();
      return;
    }

    if (this.loop === "queue" && this.current) {
      this.queue.push(this.current);
    }

    if (this.queue.length > 0) {
      await this.play();
    } else if (this.data.get("autoplay")) {
      // Autoplay logic would go here
      this.playing = false;
    } else {
      this.playing = false;
      this.current = null;
    }
  }

  async search(query: string, options?: { requester?: User }): Promise<SearchResult> {
    const node = getNode(this.client);
    if (!node) throw new Error("No available nodes");

    let searchQuery = query;
    const urlPattern = /^https?:\/\//;
    
    if (!urlPattern.test(query)) {
      const defaultEngine = "ytsearch";
      searchQuery = `${defaultEngine}:${query}`;
    }

    this.client.logger.debug("Player.search", `Searching for: ${searchQuery}`);
    const result = await node.rest.resolve(searchQuery);
    this.client.logger.debug("Player.search", `Result loadType: ${result?.loadType}`);
    
    if (!result) {
      this.client.logger.warn("Player.search", `No result for query: ${searchQuery}`);
      return { type: "SEARCH", tracks: [] };
    }

    // Handle different Shoukaku response types
    let tracks: ExtendedTrack[] = [];
    let type: "TRACK" | "PLAYLIST" | "SEARCH" = "SEARCH";
    let playlistName: string | undefined;

    switch (result.loadType) {
      case "track":
        tracks = [result.data as any];
        type = "TRACK";
        break;
      case "playlist":
        const playlistData = result.data as any;
        tracks = playlistData.tracks || [];
        playlistName = playlistData.info?.name;
        type = "PLAYLIST";
        break;
      case "search":
        tracks = result.data as any[];
        type = "SEARCH";
        break;
      case "empty":
      case "error":
        this.client.logger.warn("Player.search", `Search failed: ${result.loadType}`);
        return { type: "SEARCH", tracks: [] };
    }

    if (!tracks || tracks.length === 0) {
      this.client.logger.warn("Player.search", `No tracks found for query: ${searchQuery}`);
      return { type: "SEARCH", tracks: [] };
    }

    // Map tracks to ExtendedTrack format
    const extendedTracks: ExtendedTrack[] = tracks.map((track: any) => ({
      ...track,
      requester: options?.requester,
      // Add aliases for backward compatibility
      duration: track.info?.length || track.length,
      title: track.info?.title || track.title,
      uri: track.info?.uri || track.uri,
      author: track.info?.author || track.author,
      artworkUrl: track.info?.artworkUrl || track.artworkUrl,
      identifier: track.info?.identifier || track.identifier,
    }));

    return {
      type,
      playlistName,
      tracks: extendedTracks,
    };
  }

  async play(track?: ExtendedTrack): Promise<void> {
    if (!this.shoukaku) {
      await this.connect();
    }

    if (track) {
      // Add current track to previous queue before playing new track
      if (this.current) {
        this.previousQueue.push(this.current);
      }
      this.previous = this.current;
      this.current = track;
    } else if (this.queue.length > 0) {
      // Add current track to previous queue before playing next track
      if (this.current) {
        this.previousQueue.push(this.current);
      }
      this.previous = this.current;
      this.current = this.queue.shift()!;
    } else if (this.current) {
      // Replay current track
    } else {
      return;
    }

    if (!this.current) return;

    this.position = 0;
    await this.shoukaku!.playTrack({ track: { encoded: this.current.encoded } });
  }

  async stop(disconnect: boolean = true): Promise<void> {
    this.stopPositionTracking();
    
    if (this.shoukaku) {
      await this.shoukaku.stopTrack();
    }

    this.queue = [];
    this.current = null;
    this.playing = false;
    this.paused = false;

    if (disconnect) {
      await this.destroy();
    }
  }

  async pause(): Promise<void> {
    if (!this.shoukaku || !this.playing) return;
    await this.shoukaku.setPaused(true);
    this.paused = true;
  }

  async resume(): Promise<void> {
    if (!this.shoukaku) return;
    await this.shoukaku.setPaused(false);
    this.paused = false;
  }

  async setPause(pause: boolean): Promise<void> {
    if (pause) {
      await this.pause();
    } else {
      await this.resume();
    }
  }

  async skip(): Promise<void> {
    if (!this.shoukaku) return;
    await this.shoukaku.stopTrack();
  }

  async previous(): Promise<void> {
    if (!this.previousQueue || this.previousQueue.length === 0) return;
    
    // Get the last track from previous queue
    const previousTrack = this.previousQueue.pop();
    if (!previousTrack) return;

    // Add current track back to the front of the queue
    if (this.current) {
      this.queue.unshift(this.current);
    }

    // Play the previous track
    await this.play(previousTrack);
  }

  async seek(position: number): Promise<void> {
    if (!this.shoukaku || !this.current) return;
    await this.shoukaku.seekTo(position);
    this.position = position;
  }

  async setVolume(volume: number): Promise<void> {
    if (!this.shoukaku) return;
    this.volume = Math.max(0, Math.min(1000, volume));
    await this.shoukaku.setGlobalVolume(this.volume);
  }

  async setLoop(mode: "none" | "track" | "queue"): Promise<void> {
    this.loop = mode;
  }

  async shuffle(): Promise<void> {
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
  }

  async destroy(): Promise<void> {
    this.stopPositionTracking();
    
    if (this.shoukaku) {
      this.shoukaku.removeAllListeners();
    }

    // Use Shoukaku's leaveVoiceChannel to disconnect
    await this.client.shoukaku.leaveVoiceChannel(this.guildId);

    this.client.players.delete(this.guildId);
    this.client.emit("playerDestroy", this);
  }

  get state(): string {
    if (!this.shoukaku) return "DISCONNECTED";
    // Shoukaku doesn't have connection.state, just return a simple state
    return this.shoukaku.paused ? "PAUSED" : "CONNECTED";
  }

  get filters(): any {
    return {
      set: async (filterName: FilterName | string) => {
        const preset = FilterPresets[filterName as FilterName];
        if (preset) {
          this.currentFilters = preset;
          await this.setFilters(preset);
        }
      },
      clear: async () => {
        this.currentFilters = {};
        await this.setFilters({});
      },
      current: this.currentFilters,
    };
  }

  async setFilters(filters: any): Promise<void> {
    if (!this.shoukaku) return;
    this.currentFilters = filters;
    await this.shoukaku.setFilters(filters);
  }
}
