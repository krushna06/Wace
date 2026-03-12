import util from "node:util";
import { User } from "discord.js";
import { Manager } from "../../manager.js";
import Fastify from "fastify";

export async function getQueueStatus(
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
  return res.send({
    data: player.queue.map((track) => {
      const requesterQueue = track.requester as User;
      return {
        title: track.info.title,
        uri: track.info.uri,
        length: track.duration || track.info?.length,
        thumbnail: track.info.artworkUrl,
        author: track.info.author,
        requester: requesterQueue
          ? {
              id: requesterQueue.id,
              username: requesterQueue.username,
              globalName: requesterQueue.globalName,
              defaultAvatarURL: requesterQueue.defaultAvatarURL ?? null,
            }
          : null,
      };
    }),
  });
}