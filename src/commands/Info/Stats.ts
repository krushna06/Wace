import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { getUserPlayHistory } from "../../database/handler.js";
import fetch from "node-fetch";
export default class implements Command {
  public name = ["stats"];
  public description = "Show user or guild stats (songs played, commands executed)";
  public category = "Info";
  public accessableby = [Accessableby.Member];
  public usage = "/stats [type]";
  public aliases = [];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "type",
      description: "Stats type (user, guild, top_songs, top_users, last_played)",
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: [
        { name: "User", value: "user" },
        { name: "Guild", value: "guild" },
        { name: "Top Songs", value: "top_songs" },
        { name: "Top Users", value: "top_users" },
        { name: "Last Played", value: "last_played" },
      ],
    },
  ];
  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();
    const type = handler.args[0];
    let embed;
    if (!type) {
      const key = `${handler.user?.id}:${handler.guild?.id}`;
      const userStats = await client.db.userStats.get(key);
      const { getTopSongsForGuild, getLastPlayedSongForGuild } = await import("../../database/handler.js");
      const topSongs = await getTopSongsForGuild(client.db, handler.guild?.id);
      const lastPlayed = await getLastPlayedSongForGuild(client.db, handler.guild?.id);
      const playHistory = await getUserPlayHistory(client.db, handler.user?.id, handler.guild?.id);
      let chartUrl = null;
      if (playHistory && playHistory.length > 0) {
        const now = Date.now();
        const days = Array.from({ length: 14 }, (_, i) => {
          const d = new Date(now - (13 - i) * 24 * 60 * 60 * 1000);
          return d.toISOString().slice(0, 10);
        });
        const dayCounts = Object.fromEntries(days.map(d => [d, 0]));
        for (const entry of playHistory) {
          const day = new Date(entry.playedAt).toISOString().slice(0, 10);
          if (dayCounts[day] !== undefined) dayCounts[day]++;
        }
        const chartData = {
          type: "line",
          data: {
            labels: days,
            datasets: [{
              label: "Songs Played",
              data: days.map(d => dayCounts[d]),
              fill: true,
              borderColor: "#5865F2",
              backgroundColor: "rgba(88,101,242,0.2)",
              tension: 0.3
            }]
          },
          options: {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
            layout: { padding: 10 },
            responsive: false,
            width: 500,
            height: 200
          }
        };
        chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartData))}`;
      }
      embed = new EmbedBuilder()
        .setTitle(`Stats Summary for ${handler.user?.username}`)
        .setColor(client.color)
        .addFields(
          { name: "Songs Played", value: String(userStats?.songsPlayed ?? 0), inline: true },
          { name: "Commands Executed", value: String(userStats?.commandsExecuted ?? 0), inline: true },
          { name: "\u200B", value: "\u200B" },
          { name: "Top 3 Songs", value: topSongs.length ? topSongs.slice(0, 3).map((s, i) => `**${i + 1}.** [${s.title}](${s.uri}) by ${s.author} — ${s.playCount} plays`).join("\n") : "No song stats available.", inline: false },
          { name: "Last Played", value: lastPlayed ? `[${lastPlayed.title}](${lastPlayed.uri}) by ${lastPlayed.author}\nPlayed at: <t:${Math.floor((lastPlayed.playedAt || 0) / 1000)}:F>` : "No last played song available.", inline: false }
        );
      if (chartUrl) embed.setImage(chartUrl);
    } else if (type === "user") {
      const key = `${handler.user?.id}:${handler.guild?.id}`;
      const stats = await client.db.userStats.get(key);
      embed = new EmbedBuilder()
        .setTitle(`User Stats for ${handler.user?.username}`)
        .setColor(client.color)
        .addFields(
          { name: "Songs Played", value: String(stats?.songsPlayed ?? 0), inline: true },
          { name: "Commands Executed", value: String(stats?.commandsExecuted ?? 0), inline: true }
        );
    } else if (type === "guild") {
      const stats = await client.db.guildStats.get(handler.guild?.id);
      embed = new EmbedBuilder()
        .setTitle(`Guild Stats for ${handler.guild?.name}`)
        .setColor(client.color)
        .addFields(
          { name: "Songs Played", value: String(stats?.songsPlayed ?? 0), inline: true },
          { name: "Commands Executed", value: String(stats?.commandsExecuted ?? 0), inline: true }
        );
    } else if (type === "top_songs") {
      const { getTopSongsForGuild } = await import("../../database/handler.js");
      const topSongs = await getTopSongsForGuild(client.db, handler.guild?.id);
      embed = new EmbedBuilder()
        .setTitle(`Top 5 Songs in ${handler.guild?.name}`)
        .setColor(client.color)
        .setDescription(
          topSongs.length
            ? topSongs.map((s, i) => `**${i + 1}.** [${s.title}](${s.uri}) by ${s.author} — Played ${s.playCount} times`).join("\n")
            : "No song stats available."
        );
    } else if (type === "top_users") {
      const { getTopUsersForGuild } = await import("../../database/handler.js");
      const topUsers = await getTopUsersForGuild(client.db, handler.guild?.id);
      embed = new EmbedBuilder()
        .setTitle(`Top 5 Users in ${handler.guild?.name}`)
        .setColor(client.color)
        .setDescription(
          topUsers.length
            ? topUsers.map((u, i) => `**${i + 1}.** <@${u.userId}> — ${u.songsPlayed} requests`).join("\n")
            : "No user stats available."
        );
    } else if (type === "last_played") {
      const { getLastPlayedSongForGuild } = await import("../../database/handler.js");
      const lastPlayed = await getLastPlayedSongForGuild(client.db, handler.guild?.id);
      embed = new EmbedBuilder()
        .setTitle(`Last Played Song in ${handler.guild?.name}`)
        .setColor(client.color)
        .setDescription(
          lastPlayed
            ? `[${lastPlayed.title}](${lastPlayed.uri}) by ${lastPlayed.author}\nPlayed at: <t:${Math.floor((lastPlayed.playedAt || 0) / 1000)}:F>`
            : "No last played song available."
        );
    } else {
      embed = new EmbedBuilder()
        .setDescription("Invalid type. Use 'user', 'guild', 'top_songs', 'top_users', or 'last_played'.")
        .setColor(client.color);
    }
    await handler.editReply({ embeds: [embed] });
  }
}