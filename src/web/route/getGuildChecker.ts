import { FastifyRequest, FastifyReply } from "fastify";
import { Manager } from "../../manager.js";

export const getGuildChecker = (client: Manager) => {
  return async (
    request: FastifyRequest<{ Params: { guildId: string; userId: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { guildId, userId } = request.params;
      const Guild = await client.guilds.fetch(guildId).catch(() => undefined);
      if (!Guild) {
        return reply.code(404).send({
          inGuild: false,
          inSameVoice: null,
          error: "Guild not found"
        });
      }
      const Member = await Guild.members.fetch(userId).catch(() => undefined);
      if (!Member) {
        return reply.send({
          inGuild: false,
          inSameVoice: null,
          error: "User not found in guild"
        });
      }
      // Check voice channel
      const userVoiceChannelId = Member.voice?.channelId || null;
      const botMember = Guild.members.me;
      const botVoiceChannelId = botMember?.voice?.channelId || null;
      let inSameVoice: boolean | null = null;
      if (userVoiceChannelId && botVoiceChannelId) {
        inSameVoice = userVoiceChannelId === botVoiceChannelId;
      }
      reply.send({
        inGuild: true,
        inSameVoice,
        userVoiceChannelId,
        botVoiceChannelId
      });
    } catch (error) {
      client.logger.error("getGuildChecker", error);
      reply.code(500).send({
        inGuild: false,
        inSameVoice: null,
        error: "Internal server error"
      });
    }
  };
}; 