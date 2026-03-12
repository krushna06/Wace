import { EmbedBuilder } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { getUserTopTracks } from "../../services/LastfmService.js";

const PERIODS = {
  week: "7day",
  month: "1month",
  all: "overall",
};

export default class implements Command {
  public name = ["toptracks"];
  public description = "Shows your top tracks for a selected period: week, month, or all-time (via Last.fm)";
  public category = "LastFM";
  public accessableby = [Accessableby.Member];
  public usage = "[week|month|all]";
  public aliases = ["lastfm-toptracks", "lfm-toptracks", "top-track"];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "period",
      description: "Time period (week, month, all-time)",
      type: 3,
      required: false,
      choices: [
        { name: "Week (last 7 days)", value: "week" },
        { name: "Month (last 30 days)", value: "month" },
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
      const embed = new EmbedBuilder()
        .setTitle("Not Connected to Last.fm")
        .setDescription("You need to connect your Last.fm account first. Use /lastfm-connect.")
        .setColor(client.color);
      return handler.editReply({ content: " ", embeds: [embed] });
    }
    const periodInputRaw = handler.args[0]?.toLowerCase?.() || "week";
    const period = PERIODS[periodInputRaw] || PERIODS.week;
    const apiKey = client.config.player.LASTFM.api_key;
    const tracksData: any = await getUserTopTracks(session.username, apiKey, period, 10, session.session_key);
    const tracks = Array.isArray(tracksData.toptracks.track) ? tracksData.toptracks.track : [tracksData.toptracks.track];
    if (!tracksData || !tracksData.toptracks || !tracksData.toptracks.track || tracksData.toptracks.track.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle("No Top Tracks Found")
        .setDescription("Could not find any top tracks for the selected period.")
        .setColor(client.color);
      return handler.editReply({ content: " ", embeds: [embed] });
    }
    const embed = new EmbedBuilder()
      .setTitle(`Your Top Tracks (${periodInputRaw}) (via Last.fm)`)
      .setColor(client.color)
      .setDescription(
        tracks
          .map((track: any, i: number) => `**${i + 1}.** [${track.name}](${track.url}) by **${track.artist?.name || 'Unknown'}** — ${track.playcount} plays`)
          .join("\n")
      );
    if (tracks[0]?.image?.length) {
      embed.setThumbnail(tracks[0].image[tracks[0].image.length - 1]['#text'] || null);
    }
    return handler.editReply({ content: " ", embeds: [embed] });
  }
}