import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { getUserTopArtists } from "../../services/LastfmService.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

const PERIODS = {
  week: "7day",
  month: "1month",
  all: "overall",
};

export default class implements Command {
  public name = ["topartists"];
  public description = "Shows your top artists (week/month/all-time) via Last.fm";
  public category = "LastFM";
  public accessableby = [Accessableby.Member];
  public usage = "[period]";
  public aliases = ["lastfm-topartists", "lfm-topartists", "top-artist"];
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
      const artistsData: any = await getUserTopArtists(session.username, apiKey, period, 10, session.session_key);
      const artists = Array.isArray(artistsData.topartists.artist) ? artistsData.topartists.artist : [artistsData.topartists.artist];

      if (!artistsData?.topartists?.artist?.length)
        return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: "No Top Artists Found", description: "Could not find any top artists for the selected period.", color: client.color })] });

      return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({
        title: `Your Top Artists (${periodInputRaw}) (via Last.fm)`,
        description: artists.map((artist: any, i: number) => `**${i + 1}.** [${artist.name}](${artist.url}) — ${artist.playcount} plays`).join("\n"),
        thumbnail: artists[0]?.image?.length ? artists[0].image[artists[0].image.length - 1]['#text'] : undefined,
        color: client.color,
      })] });
    }
}