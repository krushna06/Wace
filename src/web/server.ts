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

export class WebServer {
  app: Fastify.FastifyInstance;

  constructor(private client: Manager) {
    this.app = Fastify({
      logger: false,
    });

    this.app.register(Cors, {
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    });

    this.app.get("/api/lastfm/callback", getLastfmCallbackRoute(this.client));

    this.app.register(
      (fastify, _, done) => {
        fastify.addHook("preValidation", function hook(req, reply, done) {
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

        fastify.register(WebsocketPlugin);
        fastify.register((fastify, _, done) => {
          new WebsocketRoute(client).main(fastify);
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

        done();
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
        "Don't be like nostep ._.",
        "Why you still here >:v",
        "I know catgirls do nothing wrong but why you still here...",
        "Bro, I don't have any catgirls collection (or cosplay collection) so please leave...",
      ];
      client.logger.info("HealthRouterService", `${request.method} ${request.routeOptions.url}`);
      reply.send({ wace: response[Math.floor(Math.random() * response.length)] });
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
