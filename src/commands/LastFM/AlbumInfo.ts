import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { getAlbumInfo, getUserRecentTracks } from "../../services/LastfmService.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["albuminfo"];
  public description = "Shows info about the current album (tags, listeners, plays)";
  public category = "LastFM";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = ["album-info", "lastfm-album"];
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

        if (!nowPlaying || !nowPlaying.album?.['#text'])
          return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: "No Album Playing", description: "You are not currently playing any track with album information on Last.fm.", color: client.color })] });

        const artist = nowPlaying.artist['#text'];
        const album = nowPlaying.album['#text'];
        const albumData: any = await getAlbumInfo(artist, album, apiKey, session.username);

        if (!albumData || !albumData.album)
          return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: "Album Not Found", description: `Could not find information for "${album}" by ${artist}`, color: client.color })] });

        const albumInfo = albumData.album;
        const tags = albumInfo.toptags?.tag?.slice(0, 5) || [];
        const tagList = tags.length > 0 ? tags.map((tag: any) => tag.name).join(", ") : "No tags available";

        const fields: any[] = [
          { name: "Artist", value: albumInfo.artist || artist, inline: true },
          { name: "Listeners", value: albumInfo.listeners || "Unknown", inline: true },
          { name: "Play Count", value: albumInfo.playcount || "Unknown", inline: true },
          { name: "Tags", value: tagList },
        ];
        if (albumInfo.wiki?.summary) {
          const summary = albumInfo.wiki.summary.replace(/<[^>]*>/g, '').substring(0, 200);
          fields.push({ name: "Summary", value: summary + (summary.length >= 200 ? "..." : "") });
        }

        return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: `Album Info: ${albumInfo.name}`, thumbnail: albumInfo.image?.[albumInfo.image.length - 1]?.['#text'] || undefined, color: client.color, fields })] });
      } catch (err) {
        return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: "Error Fetching Album Info", description: "There was an error fetching the album information.", color: client.color })] });
      }
    }
}