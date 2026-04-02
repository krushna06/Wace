import { Command, Accessableby } from "../../structures/Command.js";
import { Manager } from "../../manager.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { EmbedBuilder } from "discord.js";

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
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription("No song is currently playing"),
        ],
      });
    }

    const track = player.current;

    const embed = new EmbedBuilder()
      .setColor(client.color)
      .setTitle("Guess The Artist")
      .setDescription("A song snippet is playing...\nGuess the artist name!")
      .setFooter({ text: "You have 30 seconds to guess" });

    await handler.sendMessage({ embeds: [embed] });

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
          embeds: [
            new EmbedBuilder()
              .setColor("Green")
              .setTitle("Correct!")
              .setDescription(
                `The artist is **${track.author}**\n\n${user.username} got it right!`
              ),
          ],
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
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setTitle("Wrong!")
              .setDescription(`The artist is **${track.author}**`),
          ],
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
