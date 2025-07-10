import { EmbedBuilder } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import fetch from "node-fetch";

export default class implements Command {
  public name = ["recent"];
  public description = "Show your 5 most recently played tracks (via Last.fm)";
  public category = "Utils";
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
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(session.username)}&api_key=${apiKey}&sk=${session.session_key}&format=json&limit=5`;
    try {
      const response = await fetch(url);
      const data: any = await response.json();
      if (!data || !data.recenttracks || !data.recenttracks.track || data.recenttracks.track.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle("No Recent Tracks")
          .setDescription("You have not played any tracks recently on Last.fm.")
          .setColor(client.color);
        return handler.editReply({ content: " ", embeds: [embed] });
      }
      const tracks = Array.isArray(data.recenttracks.track) ? data.recenttracks.track : [data.recenttracks.track];
      const embed = new EmbedBuilder()
        .setTitle(`Your 5 Most Recent Tracks (via Last.fm)`)
        .setColor(client.color)
        .setDescription(
          tracks
            .map((track: any, i: number) => {
              const nowPlaying = track["@attr"] && track["@attr"].nowplaying === "true";
              return `**${i + 1}.** [${track.name}](${track.url}) by **${track.artist['#text']}**${nowPlaying ? " _(Now Playing)_" : ""}`;
            })
            .join("\n")
        );
      if (tracks[0]?.image?.length) {
        embed.setThumbnail(tracks[0].image[tracks[0].image.length - 1]['#text'] || null);
      }
      return handler.editReply({ content: " ", embeds: [embed] });
    } catch (err) {
      const embed = new EmbedBuilder()
        .setTitle("Error Fetching Recent Tracks")
        .setDescription("There was an error fetching your recent tracks from Last.fm.")
        .setColor(client.color);
      return handler.editReply({ content: " ", embeds: [embed] });
    }
  }
} 