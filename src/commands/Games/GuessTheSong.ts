import { Command, Accessableby } from "../../structures/Command.js";
import { Manager } from "../../manager.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, TextChannel } from "discord.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

const SNIPPET_DURATION = 8000;

function cleanTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/ft\..*$/i, "")
    .replace(/feat\..*$/i, "")
    .replace(/-.*$/, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isCorrectGuess(guess: string, title: string, author: string): boolean {
  const cleanedGuess = guess.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const cleanedTitle = cleanTitle(title);
  const cleanedAuthor = author.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();

  return (
    cleanedTitle.includes(cleanedGuess) ||
    cleanedGuess.includes(cleanedTitle) ||
    cleanedAuthor.includes(cleanedGuess) ||
    cleanedGuess.includes(cleanedAuthor)
  );
}

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

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("gts_skip").setLabel("Skip").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("gts_hint").setLabel("Hint").setStyle(ButtonStyle.Primary)
    );

    await handler.sendMessage({
      flags: CV2_FLAG,
      components: [
        cv2.build({
          title: "Guess The Song",
          description: `🎵 Listen carefully...\nType your guess in chat!`,
          footer: `You have 30 seconds • Snippet: ${SNIPPET_DURATION / 1000}s`,
          color: client.color,
          components: [buttons],
        }),
      ],
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

    const buttonCollector = textChannel.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) => ["gts_skip", "gts_hint"].includes(i.customId) && i.user.id === user.id,
      time: 30000,
    });

    const msgCollector = textChannel.createMessageCollector({
      filter: (m) => m.author.id === user.id,
      time: 30000,
      max: 1,
    });

    buttonCollector.on("collect", async (i) => {
      if (i.customId === "gts_skip") {
        buttonCollector.stop();
        msgCollector.stop("skipped");
        await cleanup();
        await i.update({
          flags: CV2_FLAG,
          components: [cv2.build({
            title: "Skipped",
            description: `The song was **${track.title}** by **${track.author}**`,
            color: client.color,
          })],
        });
        const key = `${user.id}-${guild.id}`;
        const stats = await client.db.gameStats.get(key);
        if (stats) { stats.guessTheSong.streak = 0; stats.guessTheSong.played++; await client.db.gameStats.set(key, stats); }
      } else if (i.customId === "gts_hint") {
        const cleaned = cleanTitle(track.title);
        const hint = cleaned.split(" ").map((w, idx) => idx === 0 ? w[0] + "*".repeat(Math.max(w.length - 1, 0)) : "*".repeat(w.length)).join(" ");
        await i.reply({
          flags: CV2_FLAG,
          components: [cv2.simple(`💡 Hint: **${hint}**`, client.color)],
          ephemeral: true,
        });
      }
    });

    msgCollector.on("collect", async (m) => {
      buttonCollector.stop();
      await cleanup();

      const guess = m.content.toLowerCase().trim();
      const correct = isCorrectGuess(guess, track.title, track.author);

      await textChannel.send({
        flags: CV2_FLAG,
        components: [cv2.build({
          title: correct ? "✅ Correct!" : "❌ Wrong!",
          description: correct
            ? `**${track.title}** by **${track.author}**\n\n${user.username} got it right!`
            : `The song was **${track.title}** by **${track.author}**`,
          color: client.color,
        })],
      });

      const key = `${user.id}-${guild.id}`;
      const stats = await client.db.gameStats.get(key);
      if (stats) {
        if (correct) {
          stats.guessTheSong.correct++;
          stats.guessTheSong.streak++;
          if (stats.guessTheSong.streak > stats.guessTheSong.bestStreak)
            stats.guessTheSong.bestStreak = stats.guessTheSong.streak;
        } else {
          stats.guessTheSong.streak = 0;
        }
        stats.guessTheSong.played++;
        await client.db.gameStats.set(key, stats);
      }
    });

    msgCollector.on("end", async (collected, reason) => {
      if (collected.size === 0 && reason !== "skipped") {
        buttonCollector.stop();
        await cleanup();
        await textChannel.send({
          flags: CV2_FLAG,
          components: [cv2.build({
            title: "⏰ Time's up!",
            description: `The song was **${track.title}** by **${track.author}**`,
            color: client.color,
          })],
        });
        const key = `${user.id}-${guild.id}`;
        const stats = await client.db.gameStats.get(key);
        if (stats) { stats.guessTheSong.streak = 0; stats.guessTheSong.played++; await client.db.gameStats.set(key, stats); }
      }
    });
  }
}
