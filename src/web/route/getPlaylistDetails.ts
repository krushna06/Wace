import util from "node:util";
import { Manager } from "../../manager.js";
import Fastify from "fastify";

export async function getPlaylistDetails(
  client: Manager,
  req: Fastify.FastifyRequest,
  res: Fastify.FastifyReply
) {
  client.logger.info(
    "PlaylistRouterService",
    `${req.method} ${req.routeOptions.url} params=${req.params ? util.inspect(req.params) : "{}"}`
  );

  const playlistId = (req.params as Record<string, string>)["playlistId"];
  
  if (!playlistId) {
    res.code(400);
    res.send({ error: "Playlist ID is required" });
    return;
  }

  const playlist = await client.db.playlist.get(playlistId);

  if (!playlist) {
    res.code(404);
    res.send({ error: "Playlist not found" });
    return;
  }

  // Only check for private if the user is not the owner
  const userId = req.headers["x-user-id"] as string;
  if (playlist.private && playlist.owner !== userId) {
    res.code(403);
    res.send({ error: "This playlist is private" });
    return;
  }

  res.send({
    data: {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      private: playlist.private,
      created: playlist.created,
      trackCount: playlist.tracks?.length || 0,
      tracks: playlist.tracks?.map(track => ({
        title: track.title,
        uri: track.uri,
        length: track.length,
        thumbnail: track.thumbnail,
        author: track.author,
        requester: track.requester
      })) || []
    }
  });
} 