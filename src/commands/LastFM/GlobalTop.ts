import { EmbedBuilder } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import fetch from "node-fetch";

export default class implements Command {
  public name = ["globaltop"];
  public description = "Shows global top tracks or artists from Last.fm";
  public category = "Utils";
  public accessableby = [Accessableby.Member];
  public usage = "[tracks|artists]";
  public aliases = ["lastfm-globaltop", "lfm-globaltop", "global-top"];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "type",
      description: "Show top tracks or artists",
      type: 3,
      required: false,
      choices: [
        { name: "Tracks", value: "tracks" },
        { name: "Artists", value: "artists" },
      ],
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();
    const typeRaw = handler.args[0]?.toLowerCase?.() || "tracks";
    const type = typeRaw === "artists" ? "artists" : "tracks";
    let url = "";
    if (type === "artists") {
      url = `https://ws.audioscrobbler.com/2.0/?method=chart.gettopartists&api_key=${client.config.player.LASTFM.api_key}&format=json&limit=10`;
    } else {
      url = `https://ws.audioscrobbler.com/2.0/?method=chart.gettoptracks&api_key=${client.config.player.LASTFM.api_key}&format=json&limit=10`;
    }
    try {
      const response = await fetch(url);
      const data: any = await response.json();
      if (type === "artists") {
        if (!data || !data.artists || !data.artists.artist || data.artists.artist.length === 0) {
          const embed = new EmbedBuilder()
            .setTitle("No Global Top Artists Found")
            .setDescription("Could not find any global top artists.")
            .setColor(client.color);
          return handler.editReply({ content: " ", embeds: [embed] });
        }
        const artists = Array.isArray(data.artists.artist) ? data.artists.artist : [data.artists.artist];
        const embed = new EmbedBuilder()
          .setTitle(`Global Top Artists (via Last.fm)`)
          .setColor(client.color)
          .setDescription(
            artists
              .map((artist: any, i: number) => `**${i + 1}.** [${artist.name}](${artist.url}) — ${artist.playcount} plays`)
              .join("\n")
          );
        if (artists[0]?.image?.length) {
          embed.setThumbnail(artists[0].image[artists[0].image.length - 1]['#text'] || null);
        }
        return handler.editReply({ content: " ", embeds: [embed] });
      } else {
        if (!data || !data.tracks || !data.tracks.track || data.tracks.track.length === 0) {
          const embed = new EmbedBuilder()
            .setTitle("No Global Top Tracks Found")
            .setDescription("Could not find any global top tracks.")
            .setColor(client.color);
          return handler.editReply({ content: " ", embeds: [embed] });
        }
        const tracks = Array.isArray(data.tracks.track) ? data.tracks.track : [data.tracks.track];
        const embed = new EmbedBuilder()
          .setTitle(`Global Top Tracks (via Last.fm)`)
          .setColor(client.color)
          .setDescription(
            tracks
              .map((track: any, i: number) => `**${i + 1}.** [${track.name}](${track.url}) by **${track.artist.name}** — ${track.playcount} plays`)
              .join("\n")
          );
        if (tracks[0]?.image?.length) {
          embed.setThumbnail(tracks[0].image[tracks[0].image.length - 1]['#text'] || null);
        }
        return handler.editReply({ content: " ", embeds: [embed] });
      }
    } catch (err) {
      const embed = new EmbedBuilder()
        .setTitle("Error Fetching Global Top")
        .setDescription("There was an error fetching the global top from Last.fm.")
        .setColor(client.color);
      return handler.editReply({ content: " ", embeds: [embed] });
    }
  }
} 