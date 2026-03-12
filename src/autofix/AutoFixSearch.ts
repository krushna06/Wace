import { Manager } from "../manager.js";
import { Player, SearchResult } from "../structures/Player.js";
import { GetLavalinkServerList } from "./GetLavalinkServerList.js";

export class AutoFixSearch {
  client: Manager;
  player: Player;
  searchQuery: string;
  requester: any;
  private static searchCache = new Map<string, { result: SearchResult | null; timestamp: number }>();
  private static readonly CACHE_TTL = 60000;

  constructor(client: Manager, player: Player, searchQuery: string, requester: any) {
    this.client = client;
    this.player = player;
    this.searchQuery = searchQuery;
    this.requester = requester;
  }

  async execute(): Promise<SearchResult | null> {
    const cacheKey = `${this.searchQuery}`;
    const cached = AutoFixSearch.searchCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < AutoFixSearch.CACHE_TTL) {
      this.client.logger.info(
        AutoFixSearch.name,
        `Using cached result for: ${this.searchQuery}`
      );
      return cached.result;
    }

    this.client.logger.info(
      AutoFixSearch.name,
      "----- Starting autofix search for: " + this.searchQuery + " -----"
    );

    const getLavalinkServerList = new GetLavalinkServerList();
    const serverList = await getLavalinkServerList.execute();

    if (serverList.length === 0) {
      this.client.logger.warn(AutoFixSearch.name, "Failed to fetch lavalink server list");
      AutoFixSearch.searchCache.set(cacheKey, { result: null, timestamp: Date.now() });
      return null;
    }

    for (let i = 0; i < serverList.length; i++) {
      const server = serverList[i];

      try {
        let nodeExists = this.client.shoukaku.nodes.get(server.name);

        if (!nodeExists) {
          this.client.shoukaku.nodes.add({
            host: server.host,
            port: server.port,
            auth: server.pass,
            name: server.name,
            secure: server.secure,
          });

          const connected = await this.waitForNodeConnection(server.name, 5000);
          if (!connected) {
            this.client.logger.debug(
              AutoFixSearch.name,
              `Server ${server.name} failed to connect, removing and trying next...`
            );
            this.client.shoukaku.nodes.remove(server.name);
            continue;
          }
        }

        const result = await Promise.race([
          this.player.search(this.searchQuery, { requester: this.requester }),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error("Search timeout")), 10000)
          ),
        ]);

        if (result && result.tracks && result.tracks.length > 0) {
          this.client.logger.info(
            AutoFixSearch.name,
            `Found song using server: ${server.name}`
          );
          this.client.logger.info(
            AutoFixSearch.name,
            "----- Terminated autofix search. -----"
          );

          this.player.data.set("tempLavalinkNode", server.name);

          AutoFixSearch.searchCache.set(cacheKey, { result, timestamp: Date.now() });

          return result;
        } else {
          this.client.logger.debug(
            AutoFixSearch.name,
            `Server ${server.name} returned no results, trying next...`
          );
          this.client.shoukaku.nodes.remove(server.name);
          continue;
        }
      } catch (error) {
        this.client.logger.debug(
          AutoFixSearch.name,
          `Server ${server.name} failed: ${error instanceof Error ? error.message : String(error)}`
        );

        try {
          this.client.shoukaku.nodes.remove(server.name);
        } catch (e) {
        }
        continue;
      }
    }

    this.client.logger.warn(
      AutoFixSearch.name,
      "No lavalink server found a match for: " + this.searchQuery
    );
    this.client.logger.info(AutoFixSearch.name, "----- Terminated autofix search. -----");

    AutoFixSearch.searchCache.set(cacheKey, { result: null, timestamp: Date.now() });

    return null;
  }

  private waitForNodeConnection(nodeName: string, timeout: number): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        const node = this.client.shoukaku.nodes.get(nodeName);
        if (node && node.online) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 500);
    });
  }
}
