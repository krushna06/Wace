import { Command, Accessableby } from "../../structures/Command.js";
import { Manager } from "../../manager.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

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
        flags: CV2_FLAG,
        components: [cv2.simple("No news available. Follow artists using Last.FM to get updates!", client.color)],
      });
    }

    const news = newsData.newsCache.slice(0, 5);

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("news_refresh").setLabel("Refresh").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("news_follow").setLabel("Follow Artist").setStyle(ButtonStyle.Success)
    );

    return handler.sendMessage({
      flags: CV2_FLAG,
      components: [
        cv2.build({
          title: "Music News",
          description: news.map((n, i) => `**${i + 1}. ${n.title}** - ${n.artist}\n${n.description.substring(0, 100)}...\n[Read More](${n.url})\n`).join("\n"),
          footer: `Last updated: ${new Date(newsData.lastNewsCheck).toLocaleString()}`,
          color: client.color,
        }),
        buttons,
      ],
    });
  }
}
