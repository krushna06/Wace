import fetch from "node-fetch";
import { Manager } from "../../manager.js";
import { FastifyRequest, FastifyReply } from "fastify";
import crypto from "crypto";

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

    const apiKey = client.config.player.LASTFM.api_key;
    const sharedSecret = client.config.player.LASTFM.shared_secret;
    const params = {
      api_key: apiKey,
      method: "auth.getSession",
      token: String(token),
    };
    const api_sig = generateApiSig(params, sharedSecret);
    const url = `https://ws.audioscrobbler.com/2.0/?method=auth.getSession&api_key=${apiKey}&token=${token}&api_sig=${api_sig}&format=json`;

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