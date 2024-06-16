import { WacelinkNodeOptions } from "../Interface/Manager.js";
import { Wacelink } from "../Wacelink.js";
export const AllowedPackets = ["VOICE_STATE_UPDATE", "VOICE_SERVER_UPDATE"];

export abstract class AbstractLibrary {
  protected readonly client: any;
  protected manager: Wacelink | null;
  constructor(client: any) {
    this.client = client;
    this.manager = null;
  }

  protected ready(nodes: WacelinkNodeOptions[]): void {
    this.manager!.id = this.getId();
    this.manager!.shardCount = this.getShardCount();
    this.manager!.emit(
      "debug",
      `[Wacelink] | Finished the initialization process | Registered ${this.manager!.plugins.size} plugins | Now connect all current nodes`
    );
    for (const node of nodes) this.manager?.nodes.add(node);
  }

  public set(manager: Wacelink): AbstractLibrary {
    this.manager = manager;
    return this;
  }

  abstract getId(): string;

  abstract getShardCount(): number;

  abstract sendPacket(shardId: number, payload: any, important: boolean): void;

  abstract listen(nodes: WacelinkNodeOptions[]): void;

  protected raw(packet: any): void {
    if (!AllowedPackets.includes(packet.t)) return;
    const guildId = packet.d.guild_id;
    const players = this.manager!.players.get(guildId);
    if (!players) return;
    if (packet.t === "VOICE_SERVER_UPDATE") return players.setServerUpdate(packet.d);
    const userId = packet.d.user_id;
    if (userId !== this.manager!.id) return;
    players.setStateUpdate(packet.d);
  }
}
