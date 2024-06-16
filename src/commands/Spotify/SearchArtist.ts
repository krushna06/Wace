import { Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import {
  EmbedBuilder,
  CommandInteraction,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  CommandInteractionOptionResolver,
  ComponentType,
  MessageActionRowComponentBuilder,
} from "discord.js";
import {
  getAccessToken,
  searchArtists,
  getPopularSongs,
  getTotalSongs,
  getTotalAlbums,
} from "../../services/SpotifySearchService.js";

export default class implements Command {
  public name = ["spotify", "artist"];
  public description = "Searches for a Spotify artist";
  public category = "Spotify";
  public accessableby = [];
  public usage = "";
  public aliases = [];
  public lavalink = false;
  public options = [
    {
      name: "query",
      type: 3, // String type
      description: "The artist you want to search for",
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
      await handler.editReply({ content: "Please provide a valid artist name." });
      return;
    }

    try {
      const accessToken = await getAccessToken();
      const artists = await searchArtists(query, accessToken);

      if (artists.length === 0) {
        await handler.editReply({ content: "No artists found with that name." });
        return;
      }

      let currentIndex = 0;

      const updateArtistEmbed = async (index: number) => {
        const artist = artists[index];
        const totalSongs = await getTotalSongs(artist.id, accessToken);
        const totalAlbums = await getTotalAlbums(artist.id, accessToken);

        const embed = new EmbedBuilder()
          .setTitle(artist.name)
          .setColor(client.color)
          .setThumbnail(artist.images[0]?.url || "")
          .setTimestamp()
          .addFields(
            { name: "Followers", value: artist.followers.total.toLocaleString(), inline: true },
            { name: "Total Songs", value: totalSongs.toLocaleString(), inline: true },
            { name: "Total Albums", value: totalAlbums.toLocaleString(), inline: true },
            { name: "Spotify", value: `[Link](${artist.external_urls.spotify})`, inline: true }
          );

        const buttons = [
          new ButtonBuilder()
            .setCustomId("prev_artist")
            .setLabel("⬅️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(index === 0),
          new ButtonBuilder()
            .setCustomId("home_artist")
            .setLabel("🏠")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("next_artist")
            .setLabel("➡️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(index === artists.length - 1),
          new ButtonBuilder()
            .setCustomId(`popular_songs_${artist.id}`)
            .setLabel("Popular Songs")
            .setStyle(ButtonStyle.Primary),
        ];

        const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(buttons);

        await handler.editReply({ embeds: [embed], components: [row] });
      };

      await updateArtistEmbed(currentIndex);

      const filter = (i: any) => i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 60000,
      });

      collector.on("collect", async (i) => {
        if (i.customId.startsWith("popular_songs_")) {
          const artistId = i.customId.split("_")[2];
          const songs = await getPopularSongs(artistId, accessToken);
          if (songs.length === 0) {
            await i.reply({ content: "No popular songs found for this artist.", ephemeral: true });
            return;
          }
          const songsEmbed = new EmbedBuilder()
            .setTitle(`Popular Songs by ${artists[currentIndex].name}`)
            .setColor(client.color)
            .setDescription(songs.map((song, index) => `${index + 1}. ${song.name}`).join("\n"))
            .setTimestamp();
          await i.reply({ embeds: [songsEmbed], ephemeral: true });
        } else if (i.customId === "prev_artist" || i.customId === "next_artist") {
          if (i.customId === "prev_artist" && currentIndex > 0) {
            currentIndex--;
          } else if (i.customId === "next_artist" && currentIndex < artists.length - 1) {
            currentIndex++;
          }
          await updateArtistEmbed(currentIndex);
          await i.deferUpdate();
        } else if (i.customId === "home_artist") {
          currentIndex = 0;
          await updateArtistEmbed(currentIndex);
          await i.deferUpdate();
        }
      });
    } catch (error) {
      console.error("Error searching Spotify artist:", error);
      await handler.editReply({ content: "An error occurred while searching for the artist." });
    }
  }
}
