import {
  WacelinkSearchOptions,
  WacelinkSearchResult,
  WacelinkSearchResultType,
} from "../../Interface/Manager.js";
import { Wacelink } from "../../Wacelink.js";
import { WacelinkTrack } from "../../Player/WacelinkTrack.js";
import { SourceWacelinkPlugin } from "../SourceWacelinkPlugin.js";
import { WacelinkEvents, WacelinkPluginType } from "../../Interface/Constants.js";
import { fetch } from "undici";

const REGEX =
  /(?:https:\/\/music\.apple\.com\/)(?:.+)?(artist|album|music-video|playlist)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)/;
const REGEX_SONG_ONLY =
  /(?:https:\/\/music\.apple\.com\/)(?:.+)?(artist|album|music-video|playlist)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)(\?|\&)([^=]+)\=([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)/;

type HeaderType = {
  Authorization: string;
  origin: string;
};

/** The wacelink spotify plugin options */
export type AppleOptions = {
  /** The country code that u want to set content, eg: en */
  countryCode?: string;
  /** Artwork width */
  imageWidth?: number;
  /** Artwork height */
  imageHeight?: number;
};

const credentials = {
  APPLE_TOKEN:
    "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IldlYlBsYXlLaWQifQ.eyJpc3MiOiJBTVBXZWJQbGF5IiwiaWF0IjoxNzA5Njg5NTM4LCJleHAiOjE3MTY5NDcxMzgsInJvb3RfaHR0cHNfb3JpZ2luIjpbImFwcGxlLmNvbSJdfQ.QuL8x1Wb-EjFfRUKmaUlAX4TchI4EmeqYt1tVm2OMvM5Lbmuv45ON5qIDYOPQEPALfaElh1lh3_6g5BNToJh6A",
};

export class WacelinkPlugin extends SourceWacelinkPlugin {
  public options: AppleOptions;
  private manager: Wacelink | null;
  private _search?: (
    query: string,
    options?: WacelinkSearchOptions
  ) => Promise<WacelinkSearchResult>;
  private readonly methods: Record<string, (id: string, requester: unknown) => Promise<Result>>;
  private credentials: HeaderType;
  private fetchURL: string;
  private baseURL: string;
  public countryCode: string;
  public imageWidth: number;
  public imageHeight: number;

  /**
   * Source identify of the plugin
   * @returns string
   */
  public sourceIdentify(): string {
    return "am";
  }

  /**
   * Source name of the plugin
   * @returns string
   */
  public sourceName(): string {
    return "apple";
  }

  /**
   * Type of the plugin
   * @returns WacelinkPluginType
   */
  public type(): WacelinkPluginType {
    return WacelinkPluginType.SourceResolver;
  }

  /** Name function for getting plugin name */
  public name(): string {
    return "wacelink-apple";
  }

  /**
   * Initialize the plugin.
   * @param appleOptions The wacelink apple plugin options
   */
  constructor(appleOptions: AppleOptions) {
    super();
    this.methods = {
      artist: this.getArtist.bind(this),
      album: this.getAlbum.bind(this),
      playlist: this.getPlaylist.bind(this),
      track: this.getTrack.bind(this),
    };
    this.options = appleOptions;
    this.manager = null;
    this._search = undefined;
    this.countryCode = this.options?.countryCode ? this.options?.countryCode : "us";
    this.imageHeight = this.options?.imageHeight ? this.options?.imageHeight : 900;
    this.imageWidth = this.options?.imageWidth ? this.options?.imageWidth : 600;
    this.baseURL = "https://api.music.apple.com/v1/";
    this.fetchURL = `https://amp-api.music.apple.com/v1/catalog/${this.countryCode}`;
    this.credentials = {
      Authorization: `Bearer ${credentials.APPLE_TOKEN}`,
      origin: "https://music.apple.com",
    };
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
    let type: string;
    let id: string;
    let isTrack: boolean = false;

    if (!this.manager || !this._search) throw new Error("wacelink-apple is not loaded yet.");

    if (!query) throw new Error("Query is required");

    const isUrl = /^https?:\/\//.test(query);

    if (!REGEX_SONG_ONLY.exec(query) || REGEX_SONG_ONLY.exec(query) == null) {
      const extract = REGEX.exec(query) || [];
      id = extract![4];
      type = extract![1];
    } else {
      const extract = REGEX_SONG_ONLY.exec(query) || [];
      id = extract![8];
      type = extract![1];
      isTrack = true;
    }

    if (type in this.methods) {
      try {
        this.debug(`Start search from ${this.sourceName()} plugin`);
        let _function = this.methods[type];
        if (isTrack) _function = this.methods.track;
        const result: Result = await _function(id, options?.requester);

        const loadType = isTrack
          ? WacelinkSearchResultType.TRACK
          : WacelinkSearchResultType.PLAYLIST;
        const playlistName = result.name ?? undefined;

        const tracks = result.tracks.filter(this.filterNullOrUndefined);
        return this.buildSearch(playlistName, tracks, loadType);
      } catch (e) {
        return this.buildSearch(undefined, [], WacelinkSearchResultType.SEARCH);
      }
    } else if (options?.engine === "apple" && !isUrl) {
      const result = await this.searchTrack(query, options?.requester);

      return this.buildSearch(undefined, result.tracks, WacelinkSearchResultType.SEARCH);
    } else return this.buildSearch(undefined, [], WacelinkSearchResultType.SEARCH);
  }

  private async getData<D = any>(params: string) {
    const req = await fetch(`${this.fetchURL}${params}`, {
      headers: this.credentials,
    });
    const res = (await req.json()) as any;
    return res.data as D;
  }

  private async searchTrack(query: string, requester: unknown): Promise<Result> {
    try {
      const res = await this.getData(
        `/search?types=songs&term=${query.replace(/ /g, "+").toLocaleLowerCase()}`
      ).catch((e) => {
        throw new Error(e);
      });
      return {
        tracks: res.results.songs.data.map((track: Track) =>
          this.buildWacelinkTrack(track, requester)
        ),
      };
    } catch (e: any) {
      throw new Error(e);
    }
  }

  private async getTrack(id: string, requester: unknown): Promise<Result> {
    try {
      const track = await this.getData(`/songs/${id}`).catch((e) => {
        throw new Error(e);
      });
      return { tracks: [this.buildWacelinkTrack(track[0], requester)] };
    } catch (e: any) {
      throw new Error(e);
    }
  }

  private async getArtist(id: string, requester: unknown): Promise<Result> {
    try {
      const track = await this.getData(`/artists/${id}/view/top-songs`).catch((e) => {
        throw new Error(e);
      });
      return { tracks: [this.buildWacelinkTrack(track[0], requester)] };
    } catch (e: any) {
      throw new Error(e);
    }
  }

  private async getAlbum(id: string, requester: unknown): Promise<Result> {
    try {
      const album = await this.getData(`/albums/${id}`).catch((e) => {
        throw new Error(e);
      });

      const tracks = album[0].relationships.tracks.data
        .filter(this.filterNullOrUndefined)
        .map((track: Track) => this.buildWacelinkTrack(track, requester));

      return { tracks, name: album[0].attributes.name };
    } catch (e: any) {
      throw new Error(e);
    }
  }

  private async getPlaylist(id: string, requester: unknown): Promise<Result> {
    try {
      const playlist = await this.getData(`/playlists/${id}`).catch((e) => {
        throw new Error(e);
      });

      const tracks = playlist[0].relationships.tracks.data
        .filter(this.filterNullOrUndefined)
        .map((track: any) => this.buildWacelinkTrack(track, requester));

      return { tracks, name: playlist[0].attributes.name };
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

  private buildWacelinkTrack(appleTrack: Track, requester: unknown) {
    const artworkURL = String(appleTrack.attributes.artwork.url)
      .replace("{w}", String(this.imageWidth))
      .replace("{h}", String(this.imageHeight));
    return new WacelinkTrack(
      {
        encoded: "",
        info: {
          sourceName: this.sourceName(),
          identifier: appleTrack.id,
          isSeekable: true,
          author: appleTrack.attributes.artistName ? appleTrack.attributes.artistName : "Unknown",
          length: appleTrack.attributes.durationInMillis,
          isStream: false,
          position: 0,
          title: appleTrack.attributes.name,
          uri: appleTrack.attributes.url || "",
          artworkUrl: artworkURL ? artworkURL : "",
        },
        pluginInfo: {
          name: "wacelink@apple",
        },
      },
      requester
    );
  }

  private debug(logs: string) {
    this.manager
      ? // @ts-ignore
        this.manager.emit(WacelinkEvents.Debug, `[Wacelink] -> [Plugin] -> [Apple] | ${logs}`)
      : true;
  }
}

// Interfaces
/** @ignore */
export interface Result {
  tracks: WacelinkTrack[];
  name?: string;
}
/** @ignore */
export interface Track {
  id: string;
  type: string;
  href: string;
  attributes: TrackAttributes;
}
/** @ignore */
export interface TrackAttributes {
  albumName: string;
  hasTimeSyncedLyrics: boolean;
  genreNames: any[];
  trackNumber: number;
  releaseDate: string;
  durationInMillis: number;
  isVocalAttenuationAllowed: boolean;
  isMasteredForItunes: boolean;
  isrc: string;
  artwork: Record<string, any>;
  audioLocale: string;
  composerName: string;
  url: string;
  playParams: Record<string, any>;
  discNumber: number;
  hasCredits: boolean;
  hasLyrics: boolean;
  isAppleDigitalMaster: boolean;
  audioTraits: any[];
  name: string;
  previews: any[];
  artistName: string;
}
