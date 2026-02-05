import { Manager } from "../../manager.js";
import { TopggService } from "../../services/TopggService.js";

export default class {
  async execute(client: Manager) {
    client.logger.info("ClientReady", `Logged in ${client.user!.tag}`);

    const activityName = client.config.bot.PRESENCE.activity_name.replace("${version}", client.metadata.version);

    client.user!.setPresence({
      activities: [
        {
          name: activityName,
          type: client.config.bot.PRESENCE.activity_type,
        },
      ],
      status: client.config.bot.PRESENCE.status,
    });

    if (client.config.utilities.TOPGG_TOKEN && client.config.utilities.TOPGG_TOKEN.length !== 0) {
      const topgg = new TopggService(client);
      const res = await topgg.settingUp(String(client.user?.id));
      if (res) {
        client.topgg = topgg;
        client.topgg.startInterval();
      }
    }

    try {
      const allAutoReconnect = await client.db.autoreconnect.all();
      for (const entry of allAutoReconnect) {
        const data = entry.value;
        if (!data.twentyfourseven || !data.guild || !data.voice) continue;
        const guild = await client.guilds.fetch(data.guild).catch(() => null);
        if (!guild) continue;
        const voiceChannel = await guild.channels.fetch(data.voice).catch(() => null);
        if (!voiceChannel || voiceChannel.type !== 2) continue;
        if (!guild.members.me.voice.channelId || guild.members.me.voice.channelId !== data.voice) {
          try {
            await client.wacelink.create({
              guildId: guild.id,
              voiceId: data.voice,
              textId: data.text || null,
              shardId: guild.shardId ?? 0,
              deaf: true,
              volume: client.config.player.DEFAULT_VOLUME,
            });
            client.logger.info("247Startup", `Joined VC for 24/7 in guild ${guild.id} using Wacelink`);
          } catch (e) {
            client.logger.error("247Startup", `Failed to join VC for guild ${guild.id}: ${e}`);
          }
        }
      }
    } catch (e) {
      client.logger.error("247Startup", `Error during 24/7 auto-join: ${e}`);
    }
  }
}
