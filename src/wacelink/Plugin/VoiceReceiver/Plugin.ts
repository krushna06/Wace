import { WacelinkPlugin as Plugin } from "../WacelinkPlugin.js";
import { Wacelink } from "../../Wacelink.js";
import { WacelinkEvents, WacelinkPluginType } from "../../Interface/Constants.js";
import { RawData, WebSocket } from "ws";
import { WacelinkNode } from "../../Node/WacelinkNode.js";
import { metadata } from "../../metadata.js";
import { VoiceChannelOptions } from "../../Interface/Player.js";

export class WacelinkPlugin extends Plugin {
  protected manager?: Wacelink;
  /** Whenever the plugin is enabled or not */
  public enabled: boolean = false;
  protected runningWs: Map<string, WebSocket> = new Map<string, WebSocket>();

  constructor() {
    super();
  }

  /** Name function for getting plugin name */
  public name(): string {
    return "wacelink-voiceReceiver";
  }

  /** Type function for diferent type of plugin */
  public type(): WacelinkPluginType {
    return WacelinkPluginType.Default;
  }

  /** Open the ws voice reciver client */
  public open(node: WacelinkNode, voiceOptions: VoiceChannelOptions): void {
    if (!this.enabled) throw new Error("This plugin is unloaded!");
    if (!node.options.driver?.includes("nodelink"))
      throw new Error("This node not support voice receiver, please use Nodelink2 to use this feature!");
    const wsUrl = `${node.options.secure ? "wss" : "ws"}://${node.options.host}:${node.options.port}`;
    const ws = new WebSocket(wsUrl + "/connection/data", {
      headers: {
        Authorization: node.options.auth,
        "User-Id": this.manager!.id,
        "Client-Name": `${metadata.name}/${metadata.version} (${metadata.github})`,
        "user-agent": this.manager!.wacelinkOptions.options!.userAgent!,
        "Guild-Id": voiceOptions.guildId,
      },
    });
    this.runningWs.set(voiceOptions.guildId, ws);
    ws.on("open", () => {
      this.debug("Connected to nodelink's voice receive server!");
      this.manager?.emit(WacelinkEvents.VoiceConnect, node);
    });
    ws.on("message", (data: RawData) => this.wsMessageEvent(node, data));
    ws.on("error", (err) => {
      this.debug("Errored at nodelink's voice receive server!");
      this.manager?.emit(WacelinkEvents.VoiceError, node, err);
    });
    ws.on("close", (code: number, reason: Buffer) => {
      this.debug(`Disconnected to nodelink's voice receive server! Code: ${code} Reason: ${reason}`);
      this.manager?.emit(WacelinkEvents.VoiceDisconnect, node, code, reason);
      ws.removeAllListeners();
    });
  }

  /** Open the ws voice reciver client */
  public close(guildId: string): void {
    const targetWs = this.runningWs.get(guildId);
    if (!targetWs) return;
    targetWs.close();
    this.runningWs.delete(guildId);
    this.debug("Destroy connection to nodelink's voice receive server!");
    targetWs.removeAllListeners();
    return;
  }

  protected wsMessageEvent(node: WacelinkNode, data: RawData) {
    const wsData = JSON.parse(data.toString());
    this.debug(String(data));
    switch (wsData.type) {
      case "startSpeakingEvent": {
        this.manager?.emit(WacelinkEvents.VoiceStartSpeaking, node, wsData.data.userId, wsData.data.guildId);
        break;
      }
      case "endSpeakingEvent": {
        this.manager?.emit(
          WacelinkEvents.VoiceEndSpeaking,
          node,
          wsData.data.data,
          wsData.data.userId,
          wsData.data.guildId
        );
        break;
      }
    }
    // this.node.wsMessageEvent(wsData);
  }

  /** Load function for make the plugin working */
  public load(manager: Wacelink): void {
    this.manager = manager;
    this.enabled = true;
  }

  /** unload function for make the plugin stop working */
  public unload(manager: Wacelink): void {
    this.manager = manager;
    this.enabled = false;
  }

  private debug(logs: string) {
    this.manager ? this.manager.emit(WacelinkEvents.Debug, `[Wacelink] / [Plugin] / [Voice Receiver] | ${logs}`) : true;
  }
}
