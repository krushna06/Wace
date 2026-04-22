import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { getUserRecentTracks } from "../../services/LastfmService.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["cover"];
  public description = "Displays the album cover of the currently playing or most recent track (via Last.fm)";
  public category = "LastFM";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = ["albumcover", "lastfm-cover", "lfm-cover"];
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

      if (!tracks || !tracks.length)
        return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: "No Track Found", description: "You are not currently playing any track on Last.fm.", color: client.color })] });

      let track = null;
      if (Array.isArray(tracks)) track = tracks.find((t) => t["@attr"] && t["@attr"].nowplaying === "true") || tracks[0];
      else track = tracks;

      const albumCover = track?.image?.[track.image.length - 1]?.['#text'] || null;
      if (albumCover) {
        return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: `Album Cover: ${track.name}`, description: `by **${track.artist['#text']}**${track.album['#text'] ? `\nAlbum: **${track.album['#text']}**` : ''}`, thumbnail: albumCover, color: client.color })] });
      } else {
        return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: "No Album Cover Found", description: "Could not find an album cover for your current or recent track.", color: client.color })] });
      }
    }
}