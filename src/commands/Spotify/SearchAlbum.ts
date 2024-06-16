import { Accessableby, Command } from "../../structures/Command.js";
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
  searchAlbum,
  getAlbumTracks,
} from "../../services/SpotifySearchService.js";

export default class implements Command {
  public name = ["spotify", "album"];
  public description = "Searches for a Spotify album";
  public category = "Spotify";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = [];
  public lavalink = false;
  public options = [
    {
      name: "query",
      type: 3, // String type
      description: "The album you want to search for",
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
      await handler.editReply({ content: "Please provide a valid album name." });
      return;
    }

    try {
      const accessToken = await getAccessToken();
      const album = await searchAlbum(query, accessToken);

      if (!album) {
        await handler.editReply({ content: "No album found with that name." });
        return;
      }

      const artists = album.artists.map((artist: any) => artist.name).join(", ");
      const releaseDate = new Date(album.release_date).toLocaleDateString();

      const embed = new EmbedBuilder()
        .setTitle(album.name)
        .setColor(client.color)
        .setThumbnail(album.images[0]?.url)
        .setDescription(`By ${artists}\nReleased on ${releaseDate}`);

      embed.addFields({
        name: "Total Tracks:",
        value: album.total_tracks ? album.total_tracks.toString() : "N/A",
        inline: true,
      });

      embed.setTimestamp();

      const listSongsButton = new ButtonBuilder()
        .setCustomId("list-songs")
        .setLabel("List Songs")
        .setStyle(ButtonStyle.Primary);

      const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(listSongsButton);

      await handler.editReply({ embeds: [embed], components: [actionRow] });

      const filter = (i: any) => i.customId === "list-songs" && i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        componentType: ComponentType.Button,
        time: 60000,
      });

      collector.on("collect", async (i: any) => {
        if (i.customId === "list-songs") {
          const tracks = await getAlbumTracks(album.id, accessToken);

          const tracksList = tracks
            .map((track) => `[${track.name}](${track.external_urls.spotify})`)
            .join("\n");

          const tracksEmbed = new EmbedBuilder()
            .setTitle(`Tracks in ${album.name}`)
            .setColor(client.color)
            .setDescription(tracksList || "No tracks available.")
            .setTimestamp();

          await i.reply({ embeds: [tracksEmbed], ephemeral: true });
        }
      });
    } catch (error) {
      console.error("Error searching Spotify album:", error);
      await handler.editReply({ content: "An error occurred while searching for the album." });
    }
  }
}
