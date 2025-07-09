import util from "node:util";
import { Manager } from "../../manager.js";
import Fastify from "fastify";
import { PermissionFlagsBits } from "discord.js";

export async function getDjStatus(
  client: Manager,
  req: Fastify.FastifyRequest,
  res: Fastify.FastifyReply
) {
  client.logger.info(
    "DjStatusRouterService",
    `${req.method} ${req.routeOptions.url} params=${req.params ? util.inspect(req.params) : "{}"}`
  );
  const guildId = (req.params as Record<string, string>)["guildId"];
  const userId = (req.query as Record<string, string>)["userid"];
  if (!guildId || !userId) {
    res.code(400);
    res.send({ error: "Missing guildId or userid" });
    return;
  }
  const Guild = await client.guilds.fetch(guildId).catch(() => undefined);
  if (!Guild) {
    res.code(400);
    res.send({ error: "Guild not found" });
    return;
  }
  const Member = await Guild.members.fetch(userId).catch(() => undefined);
  if (!Member) {
    res.code(400);
    res.send({ error: "User not found" });
    return;
  }
  const setup = await client.db.setup.get(guildId);
  let hasDJRole = false;
  if (setup && setup.djRole) {
    hasDJRole = Member.roles.cache.has(setup.djRole);
  }
  const hasManageGuild = Member.permissions.has(PermissionFlagsBits.ManageGuild);
  const isAdmin = Member.permissions.has(PermissionFlagsBits.Administrator);
  res.send({ data: (hasDJRole || hasManageGuild || isAdmin) ? 1 : 0 });
} 