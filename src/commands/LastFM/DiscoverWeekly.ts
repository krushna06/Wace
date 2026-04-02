import { Command, Accessableby } from "../../structures/Command.js";
import { Manager } from "../../manager.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default class DiscoverWeekly extends Command {
  constructor() {
    super();
    this.name = ["discoverweekly"];
    this.description = "Get personalized weekly music recommendations";
    this.category = "LastFM";
    this.accessableby = [Accessableby.Member];
    this.usingInteraction = true;
  }

  async execute(client: Manager, handler: CommandHandler): Promise<any> {
    const { guild, user } = handler;
    if (!guild || !user) return;

    const key = `${user.id}-${guild.id}`;
    let recommendations = await client.db.userRecommendations.get(key);

    if (!recommendations) {
      return handler.sendMessage({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription(
              "No recommendations available yet. Play more songs to get personalized recommendations!"
            ),
        ],
      });
    }

    const tracks = recommendations.weeklyRecommendations.tracks.slice(0, 10);

    if (tracks.length === 0) {
      return handler.sendMessage({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription(
              "No recommendations available yet. Play more songs to get personalized recommendations!"
            ),
        ],
      });
    }

    const embed = new EmbedBuilder()
      .setColor(client.color)
      .setTitle(`Discover Weekly - ${user.username}`)
      .setDescription(
        tracks
          .map(
            (track, i) =>
              `**${i + 1}.** [${track.title}](${track.uri}) by **${track.artist}**\n*Score: ${track.score.toFixed(2)}*`
          )
          .join("\n")
      )
      .setFooter({
        text: `Generated: ${new Date(recommendations.weeklyRecommendations.generatedAt).toLocaleDateString()}`,
      });

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("dw_queue")
        .setLabel("Add to Queue")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("dw_playlist")
        .setLabel("Create Playlist")
        .setStyle(ButtonStyle.Primary)
    );

    return handler.sendMessage({ embeds: [embed], components: [buttons] });
  }
}
