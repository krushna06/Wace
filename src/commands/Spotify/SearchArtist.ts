import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import {
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
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["spotify", "artist"];
  public description = "Searches for a Spotify artist";
  public category = "Spotify";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = [];
  public lavalink = false;
  public options = [
    {
      name: "query",
      type: 3,
      description: "The artist you want to search for",
      required: true,
    },
  ];
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  public async execute(client: Manager, handler: CommandHandler) {
      try {
        await handler.deferReply();

        const interaction = handler.interaction as CommandInteraction;
        // @ts-ignore
        const query = (interaction.options as CommandInteractionOptionResolver).getString("query");

        if (!query) { await handler.editReply({ content: "Please provide a valid artist name." }); return; }

        const accessToken = await getAccessToken();
        const artists = await searchArtists(query, accessToken);

        if (artists.length === 0) { await handler.editReply({ content: "No artists found with that name." }); return; }

        let currentIndex = 0;

        const updateArtistEmbed = async (index: number) => {
          const artist = artists[index];
          const totalSongs = await getTotalSongs(artist.id, accessToken);
          const totalAlbums = await getTotalAlbums(artist.id, accessToken);

          const buttons = [
            new ButtonBuilder().setCustomId("prev_artist").setLabel("⬅️").setStyle(ButtonStyle.Secondary).setDisabled(index === 0),
            new ButtonBuilder().setCustomId("home_artist").setLabel("🏠").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("next_artist").setLabel("➡️").setStyle(ButtonStyle.Secondary).setDisabled(index === artists.length - 1),
            new ButtonBuilder().setCustomId(`popular_songs_${artist.id}`).setLabel("Popular Songs").setStyle(ButtonStyle.Primary),
          ];
          const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(buttons);

          await handler.editReply({
            flags: CV2_FLAG,
            components: [
              cv2.build({
                title: artist.name,
                thumbnail: artist.images[0]?.url || "",
                color: client.color,
                timestamp: true,
                fields: [
                  { name: "Followers", value: artist.followers.total.toLocaleString(), inline: true },
                  { name: "Total Songs", value: totalSongs.toLocaleString(), inline: true },
                  { name: "Total Albums", value: totalAlbums.toLocaleString(), inline: true },
                  { name: "Spotify", value: `[Link](${artist.external_urls.spotify})`, inline: true },
                ],
                components: [row],
              }),
            ],
          });
        };

        await updateArtistEmbed(currentIndex);

        const filter = (i: any) => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on("collect", async (i) => {
          if (i.customId.startsWith("popular_songs_")) {
            const artistId = i.customId.split("_")[2];
            const songs = await getPopularSongs(artistId, accessToken);
            if (songs.length === 0) { await i.reply({ content: "No popular songs found for this artist.", ephemeral: true }); return; }
            await i.reply({ flags: CV2_FLAG, components: [cv2.build({ title: `Popular Songs by ${artists[currentIndex].name}`, description: songs.map((song, index) => `${index + 1}. ${song.name}`).join("\n"), color: client.color, timestamp: true })], ephemeral: true });
          } else if (i.customId === "prev_artist" || i.customId === "next_artist") {
            if (i.customId === "prev_artist" && currentIndex > 0) currentIndex--;
            else if (i.customId === "next_artist" && currentIndex < artists.length - 1) currentIndex++;
            await updateArtistEmbed(currentIndex);
            await i.deferUpdate();
          } else if (i.customId === "home_artist") {
            currentIndex = 0;
            await updateArtistEmbed(currentIndex);
            await i.deferUpdate();
          }
        });
      } catch (error: any) {
        if (error?.code === 10062) { client.logger.warn("SearchArtist", "Interaction expired (took too long to respond)"); return; }
        client.logger.error("SearchArtist", error);
      }
    }
}