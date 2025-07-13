import { FastifyRequest, FastifyReply } from "fastify";
import { Manager } from "../../manager.js";

export const deleteQueue = (client: Manager) => {
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
      player.queue.clear();
      reply.send({
        success: true,
        data: {
          guildId,
          message: "Queue has been cleared successfully"
        }
      });
    } catch (error) {
      client.logger.error("deleteQueue", error);
      reply.code(500).send({
        success: false,
        error: "Internal server error"
      });
    }
  };
}; 