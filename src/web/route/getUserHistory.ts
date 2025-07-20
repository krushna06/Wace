import { FastifyRequest, FastifyReply } from "fastify";
import { Manager } from "../../manager.js";

export const getUserHistory = (client: Manager) => {
  return async (
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) => {
    const { userId } = request.params;
    const allStats = await client.db.songStats.all();
    const userSongs = allStats
      .filter((entry) => entry.value.userId === userId)
      .sort((a, b) => {
        if ((b.value.playCount || 0) === (a.value.playCount || 0)) {
          return a.value.title.localeCompare(b.value.title);
        }
        return (b.value.playCount || 0) - (a.value.playCount || 0);
      })
      .map((entry) => ({
        songId: entry.value.songId,
        title: entry.value.title,
        author: entry.value.author,
        uri: entry.value.uri,
        playCount: entry.value.playCount,
        image: entry.value.artworkUrl || null,
      }));
    if (!userSongs.length) {
      return reply.code(404).send({ error: "No song history found for this user." });
    }
    reply.send({ userId, history: userSongs });
  };
}; 