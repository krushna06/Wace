import chillout from "chillout";
import readdirRecursive from "recursive-readdir";
import { resolve } from "path";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { Manager } from "../../manager.js";
const __dirname = dirname(fileURLToPath(import.meta.url));

export class WebSocketEventLoader {
  client: Manager;
  counter: number = 0;
  constructor(client: Manager) {
    this.client = client;
    this.loader();
  }

  async loader() {
    let eventsPath = resolve(join(__dirname, "..", "..", "events", "websocket"));
    let eventsFile = await readdirRecursive(eventsPath);
    await this.registerPath(eventsFile);
    this.client.logger.info(WebSocketEventLoader.name, `${this.counter} WebSocket Events Loaded!`);
  }

  async registerPath(eventsPath: string[]) {
    await chillout.forEach(eventsPath, async (path) => {
      await this.registerEvents(path);
    });
  }

  async registerEvents(path: string) {
    const events = new (await import(pathToFileURL(path).toString())).default();

    var splitPath = function (str: string) {
      return str.split("\\").pop()!.split("/").pop()!.split(".")[0];
    };

    const eName = splitPath(path);

    if (!events.execute)
      return this.client.logger.warn(
        WebSocketEventLoader.name,
        `Event [${eName}] doesn't have execute function on the class, Skipping...`
      );

    this.client.on(eName as any, (...args: unknown[]) =>
      events.execute(this.client, ...args)
    );

    this.counter = this.counter + 1;
  }
}