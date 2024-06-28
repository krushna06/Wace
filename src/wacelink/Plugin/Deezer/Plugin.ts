import {
  WacelinkSearchOptions,
  WacelinkSearchResult,
  WacelinkSearchResultType,
} from "../../Interface/Manager.js";
import { Wacelink } from "../../Wacelink.js";
import { WacelinkTrack } from "../../Player/WacelinkTrack.js";
import { SourceWacelinkPlugin } from "../SourceWacelinkPlugin.js";
import { WacelinkEvents, WacelinkPluginType } from "../../Interface/Constants.js";
import { fetch, request } from "undici";

const API_URL = "https://api.deezer.com/";
const REGEX = /^https?:\/\/(?:www\.)?deezer\.com\/[a-z]+\/(track|album|playlist)\/(\d+)$/;
const SHORT_REGEX = /^https:\/\/deezer\.page\.link\/[a-zA-Z0-9]{12}$/;

export class WacelinkPlugin extends SourceWacelinkPlugin {
  private manager: Wacelink | null;
  private _search?: (
    query: string,
    options?: WacelinkSearchOptions
  ) => Promise<WacelinkSearchResult>;
  private readonly methods: Record<string, (id: string, requester: unknown) => Promise<Result>>;
  /**
   * Source identify of the plugin
   * @returns string
   */
  public sourceIdentify(): string {
    return "dz";
  }

  /**
   * Source name of the plugin
   * @returns string
   */
  public sourceName(): string {
    return "deezer";
  }

  /**
   * Type of the plugin
   * @returns WacelinkPluginType
   */
  public type(): WacelinkPluginType {
    return WacelinkPluginType.SourceResolver;
  }

  /**
   * Initialize the plugin.
   */
  constructor() {
    super();
    this.methods = {
      track: this.getTrack.bind(this),
      album: this.getAlbum.bind(this),
      playlist: this.getPlaylist.bind(this),
    };
    this.manager = null;
    this._search = undefined;
  }

  /**
   * load the plugin
   * @param wacelink The wacelink class
   */
  public load(manager: Wacelink): void {
    this.manager = manager;
    this._search = manager.search.bind(manager);
    manager.search = this.search.bind(this);
  }

  /**
   * Unload the plugin
   * @param wacelink The wacelink class
   */
  public unload(wacelink: Wacelink) {
    this.manager = wacelink;
    this.manager.search = wacelink.search.bind(wacelink);
  }

  /** Name function for getting plugin name */
  public name(): string {
    return "wacelink-deezer";
  }

  protected async search(
    query: string,
    options?: WacelinkSearchOptions
  ): Promise<WacelinkSearchResult> {
    const res = await this._search!(query, options);
    if (!this.directSearchChecker(query)) return res;
    if (res.tracks.length == 0) return this.searchDirect(query, options);
    else return res;
  }

  /**
   * Directly search from plugin
   * @param query URI or track name query
   * @param options search option like WacelinkSearchOptions
   * @returns WacelinkSearchResult
   */
  public async searchDirect(
    query: string,
    options?: WacelinkSearchOptions | undefined
  ): Promise<WacelinkSearchResult> {
    if (!this.manager || !this._search) throw new Error("wacelink-deezer is not loaded yet.");

    if (!query) throw new Error("Query is required");

    const isUrl = /^https?:\/\//.test(query);

    if (SHORT_REGEX.test(query)) {
      const url = new URL(query);
      const res = await fetch(url.origin + url.pathname, { method: "HEAD" });
      query = String(res.headers.get("location"));
    }

    const [, type, id] = REGEX.exec(query) || [];

    if (type in this.methods) {
      this.debug(`Start search from ${this.sourceName()} plugin`);
      try {
        const _function = this.methods[type];
        const result: Result = await _function(id, options?.requester);

        const loadType =
          type === "track" ? WacelinkSearchResultType.TRACK : WacelinkSearchResultType.PLAYLIST;
        const playlistName = result.name ?? undefined;

        const tracks = result.tracks.filter(this.filterNullOrUndefined);
        return this.buildSearch(playlistName, tracks, loadType);
      } catch (e) {
        return this.buildSearch(undefined, [], WacelinkSearchResultType.SEARCH);
      }
    } else if (options?.engine === this.sourceName() && !isUrl) {
      const result = await this.searchTrack(query, options?.requester);

      return this.buildSearch(undefined, result.tracks, WacelinkSearchResultType.SEARCH);
    } else return this.buildSearch(undefined, [], WacelinkSearchResultType.SEARCH);
  }

