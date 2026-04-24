import { Manager } from "../../manager.js";
import cron from "node-cron";

function parseDuration(value: string): number {
  const match = value.trim().match(/^(\d+)(yr|mo|m|w|d|h)$/i);
  if (!match) throw new Error(`Invalid duration format: "${value}". Use e.g. 30d, 1m, 1yr, 2w`);

  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  const MS = {
    h: 1000 * 60 * 60,
    d: 1000 * 60 * 60 * 24,
    w: 1000 * 60 * 60 * 24 * 7,
    m: 1000 * 60 * 60 * 24 * 30,
    mo: 1000 * 60 * 60 * 24 * 30,
    yr: 1000 * 60 * 60 * 24 * 365,
  };

  return amount * (MS[unit] ?? MS.d);
}

export class GuildManagementSetup {
  client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.execute();
  }

  async execute() {
    const cfg = this.client.config.utilities.GUILD_MANAGEMENT;
    if (!cfg) return;

    await this.runChecks();
    cron.schedule("0 0 * * * *", () => this.runChecks());
  }

  async runChecks() {
    const cfg = this.client.config.utilities.GUILD_MANAGEMENT;
    if (!cfg) return;

    if (cfg.LEAVE_SMALL_GUILDS?.enable) {
      await this.checkSmallGuilds(cfg.LEAVE_SMALL_GUILDS.min_members);
    }

    if (cfg.LEAVE_INACTIVE_GUILDS?.enable) {
      await this.checkInactiveGuilds(cfg.LEAVE_INACTIVE_GUILDS.inactive_threshold);
    }
  }

  async checkSmallGuilds(minMembers: number) {
    for (const [, guild] of this.client.guilds.cache) {
      const fetched = await guild.fetch().catch(() => null);
      if (!fetched) continue;

      if (fetched.memberCount < minMembers) {
        this.client.logger.info(
          "GuildManagement",
          `Leaving guild "${fetched.name}" (${fetched.id}) — member count ${fetched.memberCount} < ${minMembers}`
        );
        await fetched.leave().catch(() => null);
      }
    }
  }

  async checkInactiveGuilds(threshold: string) {
    let thresholdMs: number;
    try {
      thresholdMs = parseDuration(threshold);
    } catch (e) {
      this.client.logger.error("GuildManagement", String(e));
      return;
    }

    const now = Date.now();

    for (const [, guild] of this.client.guilds.cache) {
      const lastPlayed = await this.client.db.guildLastPlayed.get(guild.id).catch(() => null);
      const guildStats = await this.client.db.guildStats.get(guild.id).catch(() => null);

      let lastActivity: number | null = null;

      if (lastPlayed?.playedAt) lastActivity = lastPlayed.playedAt;

      if (!lastActivity) {
        lastActivity = guild.createdTimestamp ?? null;
      }

      if (!lastActivity) continue;

      const inactive = now - lastActivity > thresholdMs;
      if (inactive) {
        this.client.logger.info(
          "GuildManagement",
          `Leaving inactive guild "${guild.name}" (${guild.id}) — last activity: ${new Date(lastActivity).toISOString()}`
        );
        await guild.leave().catch(() => null);
      }
    }
  }
}
