import util from "node:util";
import { Manager } from "../../manager.js";
import Fastify from "fastify";
import { Player } from "../../structures/Player.js";
import { getNode } from "../../utilities/GetNode.js";

export type TrackRes = {
  title: string;
  uri: string;
  length: number;
  thumbnail: string;
  author: string;
  requester: null;
};

export class PatchControl {
  protected skiped: boolean = false;
  protected isPrevious: boolean = false;
  protected addedTrack: TrackRes[] = [];
  constructor(protected client: Manager) {}

  async main(req: Fastify.FastifyRequest, res: Fastify.FastifyReply) {
    this.client.logger.info(
      PatchControl.name,
      `${req.method} ${req.routeOptions.url} payload=${req.body ? util.inspect(req.body) : "{}"}`
    );
    const isValid = await this.checker(req, res);
    if (!isValid) return;
    const guildId = (req.params as Record<string, string>)["guildId"];
    const player = this.client.players.get(guildId) as Player;
    const jsonBody = req.body as Record<string, unknown>;
    const currentKeys = Object.keys(jsonBody);
    for (const key of currentKeys) {
      const data = await (this as any)[key](res, player, jsonBody[key]);
      if (!data) return;
    }
    res.send({
      loop: jsonBody.loop,
      skiped: this.skiped,
      previous: this.isPrevious,
      position: jsonBody.position,
      volume: jsonBody.volume,
      added: this.addedTrack,
      paused: jsonBody.paused,
      shuffled: jsonBody.shuffle,
      skippedTo: jsonBody.skipTo
    });
    this.resetData();
  }

  async loop(res: Fastify.FastifyReply, player: Player, mode: string) {
    if (!mode || !["track", "queue", "none"].includes(mode)) {
      res.code(400);
      res.send({ error: `Invalid loop mode, '${mode}' mode does not exist!` });
      return false;
    }
    player.setLoop(mode as "none" | "track" | "queue");
    return true;
  }

  async skipMode(res: Fastify.FastifyReply, player: Player, mode: string) {
    if (!mode || !["previous", "skip"].includes(mode)) {
      res.code(400);
      res.send({ error: `Invalid loop mode, '${mode}' mode does not exist!` });
      return false;
    }
    if (player.queue.length == 0) return true;
    if (mode == "skip") {
      player.data.set("skipTriggered", true);
      await player.skip();
      this.skiped = true;
      return true;
    }
    player.data.set("skipTriggered", true);
    await player.previous();
    this.isPrevious = true;
    return true;
  }

  async position(res: Fastify.FastifyReply, player: Player, pos: string) {
    if (isNaN(Number(pos))) {
      res.code(400);
      res.send({ error: `Position must be a number!` });
      return false;
    }
    await player.seek(Number(pos));
    return true;
  }

  async volume(res: Fastify.FastifyReply, player: Player, vol: string) {
    if (!vol) return true;
    if (isNaN(Number(vol))) {
      res.code(400);
      res.send({ error: `Volume must be a number!` });
      return false;
    }
    await player.setVolume(Number(vol));
    return true;
  }

  async paused(res: Fastify.FastifyReply, player: Player, paused: boolean) {
    if (typeof paused !== 'boolean') {
      res.code(400);
      res.send({ error: `Paused must be a boolean value!` });
      return false;
    }
    await player.setPause(paused);
    return true;
  }

  async add(res: Fastify.FastifyReply, player: Player, uriArray: string) {
    if (!uriArray) return true;
    for (const uri of uriArray) {
      if (!this.isValidHttpUrl(uri)) {
        res.code(400);
        res.send({ error: `add property must have a link!` });
        return false;
      }
      const result = await player.search(uri);
      if (result.tracks.length == 0) {
        res.code(400);
        res.send({ error: `Track not found!` });
        return false;
      }
      const song = result.tracks[0];
      player.queue.push(song);
      this.addedTrack.push({
        title: song.title || "",
        uri: song.uri || "",
        length: song.duration || 0,
        thumbnail: song.artworkUrl || "",
        author: song.author,
        requester: null,
      });
    }
    return true;
  }

  async checker(req: Fastify.FastifyRequest, res: Fastify.FastifyReply): Promise<boolean> {
    const accpetKey: string[] = ["loop", "skipMode", "position", "volume", "add", "paused", "shuffle", "skipTo"];
    const guildId = (req.params as Record<string, string>)["guildId"];
    const player = this.client.players.get(guildId);
    if (!player) {
      res.code(404);
      res.send({ error: "Current player not found!" });
      return false;
    }
    if (req.headers["content-type"] !== "application/json") {
      res.code(400);
      res.send({ error: "content-type must be application/json!" });
      return false;
    }
    if (!req.body) {
      res.code(400);
      res.send({ error: "Missing body" });
      return false;
    }
    const jsonBody = req.body as Record<string, unknown>;
    for (const key of Object.keys(jsonBody)) {
      if (!accpetKey.includes(key)) {
        res.code(400);
        res.send({ error: `Invalid body, key '${key}' does not exist!` });
        return false;
      }
    }
    return true;
  }

  resetData() {
    this.skiped = false;
    this.addedTrack = [];
    this.isPrevious = false;
  }

  isValidHttpUrl(string: string) {
    let url;

    try {
      url = new URL(string);
    } catch (_) {
      return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
  }

  async shuffle(res: Fastify.FastifyReply, player: Player, shuffle: boolean) {
    if (typeof shuffle !== 'boolean') {
      res.code(400);
      res.send({ error: `Shuffle must be a boolean value!` });
      return false;
    }
    if (shuffle) {
      player.shuffle();
    }
    return true;
  }

  async skipTo(res: Fastify.FastifyReply, player: Player, pos: string | number) {
    const position = Number(pos);
    if (isNaN(position)) {
      res.code(400);
      res.send({ error: `skipTo position must be a number!` });
      return false;
    }
    if (position < 0 || position >= player.queue.length) {
      res.code(400);
      res.send({ error: `Invalid position. Must be between 0 and ${player.queue.length - 1}` });
      return false;
    }
    const targetTrack = player.queue[position];
    player.queue.splice(0, position);
    player.data.set("skipTriggered", true);
    await player.skip();
    this.skiped = true;
    return true;
  }
}