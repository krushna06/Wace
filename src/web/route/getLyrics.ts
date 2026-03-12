import { FastifyRequest, FastifyReply } from "fastify";
import { Manager } from "../../manager.js";
import { getLyrics } from "genius-lyrics-api";
import { Lyricist } from "@execaman/lyricist";

export const getLyricsRoute = (client: Manager) => {
  return async (
    request: FastifyRequest<{
      Params: { guildId?: string };
      Querystring: { title?: string; artist?: string };
    }>,
    reply: FastifyReply
  ) => {
    try {
      let title = request.query.title || "";
      let artist = request.query.artist || "";
      let query = "";
      if (!title || !artist) {
        const guildId = request.params.guildId;
        if (!guildId) {
          return reply.code(400).send({ error: "Missing guildId or song info" });
        }
        const player = client.players.get(guildId);
        if (!player || !player.current) {
          return reply.code(404).send({ error: "No song is currently playing, or missing title/artist info." });
        }
        title = player.current.title || "";
        artist = player.current.author || "";
        if (!title || !artist) {
          return reply.code(404).send({ error: "No song is currently playing, or missing title/artist info." });
        }
        query = `${title} - ${artist}`;
      } else {
        query = `${title} - ${artist}`;
      }

      let lyricsRes: string | null = null;
      const geniusConfig = client.config.player.GENIUS;
      if (geniusConfig && geniusConfig.enable && geniusConfig.api_key) {
        try {
          const options = {
            apiKey: geniusConfig.api_key,
            title: title,
            artist: artist,
            optimizeQuery: true,
          };
          lyricsRes = await getLyrics(options);
        } catch (err) {
          lyricsRes = null;
        }
      }

      if (!lyricsRes) {
        try {
          const lyricist = new Lyricist({ plugins: [], saveLastResult: false });
          const result = await lyricist.fetch(query, 3);
          lyricsRes = result.lyrics;
        } catch (err) {
          lyricsRes = null;
        }
      }

      if (!lyricsRes) {
        return reply.code(404).send({ error: "Lyrics not found." });
      }

      if (lyricsRes.length > 8192) {
        return reply.code(413).send({ error: "Lyrics too long to display." });
      }

      if (lyricsRes) {
        const match = lyricsRes.match(/(\[[A-Za-z0-9'’\- ]+\][\s\S]*)/);
        if (match && match[1]) {
          lyricsRes = match[1].trim();
        }
      }

      return reply.send({
        title,
        artist,
        lyrics: lyricsRes,
        source: lyricsRes ? (lyricsRes.length > 0 ? "Genius or Lyricist" : null) : null,
      });
    } catch (error) {
      client.logger.error("getLyricsRoute", error);
      return reply.code(500).send({ error: "Internal server error" });
    }
  };
}; 