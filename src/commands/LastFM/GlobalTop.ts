import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { getGlobalTopArtists, getGlobalTopTracks } from "../../services/LastfmService.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["globaltop"];
  public description = "Shows global top tracks or artists from Last.fm";
  public category = "LastFM";
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
      let data;
      if (type === "artists") data = await getGlobalTopArtists(client.config.player.LASTFM.api_key, 10);
      else data = await getGlobalTopTracks(client.config.player.LASTFM.api_key, 10);

      try {
        if (type === "artists") {
          if (!data?.artists?.artist?.length)
            return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: "No Global Top Artists Found", description: "Could not find any global top artists.", color: client.color })] });
          const artists = Array.isArray(data.artists.artist) ? data.artists.artist : [data.artists.artist];
          return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: "Global Top Artists (via Last.fm)", description: artists.map((a: any, i: number) => `**${i + 1}.** [${a.name}](${a.url}) — ${a.playcount} plays`).join("\n"), thumbnail: artists[0]?.image?.length ? artists[0].image[artists[0].image.length - 1]['#text'] : undefined, color: client.color })] });
        } else {
          if (!data?.tracks?.track?.length)
            return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: "No Global Top Tracks Found", description: "Could not find any global top tracks.", color: client.color })] });
          const tracks = Array.isArray(data.tracks.track) ? data.tracks.track : [data.tracks.track];
          return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: "Global Top Tracks (via Last.fm)", description: tracks.map((t: any, i: number) => `**${i + 1}.** [${t.name}](${t.url}) by **${t.artist.name}** — ${t.playcount} plays`).join("\n"), thumbnail: tracks[0]?.image?.length ? tracks[0].image[tracks[0].image.length - 1]['#text'] : undefined, color: client.color })] });
        }
      } catch (err) {
        return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: "Error Fetching Global Top", description: "There was an error fetching the global top from Last.fm.", color: client.color })] });
      }
    }
}