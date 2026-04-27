import { FastifyRequest, FastifyReply } from "fastify";
import { Manager } from "../../../manager.js";

export const getCheckAdminAccess = (client: Manager) => {
  return async (req: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
    const userId = req.params.userId as string | undefined;
    if (!userId) {
      return reply.code(400).send({ error: "Missing userId parameter" });
    }

    const supportServerId = client.config.bot.SUPPORT_SERVER_ID;
    if (!supportServerId) {
      return reply.code(500).send({ error: "Support server not configured" });
    }

    try {
      const guild = await client.guilds.fetch(supportServerId);
      if (!guild) {
        return reply.code(500).send({ error: "Support server not found" });
      }

      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) {
        return reply.send({ isAdmin: false, reason: "User not in support server" });
      }

      const ownerConfig = client.config.bot.OWNER_ID;
      const ownerIds = Array.isArray(ownerConfig) ? ownerConfig : [ownerConfig];
      const isOwnerByUserId = ownerIds.includes(userId);
      const isOwnerByRole = member.roles.cache.some(role => ownerIds.includes(role.id));
      const isOwner = isOwnerByUserId || isOwnerByRole;

      if (isOwner) {
        return reply.send({ isAdmin: true, role: "owner" });
      }

      const adminIds = client.config.bot.ADMIN || [];
      const isAdminByUserId = adminIds.includes(userId);
      const isAdminByRole = member.roles.cache.some(role => adminIds.includes(role.id));
      const isAdmin = isAdminByUserId || isAdminByRole;

      if (isAdmin) {
        return reply.send({ isAdmin: true, role: "admin" });
      }

      return reply.send({ isAdmin: false, reason: "User does not have admin/owner role in support server" });
    } catch (error) {
      client.logger.error("CheckAdminAccess", `Error checking admin access: ${error}`);
      return reply.code(500).send({ error: "Failed to check admin access" });
    }
  };
};
