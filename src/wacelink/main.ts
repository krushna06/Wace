import { metadata } from "./metadata.js";
import Library from "./Library/index.js";
import Plugin from "./Plugin/index.js";

// Export main class
export * from "./Wacelink.js";
// Export player class
export * from "./Player/WacelinkPlayer.js";
export * from "./Player/WacelinkQueue.js";
export * from "./Player/WacelinkTrack.js";
// Export node class
export * from "./Node/WacelinkNode.js";
export * from "./Node/WacelinkRest.js";
export * from "./Node/WacelinkPlayerEvents.js";
// Export manager class
export * from "./Manager/WacelinkNodeManager.js";
export * from "./Manager/WacelinkPlayerManager.js";
//// Export library class
export * from "./Library/AbstractLibrary.js";
export { Library };
//Export interface
export * from "./Interface/Connection.js";
export * from "./Interface/Constants.js";
export * from "./Interface/Manager.js";
export * from "./Interface/Node.js";
export * from "./Interface/Player.js";
export * from "./Interface/Rest.js";
export * from "./Interface/Track.js";
// Export plugin
export * from "./Plugin/WacelinkPlugin.js";
export * from "./Plugin/SourceWacelinkPlugin.js";
export { Plugin };
// Export driver
export * from "./Drivers/AbstractDriver.js";
export * from "./Drivers/Lavalink3.js";
export * from "./Drivers/Lavalink4.js";
export * from "./Drivers/Nodelink2.js";
// Export utilities
export * from "./Utilities/WacelinkDatabase.js";
export * from "./Utilities/WacelinkWebsocket.js";
// Export metadata
export * from "./metadata.js";
export const version = metadata.version;
