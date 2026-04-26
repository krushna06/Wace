import util from "node:util";
import { Manager } from "../../manager.js";
import Fastify from "fastify";

export async function getUserPlaylists(
  client: Manager,
  req: Fastify.FastifyRequest,
  res: Fastify.FastifyReply
) {
  client.logger.info(
    "PlaylistRouterService",
    `${req.method} ${req.routeOptions.url} params=${req.params ? util.inspect(req.params) : "{}"}`
  );

  const userId = (req.params as Record<string, string>)["userId"];

  if (!userId) {
    res.code(400);
    res.send({ error: "User ID is required" });
    return;
  }

  const allPlaylists = await client.db.playlist.all();
  const userPlaylists = allPlaylists.filter(playlist => playlist.value.owner === userId);

  res.send({
    data: userPlaylists.map(playlist => ({
      id: playlist.value.id,
      name: playlist.value.name,
      description: playlist.value.description,
      private: playlist.value.private,
      created: playlist.value.created,
      trackCount: playlist.value.tracks?.length || 0,
      tracks: playlist.value.tracks?.map(track => ({
        title: track.info.title,
        uri: track.info.uri,
        length: track.length,
        thumbnail: track.thumbnail,
        author: track.info.author,
        requester: track.requester
      })) || []
    }))
  });
}