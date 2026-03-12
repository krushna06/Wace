import { FastifyRequest, FastifyReply } from "fastify";
import { Manager } from "../../manager.js";

export const deleteClearFilter = (client: Manager) => {
  return async (request: FastifyRequest<{ Params: { guildId: string } }>, reply: FastifyReply) => {
    try {
      const { guildId } = request.params;

      const player = client.players.get(guildId);
      if (!player) {
        return reply.code(404).send({
          success: false,
          error: "No active player found for this guild"
        });
      }

      if (!player.data.get("filter-mode")) {
        return reply.code(400).send({
          success: false,
          error: "No filter is currently applied"
        });
      }

      player.data.delete("filter-mode");
      await player.filters.clear();
      await player.setVolume(100);

      reply.send({
        success: true,
        data: {
          guildId,
          message: "All filters have been cleared successfully"
        }
      });
    } catch (error) {
      client.logger.error("deleteClearFilter", error);
      reply.code(500).send({
        success: false,
        error: "Internal server error"
      });
    }
  };
};