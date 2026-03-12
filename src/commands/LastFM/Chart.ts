import { AttachmentBuilder } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { getUserTopAlbums, getUserTopArtists, getUserTopTracks } from "../../services/LastfmService.js";
import fetch from "node-fetch";
import { createCanvas, loadImage } from "canvas";
import fs from "fs";
import path from "path";

const PERIODS = {
  week: "7day",
  month: "1month",
  all: "overall",
};

export default class implements Command {
  public name = ["chart"];
  public description = "Shows a visual chart of your top albums/artists/tracks via Last.fm as a single image collage.";
  public category = "LastFM";
  public accessableby = [Accessableby.Member];
  public usage = "[type] [layout] [period]";
  public aliases = ["lastfm-chart", "lfm-chart", "visual-chart"];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "type",
      description: "Type of chart (album, artist, track)",
      type: 3,
      required: false,
      choices: [
        { name: "Album", value: "album" },
        { name: "Artist", value: "artist" },
        { name: "Track", value: "track" },
      ],
    },
    {
      name: "layout",
      description: "Chart layout (3x3, 4x4)",
      type: 3,
      required: false,
      choices: [
        { name: "3x3 Grid", value: "3x3" },
        { name: "4x4 Grid", value: "4x4" },
      ],
    },
    {
      name: "period",
      description: "Time period (week, month, all)",
      type: 3,
      required: false,
      choices: [
        { name: "Week", value: "week" },
        { name: "Month", value: "month" },
        { name: "All Time", value: "all" },
      ],
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();
    const discordId = handler.user?.id;
    if (!discordId) {
      return handler.editReply({ content: "Could not determine your Discord user ID." });
    }
    const session = await client.db.lastfmSession.get(discordId);
    if (!session || !session.session_key) {
      return handler.editReply({ content: "You need to connect your Last.fm account first. Use /lastfm-connect." });
    }
    const typeInput = handler.args[0]?.toLowerCase?.() || "album";
    const layoutInput = handler.args[1]?.toLowerCase?.() || "3x3";
    const periodInput = handler.args[2]?.toLowerCase?.() || "week";
    const validTypes = ["album", "artist", "track"];
    const validLayouts = ["3x3", "4x4"];
    const validPeriods = ["week", "month", "all"];
    if (!validTypes.includes(typeInput) || !validLayouts.includes(layoutInput) || !validPeriods.includes(periodInput)) {
      return handler.editReply({ content: "Invalid arguments." });
    }
    const period = PERIODS[periodInput];
    const apiKey = client.config.player.LASTFM.api_key;
    const gridSize = layoutInput === "3x3" ? 9 : 16;
    const gridCols = layoutInput === "3x3" ? 3 : 4;
    const gridRows = layoutInput === "3x3" ? 3 : 4;
    try {
      let data: any;
      let items: any[];
      switch (typeInput) {
        case "album":
          data = await getUserTopAlbums(session.username, apiKey, period, gridSize, session.session_key);
          items = Array.isArray(data.topalbums.album) ? data.topalbums.album : [data.topalbums.album];
          break;
        case "artist":
          data = await getUserTopArtists(session.username, apiKey, period, gridSize, session.session_key);
          items = Array.isArray(data.topartists.artist) ? data.topartists.artist : [data.topartists.artist];
          break;
        case "track":
          data = await getUserTopTracks(session.username, apiKey, period, gridSize, session.session_key);
          items = Array.isArray(data.toptracks.track) ? data.toptracks.track : [data.toptracks.track];
          break;
        default:
          return handler.editReply({ content: "Invalid type specified." });
      }
      if (!data || !items || items.length === 0) {
        return handler.editReply({ content: `Could not find any top ${typeInput}s for the selected period.` });
      }
      const imageUrls = items.map(item => {
        if (item.image && item.image.length > 0) {
          const large = item.image.find((img: any) => img.size === "extralarge")?.['#text'] ||
                        item.image.find((img: any) => img.size === "large")?.['#text'] ||
                        item.image.find((img: any) => img.size === "medium")?.['#text'] ||
                        item.image[item.image.length - 1]?.['#text'] ||
                        null;
          return large && large.length > 0 ? large : null;
        }
        return null;
      });
      const images = await Promise.all(imageUrls.map(async (url, i) => {
        try {
          if (!url) return null;
          return await loadImage(url);
        } catch {
          return null;
        }
      }));
      const cellSize = 300;
      const canvas = createCanvas(cellSize * gridCols, cellSize * gridRows);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#222";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < gridSize; i++) {
        const img = images[i];
        const x = (i % gridCols) * cellSize;
        const y = Math.floor(i / gridCols) * cellSize;
        if (img) {
          ctx.drawImage(img, x, y, cellSize, cellSize);
        } else {
          ctx.fillStyle = "#444";
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }
      const fileName = `chart_${Date.now()}_${Math.random().toString(36).slice(2)}.png`;
      const filePath = path.join("./", fileName);
      const out = fs.createWriteStream(filePath);
      const stream = canvas.createPNGStream();
      await new Promise((resolve, reject) => {
        stream.pipe(out);
        out.on("finish", () => resolve(undefined));
        out.on("error", reject);
      });
      const attachment = new AttachmentBuilder(filePath, { name: "chart.png" });
      await handler.editReply({
        content: " ",
        embeds: [
          {
            color: Array.isArray(client.color)
              ? ((client.color[0] << 16) + (client.color[1] << 8) + client.color[2])
              : (typeof client.color === 'string'
                  ? parseInt(client.color.replace('#', ''), 16)
                  : (typeof client.color === 'number' ? client.color : 0x2b2d31)),
            image: { url: "attachment://chart.png" }
          }
        ],
        files: [attachment]
      });
      fs.promises.unlink(filePath).catch(() => {});
    } catch (error) {
      console.error("Chart command error:", error);
      return handler.editReply({ content: "There was an error generating your chart. Please try again later." });
    }
  }
}