import { Channel } from "discord.js";
import { Manager } from "../../manager.js";

export default class {
  async execute(client: Manager, channel: Channel) {
    if (channel.type !== 2) return;
    const allAutoReconnect = await client.db.autoreconnect.all();
    for (const entry of allAutoReconnect) {
      const data = entry.value;
      if (!data.twentyfourseven || !data.guild || !data.voice) continue;
      if (data.voice === channel.id) {
        await client.db.autoreconnect.delete(data.guild);
        const guild = await client.guilds.fetch(data.guild).catch(() => null);
        if (guild && guild.members.me.voice.channelId === channel.id) {
          try {
            await guild.members.me.voice.disconnect();
            client.logger.info("247Cleanup", `Left deleted VC and cleared 24/7 for guild ${guild.id}`);
          } catch (e) {
            client.logger.error("247Cleanup", `Failed to leave deleted VC for guild ${guild.id}: ${e}`);
          }
        }
      }
    }
  }
} 