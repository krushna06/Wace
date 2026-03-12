import { FastifyRequest, FastifyReply } from "fastify";
import { Manager } from "../../manager.js";

export const deleteQueueTrack = (client: Manager) => {
  return async (
    request: FastifyRequest<{ Params: { guildId: string; position: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { guildId, position } = request.params;
      const player = client.players.get(guildId);
      if (!player) {
        return reply.code(404).send({
          success: false,
          error: "No active player found for this guild"
        });
      }
      const pos = Number(position);
      if (isNaN(pos) || pos < 1 || pos > player.queue.length) {
        return reply.code(400).send({
          success: false,
          error: "Invalid position. Must be between 1 and the queue length."
        });
      }
      const removed = player.queue[pos - 1];
      player.queue.splice(pos - 1, 1);
      reply.send({
        success: true,
        data: {
          guildId,
          position: pos,
          message: `Removed song at position ${pos} from the queue`,
          removed: removed ? {
            title: removed.title,
            uri: removed.uri,
            author: removed.author,
            length: removed.duration
          } : null
        }
      });
    } catch (error) {
      client.logger.error("deleteQueueTrack", error);
      reply.code(500).send({
        success: false,
        error: "Internal server error"
      });
    }
  };
};