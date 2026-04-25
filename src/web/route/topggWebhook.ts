import { FastifyRequest, FastifyReply } from "fastify";
import { Manager } from "../../manager.js";
import { EmbedBuilder } from "discord.js";

interface TopggVoteBody {
  bot: string;
  user: string;
  type: "upvote" | "test";
  isWeekend?: boolean;
}

export const postTopggWebhook = (client: Manager) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const topggConfig = client.config.utilities.TOPGG;

    const auth = request.headers["authorization"];
    if (!topggConfig?.webhook_secret || auth !== topggConfig.webhook_secret) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const body = request.body as TopggVoteBody;
    if (!body?.user) return reply.code(400).send({ error: "Invalid payload" });

    const userId = body.user;
    const isWeekend = body.isWeekend ?? false;
    const isTest = body.type === "test";

    client.logger.info("TopggWebhook", `Vote received from user ${userId}${isTest ? " (test)" : ""}${isWeekend ? " [weekend x2]" : ""}`);

    const baseHours = topggConfig.vote_reward_hours ?? 12;
    const rewardHours = isWeekend ? baseHours * 2 : baseHours;
    const rewardMs = rewardHours * 60 * 60 * 1000;
    const expiresAt = Date.now() + rewardMs;

    if (!isTest) {
      const existing = await client.db.premium.get(userId);

      const voteRecord = await client.db.voteStats.get(userId);
      await client.db.voteStats.set(userId, {
        userId,
        totalVotes: (voteRecord?.totalVotes ?? 0) + 1,
        lastVotedAt: Date.now(),
      });
      const currentExpiry = existing?.isPremium && typeof existing.expiresAt === "number"
        ? Math.max(existing.expiresAt, Date.now())
        : Date.now();

      await client.db.premium.set(userId, {
        id: userId,
        isPremium: true,
        redeemedBy: {
          id: userId,
          username: "top.gg vote",
          displayName: "top.gg vote",
          avatarURL: null,
          createdAt: Date.now(),
          mention: `<@${userId}>`,
        },
        redeemedAt: Date.now(),
        expiresAt: currentExpiry + rewardMs,
        plan: `vote-${rewardHours}h`,
      });
    }

    try {
      const user = await client.users.fetch(userId).catch(() => null);
      if (user) {
        const embed = new EmbedBuilder()
          .setColor(client.color)
          .setTitle("Thanks for voting!")
          .setDescription(
            isTest
              ? "This is a test vote — no reward was granted."
              : `You've been granted **${rewardHours}h premium**${isWeekend ? " (weekend bonus!)" : ""} as a thank-you for voting for **${client.config.bot.BOT_NAME}** on top.gg.`
          )
          .setTimestamp();

        await user.send({ embeds: [embed] }).catch(() => null);
      }
    } catch {}

    if (!isTest && client.config.utilities.PREMIUM_LOG_CHANNEL) {
      try {
        const channel = await client.channels.fetch(client.config.utilities.PREMIUM_LOG_CHANNEL).catch(() => null);
        if (channel?.isTextBased()) {
          const embed = new EmbedBuilder()
            .setColor(client.color)
            .setTitle("Vote Reward Granted")
            .addFields(
              { name: "User", value: `<@${userId}> (${userId})`, inline: true },
              { name: "Reward", value: `${rewardHours}h premium`, inline: true },
              { name: "Weekend", value: isWeekend ? "Yes" : "No", inline: true },
            )
            .setTimestamp();
          await (channel as any).send({ embeds: [embed] });
        }
      } catch {}
    }

    reply.code(200).send({ ok: true });
  };
};
