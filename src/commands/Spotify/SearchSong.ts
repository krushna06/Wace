import { Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import {
  EmbedBuilder,
  CommandInteraction,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ComponentType,
  CommandInteractionOptionResolver,
} from "discord.js";
import {
  getAccessToken,
  searchSong,
  getAlbumTracks,
  getSimilarTracks,
} from "../../services/SpotifySearchService.js";

export default class implements Command {
  public name = ["spotify", "song"];
  public description = "Searches for a Spotify song";
  public category = "Spotify";
  public accessableby = [];
  public usage = "";
  public aliases = [];
  public lavalink = false;
  public options = [
    {
      name: "query",
      type: 3, // String type
      description: "The song you want to search for",
      required: true,
    },
  ];
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const interaction = handler.interaction as CommandInteraction;
    const query = (interaction.options as CommandInteractionOptionResolver).getString("query");

    if (!query) {
      await handler.editReply({ content: "Please provide a valid song name." });
      return;
    }

    try {
      const accessToken = await getAccessToken();
      const tracks = await searchSong(query, accessToken);

      if (!tracks || tracks.length === 0) {
        await handler.editReply({ content: "No tracks found with that name." });
        return;
      }

      const track = tracks[0]; // Assuming we take the first track in the search results
      const artists = track.artists.map((artist) => artist.name).join(", ");
      const releaseDate = new Date(track.album.release_date).toLocaleDateString();

      const embed = new EmbedBuilder()
        .setTitle(track.name)
        .setColor(client.color)
        .setThumbnail(track.album.images[0]?.url)
        .setDescription(`By ${artists}\nReleased on ${releaseDate}`);

      embed.addFields(
        {
          name: "Album:",
          value: `**From the album: [${track.album.name}](${track.album.external_urls.spotify})**`,
        },
        {
          name: "Total Tracks:",
          value: track.album.total_tracks ? track.album.total_tracks.toString() : "N/A",
          inline: true,
        }
      );

      embed.setTimestamp();

      const listTracksButton = new ButtonBuilder()
        .setCustomId("list-tracks")
        .setLabel("List Album Tracks")
        .setStyle(ButtonStyle.Primary);

      const similarSongsButton = new ButtonBuilder()
        .setCustomId("similar-songs")
        .setLabel("Similar Songs")
        .setStyle(ButtonStyle.Secondary);

      const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        listTracksButton,
        similarSongsButton
      );

      await handler.editReply({ embeds: [embed], components: [actionRow] });

      const filter = (i: any) =>
        ["list-tracks", "similar-songs"].includes(i.customId) && i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        componentType: ComponentType.Button,
        time: 60000,
      });

      collector.on("collect", async (i: any) => {
        if (i.customId === "list-tracks") {
          const albumId = track.album.id;
          const albumTracks = await getAlbumTracks(albumId, accessToken);

          const tracksList = albumTracks
            .map((track) => `[${track.name}](${track.external_urls.spotify})`)
            .join("\n");

          const tracksEmbed = new EmbedBuilder()
            .setTitle(`Tracks in ${track.album.name}`)
            .setColor(client.color)
            .setDescription(tracksList || "No tracks available.")
            .setTimestamp();

          await i.reply({ embeds: [tracksEmbed], ephemeral: true });
        } else if (i.customId === "similar-songs") {
          const similarTracks = await getSimilarTracks(track.id, accessToken);

          const similarTracksList = similarTracks
            .map((similarTrack) => `[${similarTrack.name}](${similarTrack.external_urls.spotify})`)
            .join("\n");

          const similarTracksEmbed = new EmbedBuilder()
            .setTitle(`Songs similar to ${track.name}`)
            .setColor(client.color)
            .setDescription(similarTracksList || "No similar tracks available.")
            .setTimestamp();

          await i.reply({ embeds: [similarTracksEmbed], ephemeral: true });
        }
      });
    } catch (error) {
      console.error("Error searching Spotify song:", error);
      await handler.editReply({ content: "An error occurred while searching for the song." });
    }
  }
}
