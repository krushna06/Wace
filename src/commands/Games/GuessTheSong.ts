import { Command, Accessableby } from "../../structures/Command.js";
import { Manager } from "../../manager.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default class GuessTheSong extends Command {
  constructor() {
    super();
    this.name = ["guessthesong"];
    this.description = "Play a snippet of a song and guess the title";
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
      .setTitle("Guess The Song")
      .setDescription("A song snippet is playing...\nGuess the song title!")
      .setFooter({ text: "You have 30 seconds to guess" });

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("gts_skip")
        .setLabel("Skip")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("gts_hint")
        .setLabel("Hint")
        .setStyle(ButtonStyle.Primary)
    );

    const msg = await handler.sendMessage({
      embeds: [embed],
      components: [buttons],
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
      const correct =
        guess.includes(track.title?.toLowerCase() || "") ||
        guess.includes(track.author?.toLowerCase() || "");

      if (correct) {
        await handler.sendMessage({
          embeds: [
            new EmbedBuilder()
              .setColor("Green")
              .setTitle("Correct!")
              .setDescription(
                `**${track.title}** by **${track.author}**\n\n${user.username} got it right!`
              ),
          ],
        });

        const key = `${user.id}-${guild.id}`;
        const stats = await client.db.gameStats.get(key);
        if (stats) {
          stats.guessTheSong.correct++;
          stats.guessTheSong.streak++;
          if (stats.guessTheSong.streak > stats.guessTheSong.bestStreak) {
            stats.guessTheSong.bestStreak = stats.guessTheSong.streak;
          }
          await client.db.gameStats.set(key, stats);
        }
      } else {
        await handler.sendMessage({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setTitle("Wrong!")
              .setDescription(
                `The song was **${track.title}** by **${track.author}**`
              ),
          ],
        });

        const key = `${user.id}-${guild.id}`;
        const stats = await client.db.gameStats.get(key);
        if (stats) {
          stats.guessTheSong.streak = 0;
          await client.db.gameStats.set(key, stats);
        }
      }

      const key = `${user.id}-${guild.id}`;
      const stats = await client.db.gameStats.get(key);
      if (stats) {
        stats.guessTheSong.played++;
        await client.db.gameStats.set(key, stats);
      }
    });
  }
}
