import { FastifyRequest, FastifyReply } from "fastify";
import { Manager } from "../../../manager.js";

export const getAdminMe = (client: Manager) => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.headers["x-user-id"] as string | undefined;
    if (!userId) return reply.code(400).send({ error: "Missing x-user-id header" });

    const rolesHeader = req.headers["x-user-roles"] as string | undefined;
    const userRoles = rolesHeader ? rolesHeader.split(",").filter(id => id.trim()) : [];

    const ownerConfig = client.config.bot.OWNER_ID;
    const ownerIds = Array.isArray(ownerConfig) ? ownerConfig : [ownerConfig];
    const isOwnerByUserId = ownerIds.includes(userId);
    const isOwnerByRole = userRoles.some(roleId => ownerIds.includes(roleId));
    const isOwner = isOwnerByUserId || isOwnerByRole;

    const adminIds = client.config.bot.ADMIN || [];
    const isAdminByUserId = adminIds.includes(userId);
    const isAdminByRole = userRoles.some(roleId => adminIds.includes(roleId));
    const isAdmin = isAdminByUserId || isAdminByRole;

    if (!isOwner && !isAdmin) {
      return reply.code(403).send({ authorized: false, error: "Access denied" });
    }

    return reply.send({
      authorized: true,
      role: isOwner ? "owner" : "admin",
      userId,
      hasRoleBasedAccess: isOwnerByRole || isAdminByRole,
    });
  };
};

export function requireOwner(client: Manager, req: FastifyRequest, reply: FastifyReply): boolean {
  const userId = req.headers["x-user-id"] as string | undefined;
  if (!userId) {
    reply.code(400).send({ error: "Missing x-user-id header" });
    return false;
  }
  
  const rolesHeader = req.headers["x-user-roles"] as string | undefined;
  const userRoles = rolesHeader ? rolesHeader.split(",").filter(id => id.trim()) : [];
  
  const ownerConfig = client.config.bot.OWNER_ID;
  const ownerIds = Array.isArray(ownerConfig) ? ownerConfig : [ownerConfig];
  
  const isOwnerByUserId = ownerIds.includes(userId);
  const isOwnerByRole = userRoles.some(roleId => ownerIds.includes(roleId));
  
  if (!isOwnerByUserId && !isOwnerByRole) {
    reply.code(403).send({ error: "Owner only" });
    return false;
  }
  return true;
}

export function requireAdmin(client: Manager, req: FastifyRequest, reply: FastifyReply): boolean {
  const userId = req.headers["x-user-id"] as string | undefined;
  if (!userId) {
    reply.code(400).send({ error: "Missing x-user-id header" });
    return false;
  }
  
  const rolesHeader = req.headers["x-user-roles"] as string | undefined;
  const userRoles = rolesHeader ? rolesHeader.split(",").filter(id => id.trim()) : [];
  
  const ownerConfig = client.config.bot.OWNER_ID;
  const ownerIds = Array.isArray(ownerConfig) ? ownerConfig : [ownerConfig];
  const adminIds = client.config.bot.ADMIN || [];
  
  const isOwnerByUserId = ownerIds.includes(userId);
  const isOwnerByRole = userRoles.some(roleId => ownerIds.includes(roleId));
  const isOwner = isOwnerByUserId || isOwnerByRole;
  
  const isAdminByUserId = adminIds.includes(userId);
  const isAdminByRole = userRoles.some(roleId => adminIds.includes(roleId));
  const isAdmin = isAdminByUserId || isAdminByRole;
  
  if (!isOwner && !isAdmin) {
    reply.code(403).send({ error: "Admin access required" });
    return false;
  }
  return true;
}
