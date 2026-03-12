import util from "node:util";
import { Manager } from "../../manager.js";
import Fastify from "fastify";

export async function getGuildPremium(
  client: Manager,
  req: Fastify.FastifyRequest,
  res: Fastify.FastifyReply
) {
  client.logger.info(
    "GuildPremiumRouterService",
    `${req.method} ${req.routeOptions.url} params=${req.params ? util.inspect(req.params) : "{}"}`
  );

  const guildId = (req.params as Record<string, string>)["guildId"];

  if (!guildId) {
    res.code(400);
    res.send({ error: "Missing guildId parameter" });
    return;
  }

  try {
    const guildPremiumData = await client.db.preGuild.get(guildId);

    if (!guildPremiumData) {
      res.send({ premium: false });
      return;
    }

    const isExpired = guildPremiumData.expiresAt !== "lifetime" &&
                     guildPremiumData.expiresAt < Date.now();

    res.send({
      premium: guildPremiumData.isPremium && !isExpired
    });
  } catch (error) {
    client.logger.error("GuildPremiumRouterService", `Error checking guild premium status: ${error}`);
    res.code(500);
    res.send({ error: "Internal server error" });
  }
}