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
  searchSong,
  getAlbumTracks,
  getSimilarTracks,
} from "../../services/SpotifySearchService.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["spotify", "track"];
  public description = "Searches for a Spotify song";
  public category = "Spotify";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = [];
  public lavalink = false;
  public options = [
    {
      name: "query",
      type: 3,
      description: "The song you want to search for",
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

        if (!query) { await handler.editReply({ content: "Please provide a valid song name." }); return; }

        const accessToken = await getAccessToken();
        const tracks = await searchSong(query, accessToken);

        if (!tracks || tracks.length === 0) { await handler.editReply({ content: "No tracks found with that name." }); return; }

        const track = tracks[0];
        const artists = track.artists.map((artist) => artist.name).join(", ");
        const releaseDate = new Date(track.album.release_date).toLocaleDateString();

        const listTracksButton = new ButtonBuilder().setCustomId("list-tracks").setLabel("List Album Tracks").setStyle(ButtonStyle.Primary);
        const similarSongsButton = new ButtonBuilder().setCustomId("similar-songs").setLabel("Similar Songs").setStyle(ButtonStyle.Secondary);
        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(listTracksButton, similarSongsButton);

        await handler.editReply({
          flags: CV2_FLAG,
          components: [
            cv2.build({
              title: track.name,
              thumbnail: track.album.images[0]?.url,
              description: `By ${artists}\nReleased on ${releaseDate}`,
              color: client.color,
              timestamp: true,
              fields: [
                { name: "Album:", value: `**From the album: [${track.album.name}](${track.album.external_urls.spotify})**` },
                { name: "Total Tracks:", value: track.album.total_tracks ? track.album.total_tracks.toString() : "N/A", inline: true },
              ],
            }),
            actionRow,
          ],
        });

        const filter = (i: any) => ["list-tracks", "similar-songs"].includes(i.customId) && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 60000 });

        collector.on("collect", async (i: any) => {
          if (i.customId === "list-tracks") {
            const albumTracks = await getAlbumTracks(track.album.id, accessToken);
            const tracksList = albumTracks.map((t) => `[${t.name}](${t.external_urls.spotify})`).join("\n");
            await i.reply({ flags: CV2_FLAG, components: [cv2.build({ title: `Tracks in ${track.album.name}`, description: tracksList || "No tracks available.", color: client.color, timestamp: true })], ephemeral: true });
          } else if (i.customId === "similar-songs") {
            const similarTracks = await getSimilarTracks(track.id, accessToken);
            const similarTracksList = similarTracks.map((t) => `[${t.name}](${t.external_urls.spotify})`).join("\n");
            await i.reply({ flags: CV2_FLAG, components: [cv2.build({ title: `Songs similar to ${track.name}`, description: similarTracksList || "No similar tracks available.", color: client.color, timestamp: true })], ephemeral: true });
          }
        });
      } catch (error: any) {
        if (error?.code === 10062) { client.logger.warn("SearchSong", "Interaction expired (took too long to respond)"); return; }
        client.logger.error("SearchSong", error);
      }
    }
}