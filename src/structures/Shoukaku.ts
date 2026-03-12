import { Manager } from "../manager.js";
import { Shoukaku, Connectors, NodeOption } from "shoukaku";

export class ShoukakuInit {
  client: Manager;
  constructor(client: Manager) {
    this.client = client;
  }

  get init(): Shoukaku {
    const nodes: NodeOption[] = this.client.config.player.NODES.map((node) => ({
      name: node.name,
      url: `${node.host}:${node.port}`,
      auth: node.auth,
      secure: node.secure || false,
    }));

    this.client.logger.info("ShoukakuInit", `Initializing Shoukaku with ${nodes.length} node(s)`);
    nodes.forEach(node => {
      this.client.logger.info("ShoukakuInit", `Node: ${node.name} at ${node.url} (secure: ${node.secure})`);
    });

    return new Shoukaku(new Connectors.DiscordJS(this.client), nodes, {
      resume: true,
      resumeTimeout: 600,
      resumeByLibrary: true,
      reconnectTries: this.client.config.utilities.AUTOFIX_LAVALINK.enable
        ? this.client.config.utilities.AUTOFIX_LAVALINK.retryCount
        : Infinity,
      reconnectInterval: this.client.config.utilities.AUTOFIX_LAVALINK.enable
        ? this.client.config.utilities.AUTOFIX_LAVALINK.retryTimeout
        : 3000,
      restTimeout: 60000,
      moveOnDisconnect: false,
      userAgent: `Wace/${this.client.metadata.version}`,
      structures: {
        rest: undefined,
        player: undefined,
      },
    });
  }
}
