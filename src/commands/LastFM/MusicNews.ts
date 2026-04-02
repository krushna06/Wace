import { Command, Accessableby } from "../../structures/Command.js";
import { Manager } from "../../manager.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default class MusicNews extends Command {
  constructor() {
    super();
    this.name = ["musicnews"];
    this.description = "Get music news from your favorite artists";
    this.category = "LastFM";
    this.accessableby = [Accessableby.Member];
    this.usingInteraction = true;
  }

  async execute(client: Manager, handler: CommandHandler): Promise<any> {
    const { guild, user } = handler;
    if (!guild || !user) return;

    const key = `${user.id}`;
    const newsData = await client.db.lastfmNews.get(key);

    if (!newsData || newsData.newsCache.length === 0) {
      return handler.sendMessage({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription(
              "No news available. Follow artists using Last.FM to get updates!"
            ),
        ],
      });
    }

    const news = newsData.newsCache.slice(0, 5);

    const embed = new EmbedBuilder()
      .setColor(client.color)
      .setTitle("Music News")
      .setDescription(
        news
          .map(
            (n, i) =>
              `**${i + 1}. ${n.title}** - ${n.artist}\n${n.description.substring(0, 100)}...\n[Read More](${n.url})\n`
          )
          .join("\n")
      )
      .setFooter({
        text: `Last updated: ${new Date(newsData.lastNewsCheck).toLocaleString()}`,
      });

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("news_refresh")
        .setLabel("Refresh")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("news_follow")
        .setLabel("Follow Artist")
        .setStyle(ButtonStyle.Success)
    );

    return handler.sendMessage({ embeds: [embed], components: [buttons] });
  }
}
