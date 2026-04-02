import { Command, Accessableby } from "../../structures/Command.js";
import { Manager } from "../../manager.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { EmbedBuilder } from "discord.js";

export default class SpotifyWrapped extends Command {
  constructor() {
    super();
    this.name = ["spotifywrapped"];
    this.description = "View your annual music wrapped report";
    this.category = "LastFM";
    this.accessableby = [Accessableby.Member];
    this.usingInteraction = true;
  }

  async execute(client: Manager, handler: CommandHandler): Promise<any> {
    const { guild, user } = handler;
    if (!guild || !user) return;

    const key = `${user.id}-${guild.id}`;
    const recommendations = await client.db.userRecommendations.get(key);

    if (!recommendations || !recommendations.yearlyWrapped) {
      return handler.sendMessage({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription(
              "Your yearly wrapped is not ready yet. Keep listening to generate your report!"
            ),
        ],
      });
    }

    const wrapped = recommendations.yearlyWrapped;
    const topTracks = wrapped.topTracks.slice(0, 5);
    const topArtists = wrapped.topArtists.slice(0, 5);
    const topGenres = wrapped.topGenres.slice(0, 5);

    const embed = new EmbedBuilder()
      .setColor(client.color)
      .setTitle(`Your 2024 Wrapped - ${user.username}`)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        {
          name: "Total Minutes Listened",
          value: `**${wrapped.totalMinutesListened.toLocaleString()}** minutes`,
          inline: false,
        },
        {
          name: "Top 5 Tracks",
          value: topTracks
            .map((t, i) => `**${i + 1}.** ${t.title} - ${t.artist} (${t.plays} plays)`)
            .join("\n"),
          inline: false,
        },
        {
          name: "Top 5 Artists",
          value: topArtists
            .map((a, i) => `**${i + 1}.** ${a.name} (${a.plays} plays)`)
            .join("\n"),
          inline: false,
        },
        {
          name: "Top 5 Genres",
          value: topGenres
            .map((g, i) => `**${i + 1}.** ${g.name} (${g.plays} plays)`)
            .join("\n"),
          inline: false,
        }
      )
      .setFooter({
        text: `Generated: ${new Date(wrapped.generatedAt).toLocaleDateString()}`,
      });

    return handler.sendMessage({ embeds: [embed] });
  }
}
