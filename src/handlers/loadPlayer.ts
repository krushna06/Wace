import { Manager } from "../manager.js";
import { PlayerContentLoader } from "./Player/loadContent.js";
import { PlayerEventLoader } from "./Player/loadEvent.js";
import { WebSocketEventLoader } from "./Player/loadWebSocketEvent.js";
import { PlayerSetupLoader } from "./Player/loadSetup.js";
import { PlayerUpdateLoader } from "./Player/loadUpdate.js";

export class PlayerLoader {
  constructor(client: Manager) {
    new PlayerEventLoader(client);
    new WebSocketEventLoader(client);
    new PlayerContentLoader(client);
    new PlayerUpdateLoader(client);
    new PlayerSetupLoader(client);
  }
}
