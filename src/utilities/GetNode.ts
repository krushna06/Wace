import { Node } from "shoukaku";
import { Manager } from "../manager.js";

/**
 * Get an available Shoukaku node
 * @param client The manager instance
 * @returns A Shoukaku node or undefined if none available
 */
export function getNode(client: Manager): Node | undefined {
  const nodes = [...client.shoukaku.nodes.values()];
  return nodes.find((n) => n.state === 2) ?? (nodes.length > 0 ? nodes[0] : undefined);
}