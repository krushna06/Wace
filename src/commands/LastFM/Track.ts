import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { getUserRecentTracks } from "../../services/LastfmService.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["track"];
  public description = "Show the track you're currently listening to (via Last.fm)";
  public category = "LastFM";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = ["nowplaying", "np", "lastfm-track"];
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
      const tracksData: any = await getUserRecentTracks(session.username, apiKey, 1, session.session_key);
      const tracks = tracksData.recenttracks.track;
      let nowPlaying = null;
      if (Array.isArray(tracks)) nowPlaying = tracks.find((t) => t["@attr"] && t["@attr"].nowplaying === "true");
      else if (tracks && tracks["@attr"] && tracks["@attr"].nowplaying === "true") nowPlaying = tracks;

      if (nowPlaying) {
        return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({
          title: "Now Playing on Spotify (via Last.fm)",
          description: `**${nowPlaying.name}** by **${nowPlaying.artist['#text']}**`,
          thumbnail: nowPlaying.image?.[nowPlaying.image.length - 1]?.['#text'] || undefined,
          color: client.color,
          fields: [
            { name: "Album", value: nowPlaying.album['#text'] || "Unknown", inline: true },
            { name: "Link", value: nowPlaying.url ? `[Open in Last.fm](${nowPlaying.url})` : "N/A", inline: true },
          ],
        })] });
      } else {
        return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: "No Track Playing", description: "You are not currently playing any track on Last.fm.", color: client.color })] });
      }
    }
}