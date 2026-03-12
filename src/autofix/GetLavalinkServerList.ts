import { LavalinkDataType } from "../@types/Lavalink.js";
export interface LavalinkServerResponse {
  "unique-id": string;
  identifier: string;
  host: string;
  port: number;
  password: string;
  secure: boolean;
  version: string;
}
export class GetLavalinkServerList {
  private static serverCache: LavalinkDataType[] | null = null;
  private static readonly CACHE_TTL = 300000;
  private static lastFetchTime = 0;
  private static readonly MAX_SERVERS = 3;
  async execute(): Promise<LavalinkDataType[]> {
    if (
      GetLavalinkServerList.serverCache &&
      Date.now() - GetLavalinkServerList.lastFetchTime < GetLavalinkServerList.CACHE_TTL
    ) {
      return GetLavalinkServerList.serverCache;
    }
    try {
      const res = await fetch("https://lavalink-list.ajieblogs.eu.org/All");
      const data: LavalinkServerResponse[] = await res.json();
      const servers = data
        .slice(0, GetLavalinkServerList.MAX_SERVERS)
        .map((server) => ({
          host: server.host,
          port: server.port,
          pass: server.password,
          secure: server.secure,
          name: server.identifier,
          online: true,
        }));
      GetLavalinkServerList.serverCache = servers;
      GetLavalinkServerList.lastFetchTime = Date.now();
      return servers;
    } catch (error) {
      return [];
    }
  }
}