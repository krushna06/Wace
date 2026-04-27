import { FastifyRequest, FastifyReply } from "fastify";
import { Manager } from "../../manager.js";

export const getUserRoles = (client: Manager) => {
  return async (
    request: FastifyRequest<{ Params: { guildId: string; userId: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { guildId, userId } = request.params;
      
      const guild = await client.guilds.fetch(guildId).catch(() => undefined);
      if (!guild) {
        return reply.code(404).send({
          error: "Guild not found",
          roles: []
        });
      }

      const member = await guild.members.fetch(userId).catch(() => undefined);
      if (!member) {
        return reply.code(404).send({
          error: "User not found in guild",
          roles: []
        });
      }
      const roleIds = member.roles.cache.map(role => role.id);

      reply.send({
        userId,
        guildId,
        roles: roleIds,
        roleCount: roleIds.length
      });
    } catch (error) {
      client.logger.error("getUserRoles", error);
      reply.code(500).send({
        error: "Internal server error",
        roles: []
      });
    }
  };
};
