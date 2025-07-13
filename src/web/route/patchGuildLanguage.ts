import util from "node:util";
import { Manager } from "../../manager.js";
import Fastify from "fastify";

export async function patchGuildLanguage(
  client: Manager,
  req: Fastify.FastifyRequest,
  res: Fastify.FastifyReply
) {
  client.logger.info(
    "GuildLanguageRouterService",
    `${req.method} ${req.routeOptions.url} params=${req.params ? util.inspect(req.params) : "{}"} body=${req.body ? util.inspect(req.body) : "{}"}`
  );
  const guildId = (req.params as Record<string, string>)["guildId"];
  const { language } = req.body as { language?: string };
  if (!guildId) {
    res.code(400);
    res.send({ error: "Missing guildId parameter" });
    return;
  }
  if (!language) {
    res.code(400);
    res.send({ error: "Missing language in body" });
    return;
  }
  const available = client.i18n.getLocales();
  if (!available.includes(language)) {
    res.code(400);
    res.send({ error: `Invalid language code. Available: ${available.join(", ")}` });
    return;
  }
  try {
    await client.db.language.set(guildId, language);
    res.send({ success: true, language });
  } catch (error) {
    client.logger.error("GuildLanguageRouterService", `Error setting language: ${error}`);
    res.code(500);
    res.send({ error: "Internal server error" });
  }
}

export async function getGuildLanguage(
  client: Manager,
  req: Fastify.FastifyRequest,
  res: Fastify.FastifyReply
) {
  client.logger.info(
    "GuildLanguageRouterService",
    `${req.method} ${req.routeOptions.url} params=${req.params ? util.inspect(req.params) : "{}"}`
  );
  const guildId = (req.params as Record<string, string>)["guildId"];
  if (!guildId) {
    res.code(400);
    res.send({ error: "Missing guildId parameter" });
    return;
  }
  try {
    let language = await client.db.language.get(guildId);
    if (!language) {
      language = client.config.bot.LANGUAGE || "en";
      await client.db.language.set(guildId, language);
    }
    const available = client.i18n.getLocales();
    res.send({
      guildId,
      language,
      available,
    });
  } catch (error) {
    client.logger.error("GuildLanguageRouterService", `Error getting language: ${error}`);
    res.code(500);
    res.send({ error: "Internal server error" });
  }
} 