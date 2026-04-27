import { Command, Accessableby } from "../../structures/Command.js";
import { Manager } from "../../manager.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { TextChannel } from "discord.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

const SNIPPET_DURATION = 8000;

function cleanArtist(author: string): string {
  return author
    .toLowerCase()
    .replace(/,.*$/, "")
    .replace(/&.*$/, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

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
    const duration = track.duration || track.info?.length || 0;

    const originalPosition = player.position;
    const wasPlaying = !player.paused;

    const start = Math.floor(duration * 0.2);
    const end = Math.floor(duration * 0.8);
    const snippetStart = start + Math.floor(Math.random() * Math.max(end - start, 1));

    await player.seek(snippetStart);
    if (player.paused) await player.resume();

    await handler.sendMessage({
      flags: CV2_FLAG,
      components: [cv2.build({
        title: "Guess The Artist",
        description: `🎵 Listen carefully...\nType the artist name in chat!`,
        footer: `You have 30 seconds • Snippet: ${SNIPPET_DURATION / 1000}s`,
        color: client.color,
      })],
    });

    const snippetTimer = setTimeout(async () => {
      if (player && !player.paused) await player.pause().catch(() => {});
    }, SNIPPET_DURATION);

    if (channel.isDMBased()) return;

    const textChannel = channel as TextChannel;

    const cleanup = async () => {
      clearTimeout(snippetTimer);
      if (player && player.current) {
        await player.seek(originalPosition).catch(() => {});
        if (wasPlaying && player.paused) await player.resume().catch(() => {});
        else if (!wasPlaying && !player.paused) await player.pause().catch(() => {});
      }
    };

    const collector = textChannel.createMessageCollector({
      filter: (m) => m.author.id === user.id,
      time: 30000,
      max: 1,
    });

    collector.on("collect", async (m) => {
      await cleanup();

      const guess = m.content.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
      const cleanedAuthor = cleanArtist(track.author || "");
      const correct = cleanedAuthor.includes(guess) || guess.includes(cleanedAuthor);

      await textChannel.send({
        flags: CV2_FLAG,
        components: [cv2.build({
          title: correct ? "✅ Correct!" : "❌ Wrong!",
          description: correct
            ? `The artist is **${track.author}**\n\n${user.username} got it right!`
            : `The artist is **${track.author}**`,
          color: client.color,
        })],
      });

      const key = `${user.id}-${guild.id}`;
      const stats = await client.db.gameStats.get(key);
      if (stats) {
        if (correct) {
          stats.artistNameGame.correct++;
          stats.artistNameGame.streak++;
          if (stats.artistNameGame.streak > stats.artistNameGame.bestStreak)
            stats.artistNameGame.bestStreak = stats.artistNameGame.streak;
        } else {
          stats.artistNameGame.streak = 0;
        }
        stats.artistNameGame.played++;
        await client.db.gameStats.set(key, stats);
      }
    });

    collector.on("end", async (collected) => {
      if (collected.size === 0) {
        await cleanup();
        await textChannel.send({
          flags: CV2_FLAG,
          components: [cv2.build({
            title: "⏰ Time's up!",
            description: `The artist was **${track.author}**`,
            color: client.color,
          })],
        });
        const key = `${user.id}-${guild.id}`;
        const stats = await client.db.gameStats.get(key);
        if (stats) { stats.artistNameGame.streak = 0; stats.artistNameGame.played++; await client.db.gameStats.set(key, stats); }
      }
    });
  }
}
