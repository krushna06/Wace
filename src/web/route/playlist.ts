import { FastifyRequest, FastifyReply } from "fastify";
import { Manager } from "../../manager.js";
import id from "voucher-code-generator";

export const createPlaylist = (client: Manager) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { name, description, owner } = request.body as { name: string; description?: string; owner: string };
      if (!name || !owner) {
        return reply.code(400).send({ error: "Missing required fields: name, owner" });
      }
      if (name.length > 16) {
        return reply.code(400).send({ error: "Playlist name cannot be longer than 16 characters" });
      }
      if (description && description.length > 1000) {
        return reply.code(400).send({ error: "Playlist description cannot be longer than 1000 characters" });
      }
      const allPlaylists = await client.db.playlist.all();
      const userPlaylists = allPlaylists.filter((data) => data.value.owner === owner);
      if (userPlaylists.length >= client.config.player.LIMIT_PLAYLIST) {
        return reply.code(400).send({ error: `You cannot create more than ${client.config.player.LIMIT_PLAYLIST} playlists` });
      }
      const idgen = id.generate({ length: 8, prefix: "playlist-" })[0];
      const playlist = {
        id: idgen,
        name,
        owner,
        tracks: [],
        private: true,
        created: Date.now(),
        description: description || null,
      };
      await client.db.playlist.set(idgen, playlist);
      reply.send({ success: true, data: playlist });
    } catch (error) {
      client.logger.error("createPlaylist", error);
      reply.code(500).send({ error: "Internal server error" });
    }
  };
};

export const deletePlaylist = (client: Manager) => {
  return async (request: FastifyRequest<{ Params: { playlistId: string } }>, reply: FastifyReply) => {
    try {
      const { playlistId } = request.params;
      const owner = (request.body as any)?.owner || request.headers["x-owner"];
      if (!owner) {
        return reply.code(400).send({ error: "Missing owner in body or x-owner header" });
      }
      const playlist = await client.db.playlist.get(playlistId);
      if (!playlist) {
        return reply.code(404).send({ error: "Playlist not found" });
      }
      if (playlist.owner !== owner) {
        return reply.code(403).send({ error: "You are not the playlist owner" });
      }
      await client.db.playlist.delete(playlistId);
      reply.send({ success: true, message: `Playlist ${playlistId} deleted` });
    } catch (error) {
      client.logger.error("deletePlaylist", error);
      reply.code(500).send({ error: "Internal server error" });
    }
  };
};

export const editPlaylist = (client: Manager) => {
  return async (request: FastifyRequest<{ Params: { playlistId: string } }>, reply: FastifyReply) => {
    try {
      const { playlistId } = request.params;
      const { name, description, private: priv, owner } = request.body as { name?: string; description?: string; private?: boolean; owner: string };
      if (!owner) {
        return reply.code(400).send({ error: "Missing owner in body" });
      }
      const playlist = await client.db.playlist.get(playlistId);
      if (!playlist) {
        return reply.code(404).send({ error: "Playlist not found" });
      }
      if (playlist.owner !== owner) {
        return reply.code(403).send({ error: "You are not the playlist owner" });
      }
      if (name && name.length > 16) {
        return reply.code(400).send({ error: "Playlist name cannot be longer than 16 characters" });
      }
      if (description && description.length > 1000) {
        return reply.code(400).send({ error: "Playlist description cannot be longer than 1000 characters" });
      }
      if (name) playlist.name = name;
      if (description !== undefined) playlist.description = description;
      if (priv !== undefined) playlist.private = priv;
      await client.db.playlist.set(playlistId, playlist);
      reply.send({ success: true, data: playlist });
    } catch (error) {
      client.logger.error("editPlaylist", error);
      reply.code(500).send({ error: "Internal server error" });
    }
  };
}; 