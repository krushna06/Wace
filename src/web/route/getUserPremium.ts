import util from "node:util";
import { Manager } from "../../manager.js";
import Fastify from "fastify";

export async function getUserPremium(
  client: Manager,
  req: Fastify.FastifyRequest,
  res: Fastify.FastifyReply
) {
  client.logger.info(
    "UserPremiumRouterService",
    `${req.method} ${req.routeOptions.url} params=${req.params ? util.inspect(req.params) : "{}"}`
  );
  
  const userId = (req.params as Record<string, string>)["userId"];
  
  if (!userId) {
    res.code(400);
    res.send({ error: "Missing userId parameter" });
    return;
  }

  try {
    const premiumData = await client.db.premium.get(userId);
    
    if (!premiumData) {
      res.send({ premium: false });
      return;
    }

    const isExpired = premiumData.expiresAt !== "lifetime" && 
                     premiumData.expiresAt < Date.now();

    res.send({ 
      premium: premiumData.isPremium && !isExpired 
    });
  } catch (error) {
    client.logger.error("UserPremiumRouterService", `Error checking premium status: ${error}`);
    res.code(500);
    res.send({ error: "Internal server error" });
  }
} 