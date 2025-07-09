import fetch from "node-fetch";
import { Manager } from "../../manager.js";
import { FastifyRequest, FastifyReply } from "fastify";
import crypto from "crypto";

const LASTFM_API_KEY = "1454b30ef822141a82768f46b225a4c3";
const LASTFM_SHARED_SECRET = "a05e15c77f07dadc585e8cae48ea3df2";

function generateApiSig(params: Record<string, string>, sharedSecret: string): string {
  const keys = Object.keys(params).sort();
  let sig = "";
  for (const key of keys) {
    sig += key + params[key];
  }
  sig += sharedSecret;
  return crypto.createHash("md5").update(sig).digest("hex");
}

export function getLastfmCallbackRoute(client: Manager) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { token, discord_id } = request.query as { token?: string; discord_id?: string };
    if (!token || !discord_id) {
      reply.status(400).send("Missing token or discord_id.");
      return;
    }

    const params = {
      api_key: LASTFM_API_KEY,
      method: "auth.getSession",
      token: String(token),
    };
    const api_sig = generateApiSig(params, LASTFM_SHARED_SECRET);
    const url = `https://ws.audioscrobbler.com/2.0/?method=auth.getSession&api_key=${LASTFM_API_KEY}&token=${token}&api_sig=${api_sig}&format=json`;

    try {
      const response = await fetch(url);
      let data: any;
      try {
        data = await response.json();
      } catch (jsonErr) {
        reply.status(500).send("Failed to parse Last.fm response.");
        return;
      }
      if (data && data.error) {
        reply.status(400).send(`Last.fm error: ${data.message}`);
        return;
      }
      if (data && data.session && data.session.key && data.session.name) {
        const sessionKey = data.session.key;
        const username = data.session.name;
        await client.db.lastfmSession.set(String(discord_id), {
          discord_id: String(discord_id),
          session_key: sessionKey,
          username,
        });
        reply.send("Successfully connected your Last.fm account! You can now use /track.");
        return;
      } else {
        reply.status(400).send("Invalid response from Last.fm.");
        return;
      }
    } catch (err) {
      reply.status(500).send("Failed to connect to Last.fm: " + String(err));
      return;
    }
  };
} 