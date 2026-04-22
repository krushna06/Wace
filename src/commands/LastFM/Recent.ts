import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { getUserRecentTracks } from "../../services/LastfmService.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["recent"];
  public description = "Show your 5 most recently played tracks (via Last.fm)";
  public category = "LastFM";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = ["recenttracks", "lastfm-recent", "lfm-recent"];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
      await handler.deferReply();
      const discordId = handler.user?.id;
      if (!discordId) return handler.editReply({ content: "Could not determine your Discord user ID." });

      const session = await client.db.lastfmSession.get(discordId);
      if (!session || !session.session_key)
        return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: "Not Connected to Last.fm", description: "You need to connect your Last.fm account first. Use /lastfm-connect.", color: client.color })] });

      const apiKey = client.config.player.LASTFM.api_key;
      const tracksData: any = await getUserRecentTracks(session.username, apiKey, 5, session.session_key);
      const tracks = Array.isArray(tracksData.recenttracks.track) ? tracksData.recenttracks.track : [tracksData.recenttracks.track];

      if (!tracksData?.recenttracks?.track?.length)
        return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: "No Recent Tracks", description: "You have not played any tracks recently on Last.fm.", color: client.color })] });

      return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({
        title: "Your 5 Most Recent Tracks (via Last.fm)",
        description: tracks.map((track: any, i: number) => {
          const nowPlaying = track["@attr"] && track["@attr"].nowplaying === "true";
          return `**${i + 1}.** [${track.name}](${track.url}) by **${track.artist['#text']}**${nowPlaying ? " _(Now Playing)_" : ""}`;
        }).join("\n"),
        thumbnail: tracks[0]?.image?.length ? tracks[0].image[tracks[0].image.length - 1]['#text'] : undefined,
        color: client.color,
      })] });
    }
}