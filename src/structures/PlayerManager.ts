import { Manager } from "../manager.js";
import { Player, PlayerOptions } from "./Player.js";

export class PlayerManager {
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(public client: Manager) {
    this.setupShoukakuListeners();
    this.startHealthCheck();
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      const nodes = [...this.client.shoukaku.nodes.values()];
      
      if (nodes.length === 0) {
        this.client.logger.warn("PlayerManager", "No nodes connected, attempting to re-add nodes...");
        // Re-add all configured nodes
        this.client.config.player.NODES.forEach((nodeConfig) => {
          const existingNode = this.client.shoukaku.nodes.get(nodeConfig.name);
          if (!existingNode) {
            this.client.shoukaku.addNode({
              name: nodeConfig.name,
              url: `${nodeConfig.host}:${nodeConfig.port}`,
              auth: nodeConfig.auth,
              secure: nodeConfig.secure || false,
            });
          }
        });
      }
    }, 30000);
  }

  private setupShoukakuListeners(): void {
    this.client.shoukaku.on("ready", (name) => {
      this.client.logger.info("Shoukaku", `Node ${name} is ready`);


      const node = this.client.shoukaku.nodes.get(name);
      if (node) {
        this.client.emit("nodeConnect", node);
      }
    });

    this.client.shoukaku.on("error", (name, error) => {
      this.client.logger.error("Shoukaku", `Node ${name} error: ${error.message}`);

      const node = this.client.shoukaku.nodes.get(name);
      if (node) {
        this.client.emit("nodeError", node, error);
      }
    });

    this.client.shoukaku.on("close", (name, code, reason) => {
      this.client.logger.warn("Shoukaku", `Node ${name} closed: ${code} ${reason}`);

      const node = this.client.shoukaku.nodes.get(name);
      if (node) {
        this.client.emit("nodeClosed", node);
      }
    });

    this.client.shoukaku.on("disconnect", (name, count) => {
      this.client.logger.warn("Shoukaku", `Node ${name} disconnected. Retry count: ${count}`);

      this.client.players.forEach((player) => {
        if (player.shoukaku?.node?.name === name) {
          player.shoukaku.removeAllListeners();
          player.shoukaku = null;
        }
      });

      const node = this.client.shoukaku.nodes.get(name);
      if (node) {
        this.client.emit("nodeDisconnect", node, 1006, Buffer.from(`Disconnected after ${count} retries`));
      }
    });

    this.client.shoukaku.on("debug", (name, info) => {
      if (this.client.config.bot.DEBUG_MODE) {
        this.client.logger.debug("Shoukaku", `Node ${name}: ${info}`);
      }
    });
  }

  async create(options: PlayerOptions): Promise<Player> {
    let player = this.client.players.get(options.guildId);

    if (player) {
      player.voiceId = options.voiceId;
      player.textId = options.textId;
      
      if (!player.shoukaku) {
        this.client.logger.info("PlayerManager", `Reconnecting player for guild ${options.guildId}`);
        await player.connect().catch((error) => {
          this.client.logger.error("PlayerManager", `Failed to reconnect player: ${error}`);
          throw error;
        });
      }
      
      return player;
    }

    player = new Player(this.client, options);
    this.client.players.set(options.guildId, player);

    try {
      await player.connect();
    } catch (error) {
      this.client.logger.error("PlayerManager", `Failed to create player for guild ${options.guildId}: ${error}`);
      this.client.players.delete(options.guildId);
      throw error;
    }

    this.client.emit("playerCreate", player);

    return player;
  }

  get(guildId: string): Player | undefined {
    return this.client.players.get(guildId);
  }

  async destroy(guildId: string): Promise<void> {
    const player = this.client.players.get(guildId);
    if (player) {
      await player.destroy();
    }
  }
}