import { FastifyRequest, FastifyReply } from "fastify";
import { Manager } from "../../manager.js";
import { getTopSongsForGuild, getTopUsersForGuild, getLastPlayedSongForGuild } from "../../database/handler.js";

export const getUserStats = (client: Manager) => {
  return async (
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) => {
    const { userId } = request.params;
    const allStats = await client.db.userStats.all();
    const userStats = allStats.filter((entry) => entry.value.userId === userId);
    if (!userStats.length) {
      return reply.code(404).send({ error: "User stats not found" });
    }
    const songsPlayed = userStats.reduce((sum, entry) => sum + (entry.value.songsPlayed ?? 0), 0);
    const commandsExecuted = userStats.reduce((sum, entry) => sum + (entry.value.commandsExecuted ?? 0), 0);
    reply.send({
      userId,
      songsPlayed,
      commandsExecuted,
    });
  };
};

export const getGuildStats = (client: Manager) => {
  return async (
    request: FastifyRequest<{ Params: { guildId: string } }>,
    reply: FastifyReply
  ) => {
    const { guildId } = request.params;
    const stats = await client.db.guildStats.get(guildId);
    if (!stats) {
      return reply.code(404).send({ error: "Guild stats not found" });
    }
    reply.send({
      guildId,
      songsPlayed: stats.songsPlayed ?? 0,
      commandsExecuted: stats.commandsExecuted ?? 0,
    });
  };
};

export const getTopSongs = (client: Manager) => {
  return async (
    request: FastifyRequest<{ Params: { guildId: string } }>,
    reply: FastifyReply
  ) => {
    const { guildId } = request.params;
    const topSongs = await getTopSongsForGuild(client.db, guildId);
    reply.send({ guildId, topSongs });
  };
};

export const getTopUsers = (client: Manager) => {
  return async (
    request: FastifyRequest<{ Params: { guildId: string } }>,
    reply: FastifyReply
  ) => {
    const { guildId } = request.params;
    const topUsers = await getTopUsersForGuild(client.db, guildId);
    let usersWithNames = [];
    try {
      const guild = await client.guilds.fetch(guildId).catch(() => undefined);
      if (guild) {
        usersWithNames = (await Promise.all(
          topUsers.map(async (u) => {
            let username = u.userId;
            let isBot = false;
            try {
              const member = await guild.members.fetch(u.userId).catch(() => undefined);
              if (member) {
                username = member.user.username;
                isBot = member.user.bot;
              }
            } catch {}
            return { ...u, username, isBot };
          })
        )).filter(u => !u.isBot);
      } else {
        usersWithNames = topUsers.map((u) => ({ ...u, username: u.userId, isBot: false }));
      }
    } catch {
      usersWithNames = topUsers.map((u) => ({ ...u, username: u.userId, isBot: false }));
    }
    reply.send({ guildId, topUsers: usersWithNames });
  };
};

export const getLastPlayed = (client: Manager) => {
  return async (
    request: FastifyRequest<{ Params: { guildId: string } }>,
    reply: FastifyReply
  ) => {
    const { guildId } = request.params;
    const lastPlayed = await getLastPlayedSongForGuild(client.db, guildId);
    reply.send({ guildId, lastPlayed });
  };
}; 