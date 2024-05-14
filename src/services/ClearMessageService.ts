import { Manager } from "../manager.js";
import { TextChannel } from "discord.js";
import { WacelinkPlayer } from "../wacelink/main.js";

export class ClearMessageService {
  client: Manager;
  channel: TextChannel;
  player: WacelinkPlayer;
  constructor(client: Manager, channel: TextChannel, player: WacelinkPlayer) {
    this.channel = channel;
    this.client = client;
    this.player = player;
    this.execute();
  }

  async execute() {
    try {
      const nplayingMsg = this.client.nplayingMsg.get(this.player.guildId);
      if (!nplayingMsg) return;
      nplayingMsg.coll.stop();
      nplayingMsg.msg.delete().catch(() => null);
      this.client.nplayingMsg.delete(this.player.guildId);
    } catch (err) {}
  }
}
