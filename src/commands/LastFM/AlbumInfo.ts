import { EmbedBuilder } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { getAlbumInfo, getUserRecentTracks } from "../../services/LastfmService.js";

export default class implements Command {
  public name = ["albuminfo"];
  public description = "Shows info about the current album (tags, listeners, plays)";
  public category = "Utils";
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
      const tracksData: any = await getUserRecentTracks(session.username, apiKey, 1, session.session_key);
      const tracks = tracksData.recenttracks.track;
      let nowPlaying = null;
      
      if (Array.isArray(tracks)) {
        nowPlaying = tracks.find((t) => t["@attr"] && t["@attr"].nowplaying === "true");
      } else if (tracks && tracks["@attr"] && tracks["@attr"].nowplaying === "true") {
        nowPlaying = tracks;
      }

      if (!nowPlaying || !nowPlaying.album?.['#text']) {
        const embed = new EmbedBuilder()
          .setTitle("No Album Playing")
          .setDescription("You are not currently playing any track with album information on Last.fm.")
          .setColor(client.color);
        return handler.editReply({ content: " ", embeds: [embed] });
      }

      const artist = nowPlaying.artist['#text'];
      const album = nowPlaying.album['#text'];
      
      const albumData: any = await getAlbumInfo(artist, album, apiKey, session.username);
      
      if (!albumData || !albumData.album) {
        const embed = new EmbedBuilder()
          .setTitle("Album Not Found")
          .setDescription(`Could not find information for "${album}" by ${artist}`)
          .setColor(client.color);
        return handler.editReply({ content: " ", embeds: [embed] });
      }

      const albumInfo = albumData.album;
      const tags = albumInfo.toptags?.tag?.slice(0, 5) || [];
      const tagList = tags.length > 0 ? tags.map((tag: any) => tag.name).join(", ") : "No tags available";
      
      const embed = new EmbedBuilder()
        .setTitle(`Album Info: ${albumInfo.name}`)
        .setURL(albumInfo.url)
        .setColor(client.color)
        .setThumbnail(albumInfo.image?.[albumInfo.image.length - 1]?.['#text'] || null)
        .addFields(
          { name: "Artist", value: albumInfo.artist || artist, inline: true },
          { name: "Listeners", value: albumInfo.listeners || "Unknown", inline: true },
          { name: "Play Count", value: albumInfo.playcount || "Unknown", inline: true },
          { name: "Tags", value: tagList, inline: false }
        );

      if (albumInfo.wiki?.summary) {
        const summary = albumInfo.wiki.summary.replace(/<[^>]*>/g, '').substring(0, 200);
        embed.addFields({ name: "Summary", value: summary + (summary.length >= 200 ? "..." : ""), inline: false });
      }

      return handler.editReply({ content: " ", embeds: [embed] });
    } catch (err) {
      const embed = new EmbedBuilder()
        .setTitle("Error Fetching Album Info")
        .setDescription("There was an error fetching the album information.")
        .setColor(client.color);
      return handler.editReply({ content: " ", embeds: [embed] });
    }
  }
} 