import { EmbedBuilder } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { getTrackInfo, getUserRecentTracks } from "../../services/LastfmService.js";

export default class implements Command {
  public name = ["trackinfo"];
  public description = "Shows info about the currently playing track";
  public category = "LastFM";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = ["track-info", "lastfm-track-info"];
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

      if (!nowPlaying || !nowPlaying.name || !nowPlaying.artist?.['#text']) {
        const embed = new EmbedBuilder()
          .setTitle("No Track Playing")
          .setDescription("You are not currently playing any track on Last.fm.")
          .setColor(client.color);
        return handler.editReply({ content: " ", embeds: [embed] });
      }

      const track = nowPlaying.name;
      const artist = nowPlaying.artist['#text'];
      
      const trackData: any = await getTrackInfo(artist, track, apiKey, session.username);
      
      if (!trackData || !trackData.track) {
        const embed = new EmbedBuilder()
          .setTitle("Track Not Found")
          .setDescription(`Could not find information for "${track}" by ${artist}`)
          .setColor(client.color);
        return handler.editReply({ content: " ", embeds: [embed] });
      }

      const trackInfo = trackData.track;
      const tags = trackInfo.toptags?.tag?.slice(0, 5) || [];
      const tagList = tags.length > 0 ? tags.map((tag: any) => tag.name).join(", ") : "No tags available";
      
      const embed = new EmbedBuilder()
        .setTitle(`Track Info: ${trackInfo.name}`)
        .setURL(trackInfo.url)
        .setColor(client.color)
        .setThumbnail(trackInfo.album?.image?.[trackInfo.album.image.length - 1]?.['#text'] || trackInfo.image?.[trackInfo.image.length - 1]?.['#text'] || null)
        .addFields(
          { name: "Artist", value: trackInfo.artist?.name || artist, inline: true },
          { name: "Album", value: trackInfo.album?.title || "Unknown", inline: true },
          { name: "Duration", value: trackInfo.duration ? `${Math.floor(trackInfo.duration / 60)}:${(trackInfo.duration % 60).toString().padStart(2, '0')}` : "Unknown", inline: true },
          { name: "Listeners", value: trackInfo.listeners || "Unknown", inline: true },
          { name: "Play Count", value: trackInfo.playcount || "Unknown", inline: true },
          { name: "Tags", value: tagList, inline: false }
        );

      if (trackInfo.wiki?.summary) {
        const summary = trackInfo.wiki.summary.replace(/<[^>]*>/g, '').substring(0, 300);
        embed.addFields({ name: "Summary", value: summary + (summary.length >= 300 ? "..." : ""), inline: false });
      }

      return handler.editReply({ content: " ", embeds: [embed] });
    } catch (err) {
      const embed = new EmbedBuilder()
        .setTitle("Error Fetching Track Info")
        .setDescription("There was an error fetching the track information.")
        .setColor(client.color);
      return handler.editReply({ content: " ", embeds: [embed] });
    }
  }
} 