import { FastifyRequest, FastifyReply } from "fastify";
import { Manager } from "../../../manager.js";
import { Accessableby } from "../../../structures/Command.js";
import { requireAdmin } from "./adminAuth.js";

export const getAdminCommands = (client: Manager) => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!requireAdmin(client, req, reply)) return;

    const allOverrides = await client.db.commandOverrides.all();
    const overrideMap = new Map(allOverrides.map((e) => [e.value.commandKey, e.value.isPremium]));

    const categories: Record<string, { key: string; name: string; description: string; isPremium: boolean; originalAccessableby: string[] }[]> = {};

    for (const [key, command] of client.commands) {
      const category = command.category || "Uncategorized";
      if (!categories[category]) categories[category] = [];

      const nativelyPremium =
        command.accessableby.includes(Accessableby.Premium) ||
        command.accessableby.includes(Accessableby.GuildPremium);

      const isPremium = overrideMap.has(key) ? overrideMap.get(key)! : nativelyPremium;

      categories[category].push({
        key,
        name: command.name.join(" "),
        description: command.description,
        isPremium,
        originalAccessableby: command.accessableby,
      });
    }

    return reply.send({ categories });
  };
};

export const patchAdminCommand = (client: Manager) => {
  return async (
    req: FastifyRequest<{ Params: { commandKey: string }; Body: { isPremium: boolean } }>,
    reply: FastifyReply
  ) => {
    if (!requireAdmin(client, req, reply)) return;

    const { commandKey } = req.params;
    const { isPremium } = req.body ?? {};

    if (typeof isPremium !== "boolean")
      return reply.code(400).send({ error: "isPremium must be a boolean" });

    if (!client.commands.has(commandKey))
      return reply.code(404).send({ error: `Command "${commandKey}" not found` });

    await client.db.commandOverrides.set(commandKey, { commandKey, isPremium });

    return reply.send({ success: true, commandKey, isPremium });
  };
};

export const deleteAdminCommandOverride = (client: Manager) => {
  return async (
    req: FastifyRequest<{ Params: { commandKey: string } }>,
    reply: FastifyReply
  ) => {
    if (!requireAdmin(client, req, reply)) return;

    const { commandKey } = req.params;
    await client.db.commandOverrides.delete(commandKey);

    return reply.send({ success: true, commandKey, reset: true });
  };
};
