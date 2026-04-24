import { FastifyRequest, FastifyReply } from "fastify";
import voucher_codes from "voucher-code-generator";
import { Manager } from "../../../manager.js";
import { requireAdmin } from "./adminAuth.js";

const VALID_PLANS = ["daily", "weekly", "monthly", "yearly", "lifetime"] as const;
type Plan = (typeof VALID_PLANS)[number];

function getExpiry(plan: Plan): number | "lifetime" {
  const DAY = 86_400_000;
  switch (plan) {
    case "daily":    return Date.now() + DAY;
    case "weekly":   return Date.now() + DAY * 7;
    case "monthly":  return Date.now() + DAY * 30;
    case "yearly":   return Date.now() + DAY * 365;
    case "lifetime": return "lifetime";
  }
}

export const getPremiumKeys = (client: Manager) => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!requireAdmin(client, req, reply)) return;

    const all = await client.db.code.all();
    return reply.send({ keys: all.map((e) => e.value) });
  };
};

export const postGeneratePremiumKeys = (client: Manager) => {
  return async (
    req: FastifyRequest<{ Body: { plan: Plan; amount?: number } }>,
    reply: FastifyReply
  ) => {
    if (!requireAdmin(client, req, reply)) return;

    const { plan, amount = 1 } = req.body ?? {};
    if (!plan || !VALID_PLANS.includes(plan))
      return reply.code(400).send({ error: `plan must be one of: ${VALID_PLANS.join(", ")}` });
    if (amount < 1 || amount > 100)
      return reply.code(400).send({ error: "amount must be between 1 and 100" });

    const expiresAt = getExpiry(plan);
    const generated: string[] = [];

    for (let i = 0; i < amount; i++) {
      const code = voucher_codes
        .generate({ pattern: "#############-#########-######" })[0]
        .toUpperCase();

      const exists = await client.db.code.get(code);
      if (!exists) {
        await client.db.code.set(code, { code, plan, expiresAt });
        generated.push(code);
      }
    }

    return reply.code(201).send({ success: true, plan, expiresAt, codes: generated });
  };
};

export const deletePremiumKey = (client: Manager) => {
  return async (
    req: FastifyRequest<{ Params: { code: string } }>,
    reply: FastifyReply
  ) => {
    if (!requireAdmin(client, req, reply)) return;

    const { code } = req.params;
    const existing = await client.db.code.get(code);
    if (!existing) return reply.code(404).send({ error: "Key not found" });

    await client.db.code.delete(code);
    return reply.send({ success: true, code });
  };
};
