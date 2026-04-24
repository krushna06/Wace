import { FastifyRequest, FastifyReply } from "fastify";
import { Manager } from "../../manager.js";

export const getBotStats = (client: Manager) => {
  return async (_request: FastifyRequest, reply: FastifyReply) => {
    const uptimeMs = client.readyAt ? Date.now() - client.readyAt.getTime() : 0;

    const guildCount = client.guilds.cache.size;

    const allUserStats = await client.db.userStats.all();
    const uniqueUsers = new Set(allUserStats.map((e) => e.value.userId));
    const registeredUsers = uniqueUsers.size;

    const activeVCs = client.players.size;

    const allGuildStats = await client.db.guildStats.all();
    const songsPlayed = allGuildStats.reduce(
      (sum, e) => sum + (e.value.songsPlayed ?? 0),
      0
    );

    reply.send({
      uptime: uptimeMs,
      guilds: guildCount,
      registeredUsers,
      activeVCs,
      songsPlayed,
    });
  };
};
