import * as util from "node:util";
import { Guild, GuildMember, User } from "discord.js";
import { Manager } from "../../manager.js";
import type { FastifyRequest, FastifyReply } from "fastify";
import { WacelinkPlayer, WacelinkSearchResultType } from "../../wacelink/main.js";

export class PostPlay {
  guild: Guild | null = null;
  member: GuildMember | null = null;
  constructor(protected client: Manager) {}

  async main(req: FastifyRequest, res: FastifyReply) {
    this.client.logger.info(
      PostPlay.name,
      `${req.method} ${req.routeOptions.url} payload=${req.body ? util.inspect(req.body) : "{}"}`
    );
    const data = req.body as Record<string, string>;
    const validBody = await this.checker(data, req, res);
    if (!validBody) return;
    const playerData = {
      guildId: this.guild!.id,
      voiceId: this.member!.voice.channel!.id,
      textId: "",
      shardId: this.guild?.shardId ?? 0,
      deaf: true,
      volume: this.client.config.player.DEFAULT_VOLUME,
    };
    let player = this.client.wacelink.players.get(this.guild!.id) as WacelinkPlayer;
    if (!player) {
      player = await this.client.wacelink.create(playerData);
    } else {
      player.voiceId = this.member!.voice.channel!.id;
      player.textId = "";
    }
    player.textId = "";
    const result = await player.search(data["search"], { requester: this.member!.user });
    const tracks = result.tracks;
    if (!tracks.length) {
      res.code(404);
      res.send({ error: "No tracks found for the search query." });
      this.clean();
      return;
    }
    
    for (let track of tracks) {
      track.requester = this.member!.user;
    }
    
    if (result.type === "PLAYLIST") {
      player.data.set("playlist-uri", data["search"]);
      player.data.set("playlist-first-track", true);
      for (let track of tracks) player.queue.add(track);
    } else if (player.playing && result.type === "SEARCH") {
      player.queue.add(tracks[0]);
    } else if (player.playing && result.type !== "SEARCH") {
      for (let track of tracks) player.queue.add(track);
    } else {
      player.queue.add(tracks[0]);
    }
    
    if (!player.playing) await player.play();
    
    await this.client.UpdateQueueMsg(player);
    
    res.send({
      success: true,
      type: result.type,
      playlistName: result.playlistName ?? null,
      tracks: tracks.map((track) => {
        let requester = null;
        if (track.requester && typeof track.requester === "object") {
          const user = track.requester as User;
          requester = {
            id: user.id ?? null,
            username: user.username ?? null,
          };
        }
        return {
          title: track.title,
          uri: track.uri,
          length: track.duration,
          thumbnail: track.artworkUrl,
          author: track.author,
          requester,
        };
      }),
    });
    this.clean();
  }

  clean() {
    this.guild = null;
    this.member = null;
  }

  async checker(
    data: Record<string, string>,
    req: FastifyRequest,
    res: FastifyReply
  ): Promise<boolean> {
    const reqKey = ["guildId", "userId", "search"];
    if (!data) return this.errorRes(req, res, "Missing body");
    if (Object.keys(data).length !== reqKey.length) return this.errorRes(req, res, "Missing key");
    if (!data["guildId"]) return this.errorRes(req, res, "Missing guildId key");
    if (!data["userId"]) return this.errorRes(req, res, "Missing userId key");
    if (!data["search"]) return this.errorRes(req, res, "Missing search key");
    const clientWithGuilds = this.client as any;
    if (!clientWithGuilds.guilds || typeof clientWithGuilds.guilds.fetch !== "function") {
      return this.errorRes(req, res, "Guilds property is not available on client");
    }
    const Guild = await clientWithGuilds.guilds.fetch(data["guildId"]).catch(() => undefined);
    if (!Guild) return this.errorRes(req, res, "Guild not found");
    this.guild = Guild;
    const Member = await Guild.members.fetch(data["userId"]).catch(() => undefined);
    if (!Member) return this.errorRes(req, res, "User not found");
    if (!Member.voice.channel || !Member.voice)
      return this.errorRes(req, res, "Please join a voice channel.");
    this.member = Member;
    return true;
  }

  async errorRes(req: FastifyRequest, res: FastifyReply, message: string) {
    res.code(400);
    res.send({ error: message });
    this.clean();
    return false;
  }
} 