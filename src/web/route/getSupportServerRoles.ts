import { FastifyRequest, FastifyReply } from "fastify";
import { Manager } from "../../manager.js";

export const getSupportServerRoles = (client: Manager) => {
  return async (
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { userId } = request.params;
      
      const supportServerId = client.config.bot.SUPPORT_SERVER_ID;
      if (!supportServerId) {
        return reply.code(500).send({
          error: "Support server not configured",
          roles: []
        });
      }

      const guild = await client.guilds.fetch(supportServerId).catch(() => undefined);
      if (!guild) {
        return reply.code(404).send({
          error: "Support server not found",
          roles: []
        });
      }

      const member = await guild.members.fetch(userId).catch(() => undefined);
      if (!member) {
        return reply.code(404).send({
          error: "User not found in support server",
          roles: []
        });
      }
      
      const roleIds = member.roles.cache.map(role => role.id);

      reply.send({
        userId,
        guildId: supportServerId,
        roles: roleIds,
        roleCount: roleIds.length
      });
    } catch (error) {
      client.logger.error("getSupportServerRoles", error);
      reply.code(500).send({
        error: "Internal server error",
        roles: []
      });
    }
  };
};
