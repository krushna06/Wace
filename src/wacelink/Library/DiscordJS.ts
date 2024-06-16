import { AbstractLibrary } from "./AbstractLibrary.js";
import { WacelinkNodeOptions } from "../Interface/Manager.js";

export class DiscordJS extends AbstractLibrary {
  // sendPacket is where your library send packets to Discord Gateway
  public sendPacket(shardId: number, payload: any, important: boolean): void {
    return this.client.ws.shards.get(shardId)?.send(payload, important);
  }

  // getId is a getter where the lib stores the client user (the one logged in as a bot) id
  public getId(): string {
    return this.client.user.id;
  }

  // getShardCount is for dealing ws with lavalink server
  public getShardCount(): number {
    return this.client.shard && this.client.shard.count ? this.client.shard.count : 1;
  }

  // Listen attaches the event listener to the library you are using
  public listen(nodes: WacelinkNodeOptions[]): void {
    this.client.once("ready", () => this.ready(nodes));
    this.client.on("raw", (packet: any) => this.raw(packet));
  }
}
