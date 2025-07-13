import { FastifyRequest, FastifyReply } from "fastify";
import { Manager } from "../../manager.js";

export const getCurrentFilter = (client: Manager) => {
  return async (request: FastifyRequest<{ Params: { guildId: string } }>, reply: FastifyReply) => {
    try {
      const { guildId } = request.params;

      const player = client.wacelink.players.get(guildId);
      if (!player) {
        return reply.code(404).send({
          success: false,
          error: "No active player found for this guild"
        });
      }

      const currentFilter = player.data.get("filter-mode");

      reply.send({
        success: true,
        data: {
          guildId,
          currentFilter: currentFilter || null,
          hasFilter: !!currentFilter
        }
      });
    } catch (error) {
      client.logger.error("getCurrentFilter", error);
      reply.code(500).send({
        success: false,
        error: "Internal server error"
      });
    }
  };
}; 