import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { getUserTopAlbums } from "../../services/LastfmService.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

const PERIODS = {
  week: "7day",
  month: "1month",
  all: "overall",
};

export default class implements Command {
  public name = ["topalbums"];
  public description = "Shows your top albums (week/month/all-time) via Last.fm";
  public category = "LastFM";
  public accessableby = [Accessableby.Member];
  public usage = "[period]";
  public aliases = ["lastfm-topalbums", "lfm-topalbums", "top-album"];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
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
      if (!discordId) return handler.editReply({ content: "Could not determine your Discord user ID." });

      const session = await client.db.lastfmSession.get(discordId);
      if (!session || !session.session_key)
        return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: "Not Connected to Last.fm", description: "You need to connect your Last.fm account first. Use /lastfm-connect.", color: client.color })] });

      const periodInputRaw = handler.args[0]?.toLowerCase?.() || "week";
      const period = PERIODS[periodInputRaw] || PERIODS.week;
      const apiKey = client.config.player.LASTFM.api_key;
      const albumsData: any = await getUserTopAlbums(session.username, apiKey, period, 10, session.session_key);
      const albums = Array.isArray(albumsData.topalbums.album) ? albumsData.topalbums.album : [albumsData.topalbums.album];

      if (!albumsData?.topalbums?.album?.length)
        return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: "No Top Albums Found", description: "Could not find any top albums for the selected period.", color: client.color })] });

      return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({
        title: `Your Top Albums (${periodInputRaw}) (via Last.fm)`,
        description: albums.map((album: any, i: number) => `**${i + 1}.** [${album.name}](${album.url}) by **${album.artist?.name || 'Unknown'}** — ${album.playcount} plays`).join("\n"),
        thumbnail: albums[0]?.image?.length ? albums[0].image[albums[0].image.length - 1]['#text'] : undefined,
        color: client.color,
      })] });
    }
}