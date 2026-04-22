import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { getUserInfo, getUserTopArtists, getUserTopAlbums, getUserTopTracks } from "../../services/LastfmService.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["fmprofile"];
  public description = "Shows your Last.fm profile summary (scrobbles, top artist, top album, top track, etc.)";
  public category = "LastFM";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = ["lastfm-profile", "lfm-profile", "profile"];
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
      const username = session.username;

      try {
        const userInfo: any = await getUserInfo(username, apiKey);
        if (!userInfo || !userInfo.user) throw new Error("No user info");

        const [topArtistData, topAlbumData, topTrackData]: any[] = await Promise.all([
          getUserTopArtists(username, apiKey, "overall", 1),
          getUserTopAlbums(username, apiKey, "overall", 1),
          getUserTopTracks(username, apiKey, "overall", 1),
        ]);

        const topArtist = topArtistData?.topartists?.artist?.[0] || null;
        const topAlbum = topAlbumData?.topalbums?.album?.[0] || null;
        const topTrack = topTrackData?.toptracks?.track?.[0] || null;

        return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({
          title: `${userInfo.user.name}'s Last.fm Profile`,
          thumbnail: userInfo.user.image?.[userInfo.user.image.length - 1]?.['#text'] || undefined,
          color: client.color,
          fields: [
            { name: "Scrobbles", value: userInfo.user.playcount || "0", inline: true },
            { name: "Country", value: userInfo.user.country || "Unknown", inline: true },
            { name: "Registered", value: userInfo.user.registered?.['#text'] ? new Date(Number(userInfo.user.registered['unixtime']) * 1000).toLocaleDateString() : "Unknown", inline: true },
            { name: "Top Artist", value: topArtist ? `[${topArtist.name}](${topArtist.url}) (${topArtist.playcount} plays)` : "N/A" },
            { name: "Top Album", value: topAlbum ? `[${topAlbum.name}](${topAlbum.url}) by ${topAlbum.artist?.name || 'Unknown'} (${topAlbum.playcount} plays)` : "N/A" },
            { name: "Top Track", value: topTrack ? `[${topTrack.name}](${topTrack.url}) by ${topTrack.artist?.name || 'Unknown'} (${topTrack.playcount} plays)` : "N/A" },
          ],
        })] });
      } catch (err) {
        return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: "Error Fetching Profile", description: "There was an error fetching your Last.fm profile summary.", color: client.color })] });
      }
    }
}