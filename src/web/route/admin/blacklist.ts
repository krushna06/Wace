import { FastifyRequest, FastifyReply } from "fastify";
import { Manager } from "../../../manager.js";
import { requireAdmin } from "./adminAuth.js";

export const getBlacklist = (client: Manager) => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!requireAdmin(client, req, reply)) return;

    const all = await client.db.blacklist.all();
    return reply.send({ entries: all.map((e) => e.value) });
  };
};

export const postBlacklist = (client: Manager) => {
  return async (
    req: FastifyRequest<{ Body: { id: string; type: "user" | "guild"; reason?: string } }>,
    reply: FastifyReply
  ) => {
    if (!requireAdmin(client, req, reply)) return;

    const { id, type, reason } = req.body ?? {};
    if (!id || !type) return reply.code(400).send({ error: "id and type are required" });
    if (type !== "user" && type !== "guild")
      return reply.code(400).send({ error: "type must be 'user' or 'guild'" });

    const existing = await client.db.blacklist.get(id);
    if (existing) return reply.code(409).send({ error: `${id} is already blacklisted` });

    const actorId = req.headers["x-user-id"] as string;
    await client.db.blacklist.set(id, {
      id,
      type,
      reason: reason ?? "No reason provided",
      blacklistedAt: Date.now(),
      blacklistedBy: actorId,
    });

    return reply.code(201).send({ success: true, id, type });
  };
};

export const deleteBlacklist = (client: Manager) => {
  return async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    if (!requireAdmin(client, req, reply)) return;

    const { id } = req.params;
    const existing = await client.db.blacklist.get(id);
    if (!existing) return reply.code(404).send({ error: `${id} not found in blacklist` });

    await client.db.blacklist.delete(id);
    return reply.send({ success: true, id });
  };
};
