import { EmbedBuilder } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import fetch from "node-fetch";

export default class implements Command {
  public name = ["cover"];
  public description = "Displays the album cover of the currently playing or most recent track (via Last.fm)";
  public category = "Utils";
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
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(session.username)}&api_key=${apiKey}&sk=${session.session_key}&format=json&limit=1`;
    try {
      const response = await fetch(url);
      const data: any = await response.json();
      if (!data || !data.recenttracks || !data.recenttracks.track) {
        const embed = new EmbedBuilder()
          .setTitle("No Track Found")
          .setDescription("You are not currently playing any track on Last.fm.")
          .setColor(client.color);
        return handler.editReply({ content: " ", embeds: [embed] });
      }
      let track = null;
      const tracks = data.recenttracks.track;
      if (Array.isArray(tracks)) {
        track = tracks.find((t) => t["@attr"] && t["@attr"].nowplaying === "true") || tracks[0];
      } else {
        track = tracks;
      }
      const albumCover = track?.image?.[track.image.length - 1]?.['#text'] || null;
      if (albumCover) {
        const embed = new EmbedBuilder()
          .setTitle(`Album Cover: ${track.name}`)
          .setDescription(`by **${track.artist['#text']}**${track.album['#text'] ? `\nAlbum: **${track.album['#text']}**` : ''}`)
          .setImage(albumCover)
          .setColor(client.color)
          .setURL(track.url || null);
        return handler.editReply({ content: " ", embeds: [embed] });
      } else {
        const embed = new EmbedBuilder()
          .setTitle("No Album Cover Found")
          .setDescription("Could not find an album cover for your current or recent track.")
          .setColor(client.color);
        return handler.editReply({ content: " ", embeds: [embed] });
      }
    } catch (err) {
      const embed = new EmbedBuilder()
        .setTitle("Error Fetching Album Cover")
        .setDescription("There was an error fetching your album cover from Last.fm.")
        .setColor(client.color);
      return handler.editReply({ content: " ", embeds: [embed] });
    }
  }
} 