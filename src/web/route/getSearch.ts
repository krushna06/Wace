import util from "node:util";
import { User } from "discord.js";
import { Manager } from "../../manager.js";
import Fastify from "fastify";
import { getNode } from "../../utilities/GetNode.js";

export async function getSearch(
  client: Manager,
  req: Fastify.FastifyRequest,
  res: Fastify.FastifyReply
) {
  client.logger.info(
    "SearchRouterService",
    `${req.method} ${req.routeOptions.url} query=${req.query ? util.inspect(req.query) : "{}"}`
  );
  const query = (req.query as Record<string, string>)["identifier"];
  const requester = (req.query as Record<string, string>)["requester"];
  const source = (req.query as Record<string, string>)["source"];
  let validSource = "youtube";
  if (source) {
    const isSourceExist = getNode(client)?.rest.resolveEngines.get(source);
    if (isSourceExist) validSource = source;
  }
  const user = await client.users.fetch(requester).catch(() => undefined);
  if (!query) {
    res.code(400);
    res.send({ error: "Search param not found" });
    return;
  }
  const node = getNode(client);
  if (!node) {
    res.code(404);
    res.send({ error: "No node available!" });
    return;
  }

  const searchQuery = query.startsWith("http") ? query : `${validSource}search:${query}`;
  const rawResult = await node.rest.resolve(searchQuery).catch(() => null);
  
  if (!rawResult || !rawResult.tracks.length) {
    res.code(404);
    res.send({ error: "No tracks found" });
    return;
  }

  const result = {
    type: rawResult.playlistInfo?.name ? "PLAYLIST" : (searchQuery.includes("search:") ? "SEARCH" : "TRACK"),
    playlistName: rawResult.playlistInfo?.name,
    tracks: rawResult.tracks.map((track) => ({
      ...track,
      requester: user,
      duration: track.duration || track.info?.length,
      title: track.info.title,
      uri: track.info.uri,
      author: track.info.author,
      artworkUrl: track.info.artworkUrl,
      identifier: track.info.identifier,
    })),
  };

  res.send({
    type: result.type,
    playlistName: result.playlistName ?? null,
    tracks: result.tracks.map((track) => {
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
