import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import {
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
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

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
      type: 3,
      description: "The album you want to search for",
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

        if (!query) { await handler.editReply({ content: "Please provide a valid album name." }); return; }

        const accessToken = await getAccessToken();
        const album = await searchAlbum(query, accessToken);

        if (!album) { await handler.editReply({ content: "No album found with that name." }); return; }

        const artists = album.artists.map((artist: any) => artist.name).join(", ");
        const releaseDate = new Date(album.release_date).toLocaleDateString();

        const listSongsButton = new ButtonBuilder().setCustomId("list-songs").setLabel("List Songs").setStyle(ButtonStyle.Primary);
        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(listSongsButton);

        await handler.editReply({
          flags: CV2_FLAG,
          components: [
            cv2.build({
              title: album.name,
              thumbnail: album.images[0]?.url,
              description: `By ${artists}\nReleased on ${releaseDate}`,
              color: client.color,
              timestamp: true,
              fields: [{ name: "Total Tracks:", value: album.total_tracks ? album.total_tracks.toString() : "N/A", inline: true }],
            }),
            actionRow,
          ],
        });

        const filter = (i: any) => i.customId === "list-songs" && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 60000 });

        collector.on("collect", async (i: any) => {
          if (i.customId === "list-songs") {
            const tracks = await getAlbumTracks(album.id, accessToken);
            const tracksList = tracks.map((track) => `[${track.name}](${track.external_urls.spotify})`).join("\n");
            await i.reply({ flags: CV2_FLAG, components: [cv2.build({ title: `Tracks in ${album.name}`, description: tracksList || "No tracks available.", color: client.color, timestamp: true })], ephemeral: true });
          }
        });
      } catch (error: any) {
        if (error?.code === 10062) { client.logger.warn("SearchAlbum", "Interaction expired (took too long to respond)"); return; }
        client.logger.error("SearchAlbum", error);
      }
    }
}