import { FastifyRequest, FastifyReply } from "fastify";
import { Manager } from "../../manager.js";

export const getGuilds = (client: Manager) => {
  return async (_request: FastifyRequest, reply: FastifyReply) => {
    const guilds = client.guilds.cache.map((guild) => ({
      id: guild.id,
      name: guild.name,
      memberCount: guild.memberCount,
      icon: guild.iconURL(),
      owner: guild.ownerId,
    }));

    reply.send({
      total: guilds.length,
      guilds,
    });
  };
};
