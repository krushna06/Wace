import { Command, Accessableby } from "../../structures/Command.js";
import { Manager } from "../../manager.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

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
        flags: CV2_FLAG,
        components: [cv2.simple("No recommendations available yet. Play more songs to get personalized recommendations!", client.color)],
      });
    }

    const tracks = recommendations.weeklyRecommendations.tracks.slice(0, 10);

    if (tracks.length === 0) {
      return handler.sendMessage({
        flags: CV2_FLAG,
        components: [cv2.simple("No recommendations available yet. Play more songs to get personalized recommendations!", client.color)],
      });
    }

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("dw_queue").setLabel("Add to Queue").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("dw_playlist").setLabel("Create Playlist").setStyle(ButtonStyle.Primary)
    );

    return handler.sendMessage({
      flags: CV2_FLAG,
      components: [
        cv2.build({
          title: `Discover Weekly - ${user.username}`,
          description: tracks.map((track, i) => `**${i + 1}.** [${track.title}](${track.uri}) by **${track.artist}**\n*Score: ${track.score.toFixed(2)}*`).join("\n"),
          footer: `Generated: ${new Date(recommendations.weeklyRecommendations.generatedAt).toLocaleDateString()}`,
          color: client.color,
        }),
        buttons,
      ],
    });
  }
}
