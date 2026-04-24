import { FastifyRequest, FastifyReply } from "fastify";
import { Manager } from "../../../manager.js";
import { requireAdmin } from "./adminAuth.js";

export const getPremiumUsers = (client: Manager) => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!requireAdmin(client, req, reply)) return;

    const all = await client.db.premium.all();
    const users = all
      .map((e) => e.value)
      .filter((u) => u.isPremium)
      .map((u) => ({
        ...u,
        expired:
          u.expiresAt !== "lifetime" && u.expiresAt < Date.now(),
      }));

    return reply.send({ users });
  };
};

export const deletePremiumUser = (client: Manager) => {
  return async (
    req: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) => {
    if (!requireAdmin(client, req, reply)) return;

    const { userId } = req.params;
    const existing = await client.db.premium.get(userId);
    if (!existing) return reply.code(404).send({ error: "User not found or not premium" });

    await client.db.premium.delete(userId);
    return reply.send({ success: true, userId });
  };
};

export const patchPremiumUser = (client: Manager) => {
  return async (
    req: FastifyRequest<{
      Params: { userId: string };
      Body: { plan?: string; expiresAt?: number | "lifetime" };
    }>,
    reply: FastifyReply
  ) => {
    if (!requireAdmin(client, req, reply)) return;

    const { userId } = req.params;
    const existing = await client.db.premium.get(userId);
    if (!existing) return reply.code(404).send({ error: "User not found" });

    const updated = {
      ...existing,
      ...(req.body?.plan && { plan: req.body.plan }),
      ...(req.body?.expiresAt !== undefined && { expiresAt: req.body.expiresAt }),
    };

    await client.db.premium.set(userId, updated);
    return reply.send({ success: true, user: updated });
  };
};
