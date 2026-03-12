import Fastify from "fastify";
import { Manager } from "../manager.js";
import { WebSocket } from "@fastify/websocket";

interface WebsocketConnection {
  send: (data: Record<string, unknown>) => void;
  auth?: string;
  guildId?: string;
}

export class WebsocketRoute {
  constructor(protected client: Manager) {}

  main(fastify: Fastify.FastifyInstance) {
    fastify.get("/websocket", { websocket: true }, (socket, req) => {
      const connection: WebsocketConnection = {
        send: (data) => socket.send(JSON.stringify(data)),
      };

      socket.on("close", (code, reason) => {
        if (connection.guildId) {
          this.client.wsl.delete(connection.guildId);
        }
      });

      socket.on("message", (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleWebsocketMessage(socket, connection, data);
        } catch (error) {
          socket.send(JSON.stringify({
            error: "Invalid JSON format",
            type: "error"
          }));
        }
      });
    });
  }

  private handleWebsocketMessage(socket: WebSocket, connection: WebsocketConnection, data: any) {
    if (data.type === "auth") {
      this.handleAuth(socket, connection, data);
      return;
    }

    if (!connection.auth) {
      socket.send(JSON.stringify({
        error: "Authentication required. Send auth message first.",
        type: "error"
      }));
      return;
    }

    if (connection.auth !== this.client.config.utilities.WEB_SERVER.auth) {
      socket.send(JSON.stringify({
        error: "Invalid authentication token",
        type: "error"
      }));
      return;
    }

    switch (data.type) {
      case "subscribe":
        this.handleSubscribe(socket, connection, data);
        break;
      case "unsubscribe":
        this.handleUnsubscribe(socket, connection, data);
        break;
      case "pause":
        this.handlePause(socket, connection, data);
        break;
      case "resume":
        this.handleResume(socket, connection, data);
        break;
      case "ping":
        socket.send(JSON.stringify({
          type: "pong",
          timestamp: Date.now()
        }));
        break;
      default:
        socket.send(JSON.stringify({
          error: "Unknown message type",
          type: "error"
        }));
    }
  }

  private handleAuth(socket: WebSocket, connection: WebsocketConnection, data: any) {
    if (!data.auth) {
      socket.send(JSON.stringify({
        error: "Missing auth token",
        type: "error"
      }));
      return;
    }

    if (data.auth !== this.client.config.utilities.WEB_SERVER.auth) {
      socket.send(JSON.stringify({
        error: "Invalid auth token",
        type: "error"
      }));
      return;
    }

    connection.auth = data.auth;
    socket.send(JSON.stringify({
      type: "auth_success",
      message: "Authentication successful"
    }));
  }

  private handleSubscribe(socket: WebSocket, connection: WebsocketConnection, data: any) {
    if (!data.guildId) {
      socket.send(JSON.stringify({
        error: "Missing guildId",
        type: "error"
      }));
      return;
    }

    if (this.client.wsl.get(data.guildId)) {
      socket.send(JSON.stringify({
        error: "Already have connection on this guild",
        type: "error"
      }));
      return;
    }

    connection.guildId = data.guildId;
    this.client.wsl.set(data.guildId, connection);

    socket.send(JSON.stringify({
      type: "subscribe_success",
      guildId: data.guildId,
      message: "Successfully subscribed to guild events"
    }));
  }

  private handleUnsubscribe(socket: WebSocket, connection: WebsocketConnection, data: any) {
    if (!connection.guildId) {
      socket.send(JSON.stringify({
        error: "Not subscribed to any guild",
        type: "error"
      }));
      return;
    }

    this.client.wsl.delete(connection.guildId);
    const guildId = connection.guildId;
    connection.guildId = undefined;

    socket.send(JSON.stringify({
      type: "unsubscribe_success",
      guildId: guildId,
      message: "Successfully unsubscribed from guild events"
    }));
  }

  private async handlePause(socket: WebSocket, connection: WebsocketConnection, data: any) {
    if (!connection.guildId) {
      socket.send(JSON.stringify({
        error: "Not subscribed to any guild",
        type: "error"
      }));
      return;
    }
    const player = this.client.players.get(connection.guildId);
    if (!player) {
      socket.send(JSON.stringify({
        error: "Player not found for this guild",
        type: "error"
      }));
      return;
    }
    try {
      await player.setPause(true);
      socket.send(JSON.stringify({
        type: "pause_success",
        guildId: connection.guildId
      }));
    } catch (err) {
      socket.send(JSON.stringify({
        error: "Failed to pause player",
        type: "error"
      }));
    }
  }

  private async handleResume(socket: WebSocket, connection: WebsocketConnection, data: any) {
    if (!connection.guildId) {
      socket.send(JSON.stringify({
        error: "Not subscribed to any guild",
        type: "error"
      }));
      return;
    }
    const player = this.client.players.get(connection.guildId);
    if (!player) {
      socket.send(JSON.stringify({
        error: "Player not found for this guild",
        type: "error"
      }));
      return;
    }
    try {
      await player.setPause(false);
      socket.send(JSON.stringify({
        type: "resume_success",
        guildId: connection.guildId
      }));
    } catch (err) {
      socket.send(JSON.stringify({
        error: "Failed to resume player",
        type: "error"
      }));
    }
  }
}