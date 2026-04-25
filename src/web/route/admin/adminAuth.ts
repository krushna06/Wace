import { FastifyRequest, FastifyReply } from "fastify";
import { Manager } from "../../../manager.js";

export const getAdminMe = (client: Manager) => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.headers["x-user-id"] as string | undefined;
    if (!userId || !/^\d{17,20}$/.test(userId))
      return reply.code(400).send({ error: "Missing or invalid x-user-id header" });

    const isOwner = client.config.bot.OWNER_ID === userId;
    const isAdmin = client.config.bot.ADMIN?.includes(userId);

    if (!isOwner && !isAdmin) {
      return reply.code(403).send({ authorized: false, error: "Access denied" });
    }

    return reply.send({
      authorized: true,
      role: isOwner ? "owner" : "admin",
      userId,
    });
  };
};

export function requireOwner(client: Manager, req: FastifyRequest, reply: FastifyReply): boolean {
  const userId = req.headers["x-user-id"] as string | undefined;
  if (!userId || !/^\d{17,20}$/.test(userId)) {
    reply.code(400).send({ error: "Missing or invalid x-user-id header" });
    return false;
  }
  if (client.config.bot.OWNER_ID !== userId) {
    reply.code(403).send({ error: "Owner only" });
    return false;
  }
  return true;
}

export function requireAdmin(client: Manager, req: FastifyRequest, reply: FastifyReply): boolean {
  const userId = req.headers["x-user-id"] as string | undefined;
  if (!userId || !/^\d{17,20}$/.test(userId)) {
    reply.code(400).send({ error: "Missing or invalid x-user-id header" });
    return false;
  }
  const isOwner = client.config.bot.OWNER_ID === userId;
  const isAdmin = client.config.bot.ADMIN?.includes(userId);
  if (!isOwner && !isAdmin) {
    reply.code(403).send({ error: "Admin access required" });
    return false;
  }
  return true;
}
