import { Wacelink } from "../Wacelink.js";
import { metadata } from "../metadata.js";
import { WacelinkEvents } from "../Interface/Constants.js";
import { WacelinkRequesterOptions } from "../Interface/Rest.js";
import { WacelinkNode } from "../Node/WacelinkNode.js";
import { AbstractDriver } from "./AbstractDriver.js";
import util from "node:util";
import { WacelinkPlayer } from "../Player/WacelinkPlayer.js";
import { WacelinkWebsocket } from "../Utilities/WacelinkWebsocket.js";
import { WacelinkDatabase } from "../Utilities/WacelinkDatabase.js";

export class Lavalink4 extends AbstractDriver {
  public id: string = "lavalink/v4/koinu";
  public wsUrl: string = "";
  public httpUrl: string = "";
  public sessionId: string | null;
  public playerFunctions: WacelinkDatabase<(player: WacelinkPlayer, ...args: any) => unknown>;
  public functions: WacelinkDatabase<(manager: Wacelink, ...args: any) => unknown>;
  protected wsClient?: WacelinkWebsocket;
  public manager: Wacelink | null = null;
  public node: WacelinkNode | null = null;

  constructor() {
    super();
    this.playerFunctions = new WacelinkDatabase<
      (player: WacelinkPlayer, ...args: any) => unknown
    >();
    this.functions = new WacelinkDatabase<(manager: Wacelink, ...args: any) => unknown>();
    this.sessionId = null;
  }

  public get isRegistered(): boolean {
    return (
      this.manager !== null &&
      this.node !== null &&
      this.wsUrl.length !== 0 &&
      this.httpUrl.length !== 0
    );
  }

  public initial(manager: Wacelink, node: WacelinkNode): void {
    this.manager = manager;
    this.node = node;
    this.wsUrl = `${this.node.options.secure ? "wss" : "ws"}://${this.node.options.host}:${this.node.options.port}/v4/websocket`;
    this.httpUrl = `${this.node.options.secure ? "https://" : "http://"}${this.node.options.host}:${this.node.options.port}/v4`;
  }

  public connect(): WacelinkWebsocket {
    if (!this.isRegistered) throw new Error(`Driver ${this.id} not registered by using initial()`);
    const isResume = this.manager!.wacelinkOptions.options!.resume;
    const ws = new WacelinkWebsocket(this.wsUrl, {
      headers: {
        authorization: this.node!.options.auth,
        "user-id": this.manager!.id,
        "client-name": `${metadata.name}/${metadata.version} (${metadata.github})`,
        "session-id": this.sessionId !== null && isResume ? this.sessionId : "",
        "user-agent": this.manager!.wacelinkOptions.options!.userAgent!,
        "num-shards": this.manager!.shardCount,
      },
    });

    ws.on("open", () => {
      this.node!.wsOpenEvent();
    });
    ws.on("message", (data) => this.wsMessageEvent(data));
    ws.on("error", (err) => this.node!.wsErrorEvent(err));
    ws.on("close", (code: number, reason: Buffer) => {
      this.node!.wsCloseEvent(code, reason);
      ws.removeAllListeners();
    });
    this.wsClient = ws;
    return ws;
  }

  public async requester<D = any>(options: WacelinkRequesterOptions): Promise<D | undefined> {
    if (!this.isRegistered) throw new Error(`Driver ${this.id} not registered by using initial()`);
    if (options.path.includes("/sessions") && this.sessionId == null)
      throw new Error("sessionId not initalized! Please wait for lavalink get connected!");
    const url = new URL(`${this.httpUrl}${options.path}`);
    if (options.params) url.search = new URLSearchParams(options.params).toString();

    if (options.data) {
      options.body = JSON.stringify(options.data);
    }

    const lavalinkHeaders = {
      authorization: this.node!.options.auth,
      "user-agent": this.manager!.wacelinkOptions.options!.userAgent!,
      ...options.headers,
    };

    options.headers = lavalinkHeaders;

    const res = await fetch(url, options);

    if (res.status == 204) {
      this.debug("Player now destroyed");
      return undefined;
    }
    if (res.status !== 200) {
      this.debug(
        `${options.method ?? "GET"} ${url.pathname + url.search} payload=${options.body ? String(options.body) : "{}"}`
      );
      this.debug(
        "Something went wrong with lavalink server. " +
          `Status code: ${res.status}\n Headers: ${util.inspect(options.headers)}`
      );
      return undefined;
    }

    const finalData = await res.json();

    this.debug(
      `${options.method ?? "GET"} ${url.pathname + url.search} payload=${options.body ? String(options.body) : "{}"}`
    );

    return finalData as D;
  }

  protected wsMessageEvent(data: string) {
    if (!this.isRegistered) throw new Error(`Driver ${this.id} not registered by using initial()`);
    const wsData = JSON.parse(data.toString());
    this.node!.wsMessageEvent(wsData);
  }

  protected debug(logs: string) {
    if (!this.isRegistered) throw new Error(`Driver ${this.id} not registered by using initial()`);
    // @ts-ignore
    this.manager!.emit(
      WacelinkEvents.Debug,
      `[Wacelink] / [Node @ ${this.node?.options.name}] / [Driver] / [Lavalink4] | ${logs}`
    );
  }

  public wsClose(): void {
    if (this.wsClient) this.wsClient.close(1006, "Self closed");
  }

  public async updateSession(sessionId: string, mode: boolean, timeout: number): Promise<void> {
    const options: WacelinkRequesterOptions = {
      path: `/sessions/${sessionId}`,
      headers: { "content-type": "application/json" },
      method: "PATCH",
      data: {
        resuming: mode,
        timeout: timeout,
      },
    };

    await this.requester<{ resuming: boolean; timeout: number }>(options);
    this.debug(`Session updated! resume: ${mode}, timeout: ${timeout}`);
    return;
  }
}
