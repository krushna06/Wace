import { WacelinkEvents, WacelinkPluginType } from "../../main.js";
import { WacelinkSearchOptions, WacelinkSearchResult, WacelinkSearchResultType } from "../../main.js";
import { WacelinkTrack } from "../../main.js";
import { Wacelink } from "../../main.js";
import { SourceWacelinkPlugin } from "../../main.js";
import NicoResolver from "./NicoResolver.js";
import search from "./NicoSearch.js";

const REGEX = RegExp("https?://(?:www\\.|secure\\.|sp\\.)?nicovideo\\.jp/watch/(?<id>(?:[a-z]{2})?[0-9]+)");

/** The wacelink nicovideo plugin options */
export interface NicoOptions {
  /** The number of how many track u want to resolve */
  searchLimit: number;
}

export class WacelinkPlugin extends SourceWacelinkPlugin {
  /**
   * The options of the plugin.
   */
  public options: NicoOptions;
  private _search: ((query: string, options?: WacelinkSearchOptions) => Promise<WacelinkSearchResult>) | undefined;
  private wacelink: Wacelink | null;

  private readonly methods: Record<string, (id: string, requester: unknown) => Promise<Result>>;

  /**
   * Initialize the plugin.
   * @param nicoOptions Options for run plugin
   */
  constructor(nicoOptions: NicoOptions) {
    super();
    this.options = nicoOptions;
    this.methods = {
      track: this.getTrack.bind(this),
    };
    this.wacelink = null;
  }

  /**
   * Source identify of the plugin
   * @returns string
   */
  public sourceIdentify(): string {
    return "nv";
  }

  /**
   * Source name of the plugin
   * @returns string
   */
  public sourceName(): string {
    return "nicovideo";
  }

  /**
   * Type of the plugin
   * @returns WacelinkPluginType
   */
  public type(): WacelinkPluginType {
    return WacelinkPluginType.SourceResolver;
  }

  /**
   * load the plugin
   * @param wacelink The wacelink class
   */
  public load(wacelink: Wacelink) {
    this.wacelink = wacelink;
    this._search = wacelink.search.bind(wacelink);
    wacelink.search = this.search.bind(this);
  }

  /**
   * Unload the plugin
   * @param wacelink The wacelink class
   */
  public unload(wacelink: Wacelink) {
    this.wacelink = wacelink;
    wacelink.search = wacelink.search.bind(wacelink);
  }

  /** Name function for getting plugin name */
  public name(): string {
    return "wacelink-nico";
  }

  private async search(query: string, options?: WacelinkSearchOptions): Promise<WacelinkSearchResult> {
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
  public async searchDirect(query: string, options?: WacelinkSearchOptions | undefined): Promise<WacelinkSearchResult> {
    if (!this.wacelink || !this._search) throw new Error("wacelink-nico is not loaded yet.");

    if (!query) throw new Error("Query is required");
    const [, id] = REGEX.exec(query) || [];

    const isUrl = /^https?:\/\//.test(query);

    if (id) {
      this.debug(`Start search from ${this.sourceName()} plugin`);
      const _function = this.methods.track;
      const result: Result = await _function(id, options?.requester);

      const loadType = result ? WacelinkSearchResultType.TRACK : WacelinkSearchResultType.SEARCH;
      const playlistName = result.name ?? undefined;

      const tracks = result.tracks.filter(this.filterNullOrUndefined);
      return this.buildSearch(playlistName, tracks && tracks.length !== 0 ? tracks : [], loadType);
    } else if (options?.engine === this.sourceName() && !isUrl) {
      const result = await this.searchTrack(query, options?.requester);

      return this.buildSearch(undefined, result.tracks, WacelinkSearchResultType.SEARCH);
    } else return this.buildSearch(undefined, [], WacelinkSearchResultType.SEARCH);
  }

  private buildSearch(
    playlistName?: string,
    tracks: WacelinkTrack[] = [],
    type?: WacelinkSearchResultType
  ): WacelinkSearchResult {
    return {
      playlistName,
      tracks,
      type: type ?? WacelinkSearchResultType.TRACK,
    };
  }

  private async searchTrack(query: string, requester: unknown) {
    try {
      const { data } = await search({
        q: query,
        targets: ["tagsExact"],
        fields: ["contentId"],
        sort: "-viewCounter",
        limit: 10,
      });

      const res: VideoInfo[] = [];

      for (let i = 0; i < data.length; i++) {
        const element = data[i];
        const nico = new NicoResolver(`https://www.nicovideo.jp/watch/${element.contentId}`);
        const info = await nico.getVideoInfo();
        res.push(info);
      }

      return {
        tracks: res.map((track) => this.buildwacelinkTrack(track, requester)),
      };
    } catch (e: any) {
      throw new Error(e);
    }
  }

  private async getTrack(id: string, requester: unknown) {
    try {
      const niconico = new NicoResolver(`https://www.nicovideo.jp/watch/${id}`);
      const info = await niconico.getVideoInfo();

      return { tracks: [this.buildwacelinkTrack(info, requester)] };
    } catch (e: any) {
      throw new Error(e);
    }
  }

  private filterNullOrUndefined(obj: unknown): obj is unknown {
    return obj !== undefined && obj !== null;
  }

  private buildwacelinkTrack(nicoTrack: any, requester: unknown) {
    return new WacelinkTrack(
      {
        encoded: "",
        info: {
          sourceName: this.sourceName(),
          identifier: nicoTrack.id,
          isSeekable: true,
          author: nicoTrack.owner ? nicoTrack.owner.nickname : "Unknown",
          length: nicoTrack.duration * 1000,
          isStream: false,
          position: 0,
          title: nicoTrack.title,
          uri: `https://www.nicovideo.jp/watch/${nicoTrack.id}`,
          artworkUrl: nicoTrack.thumbnail ? nicoTrack.thumbnail.url : "",
        },
        pluginInfo: {
          name: "wacelink.mod@nico",
        },
      },
      requester
    );
  }

  private debug(logs: string) {
    this.wacelink ? this.wacelink.emit(WacelinkEvents.Debug, `[Wacelink Nico Plugin]: ${logs}`) : true;
  }
}

// Interfaces
/** @ignore */
export interface Result {
  tracks: WacelinkTrack[];
  name?: string;
}
/** @ignore */
export interface OwnerInfo {
  id: number;
  nickname: string;
  iconUrl: string;
  channel: string | null;
  live: {
    id: string;
    title: string;
    url: string;
    begunAt: string;
    isVideoLive: boolean;
    videoLiveOnAirStartTime: string | null;
    thumbnailUrl: string | null;
  } | null;
  isVideoPublic: boolean;
  isMylistsPublic: boolean;
  videoLiveNotice: null;
  viewer: number | null;
}
/** @ignore */
interface OriginalVideoInfo {
  id: string;
  title: string;
  description: string;
  count: {
    view: number;
    comment: number;
    mylist: number;
    like: number;
  };
  duration: number;
  thumbnail: {
    url: string;
    middleUrl: string;
    largeUrl: string;
    player: string;
    ogp: string;
  };
  rating: {
    isAdult: boolean;
  };
  registerdAt: string;
  isPrivate: boolean;
  isDeleted: boolean;
  isNoBanner: boolean;
  isAuthenticationRequired: boolean;
  isEmbedPlayerAllowed: boolean;
  viewer: null;
  watchableUserTypeForPayment: string;
  commentableUserTypeForPayment: string;
  [key: string]: any;
}
/** @ignore */
export interface VideoInfo extends OriginalVideoInfo {
  owner: OwnerInfo;
}
