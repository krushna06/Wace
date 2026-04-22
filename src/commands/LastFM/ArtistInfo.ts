import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { getArtistInfo, getUserRecentTracks } from "../../services/LastfmService.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["artistinfo"];
  public description = "Shows info about an artist (bio, tags, playcount)";
  public category = "LastFM";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = ["artist-info", "lastfm-artist"];
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

      try {
        const tracksData: any = await getUserRecentTracks(session.username, apiKey, 1, session.session_key);
        const tracks = tracksData.recenttracks.track;
        let nowPlaying = null;
        if (Array.isArray(tracks)) nowPlaying = tracks.find((t) => t["@attr"] && t["@attr"].nowplaying === "true");
        else if (tracks && tracks["@attr"] && tracks["@attr"].nowplaying === "true") nowPlaying = tracks;

        if (!nowPlaying || !nowPlaying.artist?.['#text'])
          return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: "No Artist Playing", description: "You are not currently playing any track on Last.fm.", color: client.color })] });

        const artist = nowPlaying.artist['#text'];
        const artistData: any = await getArtistInfo(artist, apiKey, session.username);

        if (!artistData || !artistData.artist)
          return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: "Artist Not Found", description: `Could not find information for "${artist}"`, color: client.color })] });

        const artistInfo = artistData.artist;
        const tags = artistInfo.toptags?.tag?.slice(0, 5) || [];
        const tagList = tags.length > 0 ? tags.map((tag: any) => tag.name).join(", ") : "No tags available";

        const fields: any[] = [
          { name: "Listeners", value: artistInfo.stats?.listeners || "Unknown", inline: true },
          { name: "Play Count", value: artistInfo.stats?.playcount || "Unknown", inline: true },
          { name: "Tags", value: tagList },
        ];
        if (artistInfo.bio?.summary) {
          const summary = artistInfo.bio.summary.replace(/<[^>]*>/g, '').substring(0, 300);
          fields.push({ name: "Bio", value: summary + (summary.length >= 300 ? "..." : "") });
        }

        return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: `Artist Info: ${artistInfo.name}`, thumbnail: artistInfo.image?.[artistInfo.image.length - 1]?.['#text'] || undefined, color: client.color, fields })] });
      } catch (err) {
        return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: "Error Fetching Artist Info", description: "There was an error fetching the artist information.", color: client.color })] });
      }
    }
}