  private async searchTrack(query: string, requester: unknown): Promise<Result> {
    try {
      const req = await fetch(`${API_URL}/search/track?q=${decodeURIComponent(query)}`);
      const data = await req.json();

      const res = data as SearchResult;
      return {
        tracks: res.data.map((track) => this.buildWacelinkTrack(track, requester)),
      };
    } catch (e: any) {
      throw new Error(e);
    }
  }

  private async getTrack(id: string, requester: unknown): Promise<Result> {
    try {
      const request = await fetch(`${API_URL}/track/${id}/`);
      const data = await request.json();
      const track = data as DeezerTrack;

      return { tracks: [this.buildWacelinkTrack(track, requester)] };
    } catch (e: any) {
      throw new Error(e);
    }
  }

  private async getAlbum(id: string, requester: unknown): Promise<Result> {
    try {
      const request = await fetch(`${API_URL}/album/${id}/`);
      const data = await request.json();
      const album = data as Album;

      const tracks = album.tracks.data
        .filter(this.filterNullOrUndefined)
        .map((track) => this.buildWacelinkTrack(track, requester));

      return { tracks, name: album.title };
    } catch (e: any) {
      throw new Error(e);
    }
  }

  private async getPlaylist(id: string, requester: unknown): Promise<Result> {
    try {
      const request = await fetch(`${API_URL}/playlist/${id}`);
      const data = await request.json();
      const playlist = data as Playlist;

      const tracks = playlist.tracks.data
        .filter(this.filterNullOrUndefined)
        .map((track) => this.buildWacelinkTrack(track, requester));

      return { tracks, name: playlist.title };
    } catch (e: any) {
      throw new Error(e);
    }
  }

  private filterNullOrUndefined(obj: unknown): obj is unknown {
    return obj !== undefined && obj !== null;
  }

  private buildSearch(
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

  private buildWacelinkTrack(dezzerTrack: any, requester: unknown) {
    return new WacelinkTrack(
      {
        encoded: "",
        info: {
          sourceName: this.sourceName(),
          identifier: dezzerTrack.id,
          isSeekable: true,
          author: dezzerTrack.artist ? dezzerTrack.artist.name : "Unknown",
          length: dezzerTrack.duration * 1000,
          isStream: false,
          position: 0,
          title: dezzerTrack.title,
          uri: `https://www.deezer.com/track/${dezzerTrack.id}`,
          artworkUrl: dezzerTrack.album ? dezzerTrack.album.cover : "",
        },
        pluginInfo: {
          name: "wacelink@deezer",
        },
      },
      requester
    );
  }

  private debug(logs: string) {
    this.manager
      ? // @ts-ignore
        this.manager.emit(WacelinkEvents.Debug, `[Wacelink Deezer Plugin]: ${logs}`)
      : true;
  }
}

// Interfaces
/** @ignore */
interface Result {
  tracks: WacelinkTrack[];
  name?: string;
}
/** @ignore */
interface Album {
  title: string;
  tracks: AlbumTracks;
}
/** @ignore */
interface AlbumTracks {
  data: DeezerTrack[];
  next: string | null;
}
/** @ignore */
interface Playlist {
  tracks: PlaylistTracks;
  title: string;
}
/** @ignore */
interface PlaylistTracks {
  data: DeezerTrack[];
  next: string | null;
}
/** @ignore */
interface DeezerTrack {
  data: WacelinkTrack[];
}
/** @ignore */
interface SearchResult {
  exception?: {
    severity: string;
    message: string;
  };
  loadType: string;
  playlist?: {
    duration_ms: number;
    name: string;
  };
  data: WacelinkTrack[];
}
