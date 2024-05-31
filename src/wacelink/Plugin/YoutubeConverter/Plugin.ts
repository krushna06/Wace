import { WacelinkTrack } from "../../main.js";
import { WacelinkPluginType } from "../../main.js";
import {
  WacelinkSearchOptions,
  WacelinkSearchResult,
  WacelinkSearchResultType,
} from "../../main.js";
import { Wacelink } from "../../main.js";
import { WacelinkPlugin as Plugin } from "../../main.js";

const YOUTUBE_REGEX = [
  /^https?:\/\//,
  /(?:https?:\/\/)?(?:www\.)?youtu(?:\.be\/|be.com\/\S*(?:watch|embed)(?:(?:(?=\/[-a-zA-Z0-9_]{11,}(?!\S))\/)|(?:\S*v=|v\/)))([-a-zA-Z0-9_]{11,})/,
  /^.*(youtu.be\/|list=)([^#\&\?]*).*/,
];

export type YoutubeConvertOptions = {
  /**
   * The order of the source you want to search replaces YouTube, for example: scsearch, spsearch.
   * The more sources added, the slower the performance will be.
   */
  sources?: string[];
};

export class WacelinkPlugin extends Plugin {
  private options: YoutubeConvertOptions;
  private _search?: (
    query: string,
    options?: WacelinkSearchOptions
  ) => Promise<WacelinkSearchResult>;
  constructor(options?: YoutubeConvertOptions) {
    super();
    this.options = options ?? { sources: ["scsearch"] };
    if (!this.options.sources || this.options.sources.length == 0)
      this.options.sources = ["scsearch"];
  }
  /** Name function for getting plugin name */
  public name(): string {
    return "wacelink-youtubeConvert";
  }

  /** Type function for diferent type of plugin */
  public type(): WacelinkPluginType {
    return WacelinkPluginType.Default;
  }

  /** Load function for make the plugin working */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public load(manager: Wacelink): void {
    this._search = manager.search.bind(manager);
    manager.search = this.search.bind(this);
  }

  /** unload function for make the plugin stop working */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public unload(manager: Wacelink): void {
    if (!this._search) return;
    manager.search = this._search.bind(manager);
    this._search = undefined;
  }

  private async search(
    query: string,
    options?: WacelinkSearchOptions
  ): Promise<WacelinkSearchResult> {
    // Check if search func avaliable
    if (!this._search) return this.buildSearch(undefined, [], WacelinkSearchResultType.SEARCH);

    // Check if that's a yt link
    const match = YOUTUBE_REGEX.some((match) => {
      return match.test(query) == true;
    });
    if (!match) return await this._search(query, options);

    // Get search query
    const preRes = await this._search(query, options);
    if (preRes.tracks.length == 0) return preRes;

    // Remove track encoded to trick wacelink
    if (preRes.type == WacelinkSearchResultType.PLAYLIST) {
      for (const track of preRes.tracks) {
        track.encoded = "";
      }
      return preRes;
    }

    const song = preRes.tracks[0];
    const searchQuery = [song.author, song.title].filter((x) => !!x).join(" - ");
    const res = await this.searchEngine(searchQuery, options);
    if (res.tracks.length !== 0) return res;
    return preRes;
  }

  private async searchEngine(
    query: string,
    options?: WacelinkSearchOptions
  ): Promise<WacelinkSearchResult> {
    if (!this._search) return this.buildSearch(undefined, [], WacelinkSearchResultType.SEARCH);
    for (const SearchParams of this.options.sources!) {
      const res = await this._search(`directSearch=${SearchParams}:${query}`, options);
      if (res.tracks.length !== 0) return res;
    }
    return this.buildSearch(undefined, [], WacelinkSearchResultType.SEARCH);
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
}
