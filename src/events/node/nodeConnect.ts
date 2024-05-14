import { Manager } from "../../manager.js";
import { WacelinkNode } from "../../wacelink/main.js";

export default class {
  execute(client: Manager, node: WacelinkNode) {
    client.wacelink.nodes.forEach((data, index) => {
      client.lavalinkUsing.push({
        host: data.options.host,
        port: Number(data.options.port) | 0,
        pass: data.options.auth,
        secure: data.options.secure,
        name: index,
      });
    });

    client.logger.info(import.meta.url, `Lavalink [${node.options.name}] connected.`);
  }
}
