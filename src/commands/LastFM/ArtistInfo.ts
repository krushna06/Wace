import { EmbedBuilder } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { getArtistInfo, getUserRecentTracks } from "../../services/LastfmService.js";

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

    const apiKey = client.config.player.LASTFM.api_key;
    
    try {
      // Get current track to extract artist info
      const tracksData: any = await getUserRecentTracks(session.username, apiKey, 1, session.session_key);
      const tracks = tracksData.recenttracks.track;
      let nowPlaying = null;
      
      if (Array.isArray(tracks)) {
        nowPlaying = tracks.find((t) => t["@attr"] && t["@attr"].nowplaying === "true");
      } else if (tracks && tracks["@attr"] && tracks["@attr"].nowplaying === "true") {
        nowPlaying = tracks;
      }

      if (!nowPlaying || !nowPlaying.artist?.['#text']) {
        const embed = new EmbedBuilder()
          .setTitle("No Artist Playing")
          .setDescription("You are not currently playing any track on Last.fm.")
          .setColor(client.color);
        return handler.editReply({ content: " ", embeds: [embed] });
      }

      const artist = nowPlaying.artist['#text'];
      
      // Get artist info from LastFM
      const artistData: any = await getArtistInfo(artist, apiKey, session.username);
      
      if (!artistData || !artistData.artist) {
        const embed = new EmbedBuilder()
          .setTitle("Artist Not Found")
          .setDescription(`Could not find information for "${artist}"`)
          .setColor(client.color);
        return handler.editReply({ content: " ", embeds: [embed] });
      }

      const artistInfo = artistData.artist;
      const tags = artistInfo.toptags?.tag?.slice(0, 5) || [];
      const tagList = tags.length > 0 ? tags.map((tag: any) => tag.name).join(", ") : "No tags available";
      
      const embed = new EmbedBuilder()
        .setTitle(`Artist Info: ${artistInfo.name}`)
        .setURL(artistInfo.url)
        .setColor(client.color)
        .setThumbnail(artistInfo.image?.[artistInfo.image.length - 1]?.['#text'] || null)
        .addFields(
          { name: "Listeners", value: artistInfo.stats?.listeners || "Unknown", inline: true },
          { name: "Play Count", value: artistInfo.stats?.playcount || "Unknown", inline: true },
          { name: "Tags", value: tagList, inline: false }
        );

      if (artistInfo.bio?.summary) {
        const summary = artistInfo.bio.summary.replace(/<[^>]*>/g, '').substring(0, 300);
        embed.addFields({ name: "Bio", value: summary + (summary.length >= 300 ? "..." : ""), inline: false });
      }

      return handler.editReply({ content: " ", embeds: [embed] });
    } catch (err) {
      const embed = new EmbedBuilder()
        .setTitle("Error Fetching Artist Info")
        .setDescription("There was an error fetching the artist information.")
        .setColor(client.color);
      return handler.editReply({ content: " ", embeds: [embed] });
    }
  }
} 