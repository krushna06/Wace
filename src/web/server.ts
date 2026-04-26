import { Manager } from "../manager.js";
import Fastify from "fastify";
import Cors from "@fastify/cors";
import WebsocketPlugin from "@fastify/websocket";
import { WebsocketRoute } from "./websocket.js";
import { PlayerRoute } from "./player.js";
import { getSearch } from "./route/getSearch.js";
import { getCommands } from "./route/getCommands.js";
import { getUserPlaylists } from "./route/getUserPlaylists.js";
import { getPlaylistDetails } from "./route/getPlaylistDetails.js";
import { getLastfmCallbackRoute } from "./route/lastfmCallback.js";
import { getDjStatus } from "./route/getDjStatus.js";
import { getUserPremium } from "./route/getUserPremium.js";
import { getGuildPremium } from "./route/getGuildPremium.js";
import { getFilters } from "./route/getFilters.js";
import { getCurrentFilter } from "./route/getCurrentFilter.js";
import { postApplyFilter } from "./route/postApplyFilter.js";
import { deleteClearFilter } from "./route/deleteClearFilter.js";
import { getGuildLanguage, patchGuildLanguage } from "./route/patchGuildLanguage.js";
import { deleteQueue } from "./route/deleteQueue.js";
import { deleteQueueTrack } from "./route/deleteQueueTrack.js";
import { getGuildChecker } from "./route/getGuildChecker.js";
import { createPlaylist, deletePlaylist, editPlaylist } from "./route/playlist.js";
import { getUserStats, getGuildStats, getTopSongs, getTopUsers, getLastPlayed, getTopSongsUser, getLastPlayedUser } from "./route/getStats.js";
import { getLyricsRoute } from "./route/getLyrics.js";
import { getUserHistory } from "./route/getUserHistory.js";
import { getAdminMe } from "./route/admin/adminAuth.js";
import { getBlacklist, postBlacklist, deleteBlacklist } from "./route/admin/blacklist.js";
import { getPremiumKeys, postGeneratePremiumKeys, deletePremiumKey } from "./route/admin/premiumKeys.js";
import { getPremiumUsers, deletePremiumUser, patchPremiumUser } from "./route/admin/premiumUsers.js";
import { getBotStats } from "./route/getBotStats.js";
import { getGuilds } from "./route/getGuilds.js";
import { getAdminCommands, patchAdminCommand, deleteAdminCommandOverride } from "./route/admin/commandOverrides.js";
import { postTopggWebhook } from "./route/topggWebhook.js";

export class WebServer {
  app: Fastify.FastifyInstance;

