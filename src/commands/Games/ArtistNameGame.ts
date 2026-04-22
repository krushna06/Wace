import { Command, Accessableby } from "../../structures/Command.js";
import { Manager } from "../../manager.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class ArtistNameGame extends Command {
  constructor() {
    super();
    this.name = ["artistnamegame"];
    this.description = "Guess the artist from a song snippet";
    this.category = "Games";
    this.accessableby = [Accessableby.Member];
    this.lavalink = true;
    this.playerCheck = true;
    this.sameVoiceCheck = true;
    this.usingInteraction = true;
  }

  async execute(client: Manager, handler: CommandHandler): Promise<any> {
    const { guild, user, channel } = handler;
    if (!guild || !user || !channel) return;

    const player = client.players.get(guild.id);
    if (!player || !player.current) {
      return handler.sendMessage({
        flags: CV2_FLAG,
        components: [cv2.simple("No song is currently playing", client.color)],
      });
    }

    const track = player.current;

    await handler.sendMessage({
      flags: CV2_FLAG,
      components: [cv2.build({
        title: "Guess The Artist",
        description: "A song snippet is playing...\nGuess the artist name!",
        footer: "You have 30 seconds to guess",
        color: client.color,
      })],
    });

    if (channel.isDMBased()) return;

    const filter = (m: any) => m.author.id === user.id;
    const collector = channel.createMessageCollector({
      filter,
      time: 30000,
      max: 1,
    });

    collector.on("collect", async (m) => {
      const guess = m.content.toLowerCase();
      const correct = guess.includes(track.author?.toLowerCase() || "");

      if (correct) {
        await handler.sendMessage({
          flags: CV2_FLAG,
          components: [cv2.build({
            title: "Correct!",
            description: `The artist is **${track.author}**\n\n${user.username} got it right!`,
            color: "Green",
          })],
        });

        const key = `${user.id}-${guild.id}`;
        const stats = await client.db.gameStats.get(key);
        if (stats) {
          stats.artistNameGame.correct++;
          stats.artistNameGame.streak++;
          if (stats.artistNameGame.streak > stats.artistNameGame.bestStreak) {
            stats.artistNameGame.bestStreak = stats.artistNameGame.streak;
          }
          await client.db.gameStats.set(key, stats);
        }
      } else {
        await handler.sendMessage({
          flags: CV2_FLAG,
          components: [cv2.build({
            title: "Wrong!",
            description: `The artist is **${track.author}**`,
            color: "Red",
          })],
        });

        const key = `${user.id}-${guild.id}`;
        const stats = await client.db.gameStats.get(key);
        if (stats) {
          stats.artistNameGame.streak = 0;
          await client.db.gameStats.set(key, stats);
        }
      }

      const key = `${user.id}-${guild.id}`;
      const stats = await client.db.gameStats.get(key);
      if (stats) {
        stats.artistNameGame.played++;
        await client.db.gameStats.set(key, stats);
      }
    });
  }
}
