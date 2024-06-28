import { WacelinkConnectState, WacelinkEvents } from "../Interface/Constants.js";
import { WacelinkNodeOptions } from "../Interface/Manager.js";
import { WacelinkNode } from "../Node/WacelinkNode.js";
import { Wacelink } from "../Wacelink.js";
import { WacelinkDatabase } from "../Utilities/WacelinkDatabase.js";

export class WacelinkNodeManager extends WacelinkDatabase<WacelinkNode> {
  /** The wacelink manager */
  public manager: Wacelink;

  /**
   * The main class for handling lavalink servers
   * @param manager
   */
  constructor(manager: Wacelink) {
    super();
    this.manager = manager;
  }

  /**
   * Add a new Node.
   * @returns WacelinkNode
   */
  public add(node: WacelinkNodeOptions) {
    const newNode = new WacelinkNode(this.manager, node);
    newNode.connect();
    this.set(node.name, newNode);
    this.debug(`Node ${node.name} added to manager!`);
    return newNode;
  }

  /**
   * Get a least used node.
   * @returns WacelinkNode
   */
  public async getLeastUsed(): Promise<WacelinkNode> {
    if (this.manager.wacelinkOptions.options!.nodeResolver) {
      const resolverData = await this.manager.wacelinkOptions.options!.nodeResolver(this);
      if (resolverData) return resolverData;
    }
    const nodes: WacelinkNode[] = this.values;

    const onlineNodes = nodes.filter((node) => node.state === WacelinkConnectState.Connected);
    if (!onlineNodes.length) throw new Error("No nodes are online");

    const temp = await Promise.all(
      onlineNodes.map(async (node) => {
        const stats = await node.rest.getStatus();
        return !stats ? { players: 0, node: node } : { players: stats.players, node: node };
      })
    );
    temp.sort((a, b) => a.players - b.players);

    return temp[0].node;
  }

  /**
   * Get all current nodes
   * @returns WacelinkNode[]
   */
  public all(): WacelinkNode[] {
    return this.values;
  }

  /**
   * Remove a node.
   * @returns void
   */
  public remove(name: string): void {
    const node = this.get(name);
    if (node) {
      node.disconnect();
      this.delete(name);
      this.debug(`Node ${name} removed from manager!`);
    }
    return;
  }

  protected debug(logs: string) {
    // @ts-ignore
    this.manager.emit(WacelinkEvents.Debug, `[Wacelink] / [NodeManager] | ${logs}`);
  }
}
