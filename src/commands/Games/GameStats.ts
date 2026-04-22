import { Command, Accessableby } from "../../structures/Command.js";
import { Manager } from "../../manager.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class GameStatsCommand extends Command {
  constructor() {
    super();
    this.name = ["gamestats"];
    this.description = "View your game statistics";
    this.category = "Games";
    this.accessableby = [Accessableby.Member];
    this.usingInteraction = true;
  }

  async execute(client: Manager, handler: CommandHandler): Promise<any> {
    const { guild, user } = handler;
    if (!guild || !user) return;

    const key = `${user.id}-${guild.id}`;
    const stats = await client.db.gameStats.get(key);

    if (!stats) {
      return handler.sendMessage({
        flags: CV2_FLAG,
        components: [cv2.simple("You haven't played any games yet!", client.color)],
      });
    }

    const gtsAccuracy =
      stats.guessTheSong.played > 0
        ? ((stats.guessTheSong.correct / stats.guessTheSong.played) * 100).toFixed(1)
        : "0";
    const angAccuracy =
      stats.artistNameGame.played > 0
        ? ((stats.artistNameGame.correct / stats.artistNameGame.played) * 100).toFixed(1)
        : "0";
    const triviaAccuracy =
      stats.musicTrivia.played > 0
        ? ((stats.musicTrivia.correct / stats.musicTrivia.played) * 100).toFixed(1)
        : "0";

    return handler.sendMessage({
      flags: CV2_FLAG,
      components: [cv2.build({
        title: `Game Statistics - ${user.username}`,
        color: client.color,
        fields: [
          {
            name: "Guess The Song",
            value: `Played: **${stats.guessTheSong.played}**\nCorrect: **${stats.guessTheSong.correct}**\nAccuracy: **${gtsAccuracy}%**\nBest Streak: **${stats.guessTheSong.bestStreak}**`,
            inline: true,
          },
          {
            name: "Artist Name Game",
            value: `Played: **${stats.artistNameGame.played}**\nCorrect: **${stats.artistNameGame.correct}**\nAccuracy: **${angAccuracy}%**\nBest Streak: **${stats.artistNameGame.bestStreak}**`,
            inline: true,
          },
          {
            name: "Music Trivia",
            value: `Played: **${stats.musicTrivia.played}**\nCorrect: **${stats.musicTrivia.correct}**\nAccuracy: **${triviaAccuracy}%**\nBest Streak: **${stats.musicTrivia.bestStreak}**`,
            inline: true,
          },
        ],
      })],
    });
  }
}
