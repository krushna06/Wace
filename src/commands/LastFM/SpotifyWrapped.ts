import { Command, Accessableby } from "../../structures/Command.js";
import { Manager } from "../../manager.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

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
        flags: CV2_FLAG,
        components: [cv2.simple("Your yearly wrapped is not ready yet. Keep listening to generate your report!", client.color)],
      });
    }

    const wrapped = recommendations.yearlyWrapped;
    const topTracks = wrapped.topTracks.slice(0, 5);
    const topArtists = wrapped.topArtists.slice(0, 5);
    const topGenres = wrapped.topGenres.slice(0, 5);

    return handler.sendMessage({
      flags: CV2_FLAG,
      components: [cv2.build({
        title: `Your 2024 Wrapped - ${user.username}`,
        thumbnail: user.displayAvatarURL(),
        color: client.color,
        footer: `Generated: ${new Date(wrapped.generatedAt).toLocaleDateString()}`,
        fields: [
          { name: "Total Minutes Listened", value: `**${wrapped.totalMinutesListened.toLocaleString()}** minutes` },
          { name: "Top 5 Tracks", value: topTracks.map((t, i) => `**${i + 1}.** ${t.title} - ${t.artist} (${t.plays} plays)`).join("\n") },
          { name: "Top 5 Artists", value: topArtists.map((a, i) => `**${i + 1}.** ${a.name} (${a.plays} plays)`).join("\n") },
          { name: "Top 5 Genres", value: topGenres.map((g, i) => `**${i + 1}.** ${g.name} (${g.plays} plays)`).join("\n") },
        ],
      })],
    });
  }
}
