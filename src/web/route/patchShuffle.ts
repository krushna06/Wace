import util from "node:util";
import { Manager } from "../../manager.js";
import Fastify from "fastify";

export async function patchShuffle(
  client: Manager,
  req: Fastify.FastifyRequest,
  res: Fastify.FastifyReply
) {
  client.logger.info(
    "StatusRouterService",
    `${req.method} ${req.routeOptions.url} params=${req.params ? util.inspect(req.params) : "{}"}`
  );
  const guildId = (req.params as Record<string, string>)["guildId"];
  const player = client.players.get(guildId);
  if (!player) {
    res.code(400);
    res.send({ error: "Current player not found!" });
    return;
  }
  const { shuffle } = req.body as { shuffle?: boolean };
  if (typeof shuffle !== "boolean") {
    res.code(400);
    res.send({ error: "Missing or invalid 'shuffle' boolean in body" });
    return;
  }
  player.data.set("shuffle", shuffle);
  if (shuffle) {
    player.shuffle();
  }
  res.send({ data: shuffle });
}