  constructor(private client: Manager) {
    this.app = Fastify({
      logger: false,
    });

    this.app.register(Cors, {
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-owner", "x-user-id"],
      credentials: true,
    });

    this.app.get("/api/lastfm/callback", getLastfmCallbackRoute(this.client));
    this.app.post("/api/topgg/webhook", postTopggWebhook(this.client));

    this.app.register(
      async (fastify) => {
        await fastify.register(WebsocketPlugin);
        fastify.register((fastify, _, done) => {
          new WebsocketRoute(client).main(fastify);
          done();
        });

        fastify.addHook("preValidation", function hook(req, reply, done) {
          if (req.routeOptions.url !== "/v1/websocket") {
            client.logger.info("WebServer", `Route URL: ${req.routeOptions.url}`);
          }

          if (req.routeOptions.url === "/v1/websocket") {
            return done();
          }

          if (!req.headers["authorization"]) {
            reply.code(400);
            reply.send(JSON.stringify({ error: "Missing Authorization" }));
            return done();
          }
          if (req.headers["authorization"] !== client.config.utilities.WEB_SERVER.auth) {
            reply.code(401);
            reply.send(JSON.stringify({ error: "Authorization failed" }));
            return done();
          }
          if (
            client.config.utilities.WEB_SERVER.whitelist.length !== 0 &&
            !client.config.utilities.WEB_SERVER.whitelist.includes(req.hostname)
          ) {
            reply.code(401);
            reply.send(JSON.stringify({ error: "You're not in whitelist" }));
            return done();
          }
          done();
        });

        fastify.register(
          (fastify, _, done) => {
            new PlayerRoute(client).main(fastify);
            done();
          },
          { prefix: "players" }
        );

        fastify.get("/search", (req, res) => getSearch(client, req, res));
        fastify.get("/commands", (req, res) => getCommands(client, req, res));
        fastify.get("/playlists/:userId", (req, res) => getUserPlaylists(client, req, res));
        fastify.get("/playlist/:playlistId", (req, res) => getPlaylistDetails(client, req, res));
        fastify.get("/dj/:guildId/userid", (req, res) => getDjStatus(client, req, res));
        fastify.get("/premium/user/:userId", (req, res) => getUserPremium(client, req, res));
        fastify.get("/premium/guild/:guildId", (req, res) => getGuildPremium(client, req, res));
        fastify.get("/guild-checker/:guildId/:userId", getGuildChecker(client));

        fastify.get("/filters", (req, res) => getFilters(client)(req, res));
        fastify.get("/filters/:guildId", (req, res) => getCurrentFilter(client)(req as any, res));
        fastify.post("/filters/:guildId", (req, res) => postApplyFilter(client)(req as any, res));
        fastify.delete("/filters/:guildId", (req, res) => deleteClearFilter(client)(req as any, res));
        fastify.get("/language/:guildId", (req, res) => getGuildLanguage(client, req, res));
        fastify.patch("/language/:guildId", (req, res) => patchGuildLanguage(client, req, res));
        fastify.delete("/queue/:guildId", deleteQueue(client));
        fastify.delete("/queue/:guildId/:position", deleteQueueTrack(client));
        fastify.post("/playlist", createPlaylist(client));
        fastify.delete("/playlist/:playlistId", deletePlaylist(client));
        fastify.patch("/playlist/:playlistId", editPlaylist(client));
        fastify.get("/stats/user/:userId", getUserStats(client));
        fastify.get("/stats/guild/:guildId", getGuildStats(client));
        fastify.get("/stats/top-songs/:guildId", getTopSongs(client));
        fastify.get("/stats/top-users/:guildId", getTopUsers(client));
        fastify.get("/stats/last-played/:guildId", getLastPlayed(client));
        fastify.get("/stats/top-songs-user/:userId", getTopSongsUser(client));
        fastify.get("/stats/last-played-user/:userId", getLastPlayedUser(client));
        fastify.get("/lyrics/:guildId", getLyricsRoute(client));
        fastify.get("/user-history/:userId", getUserHistory(client));

        fastify.get("/admin/me", getAdminMe(client));
        fastify.get("/admin/blacklist", getBlacklist(client));
        fastify.post("/admin/blacklist", postBlacklist(client));
        fastify.delete("/admin/blacklist/:id", deleteBlacklist(client));
        fastify.get("/admin/premium/keys", getPremiumKeys(client));
        fastify.post("/admin/premium/keys", postGeneratePremiumKeys(client));
        fastify.delete("/admin/premium/keys/:code", deletePremiumKey(client));
        fastify.get("/admin/premium/users", getPremiumUsers(client));
        fastify.delete("/admin/premium/users/:userId", deletePremiumUser(client));
        fastify.patch("/admin/premium/users/:userId", patchPremiumUser(client));
        fastify.get("/admin/commands", getAdminCommands(client));
        fastify.patch("/admin/commands/:commandKey", patchAdminCommand(client));
        fastify.delete("/admin/commands/:commandKey/override", deleteAdminCommandOverride(client));
        fastify.get("/stats/bot", getBotStats(client));
        fastify.get("/guilds", getGuilds(client));
      },
      { prefix: "v1" }
    );

    this.app.get("/catgirls", (request, reply) => {
      const response = [
        "Bro 💀",
        "Please stop...",
        "This ain't rule 34...",
        "💀",
        "Can you do something better please -_-",
        `Don't be like ${this.client.config.utilities.WEB_SERVER.EASTER_EGG_REFERENCE} ._.,`,
        "Why you still here >:v",
        "I know catgirls do nothing wrong but why you still here...",
        "Bro, I don't have any catgirls collection (or cosplay collection) so please leave...",
      ];
      client.logger.info("HealthRouterService", `${request.method} ${request.routeOptions.url}`);
      reply.send({ [this.client.config.bot.BOT_NAME.toLowerCase()]: response[Math.floor(Math.random() * response.length)] });
    });

    const port = this.client.config.utilities.WEB_SERVER.port;

    this.app
      .listen({ port, host: this.client.config.utilities.WEB_SERVER.host })
      .then(() => this.client.logger.info(WebServer.name, `Server running at port ${port}`))
      .catch((err) => {
        if (this.client.config.bot.TOKEN.length > 1) {
          this.client.config.utilities.WEB_SERVER.port =
            this.client.config.utilities.WEB_SERVER.port + 1;
          const port = this.client.config.utilities.WEB_SERVER.port;
          return this.app
            .listen({ port: port + 1 })
            .then(() => this.client.logger.info(WebServer.name, `Server running at port ${port}`));
        } else this.client.logger.error(WebServer.name, err);
      });
  }
}