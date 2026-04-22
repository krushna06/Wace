import { ApplicationCommandOptionType } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Lyricist } from "@execaman/lyricist";
import { getLyrics } from "genius-lyrics-api";
import { ConfigDataService } from "../../services/ConfigDataService.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["lyrics"];
  public description = "Make the bot join the voice channel.";
  public category = "Music";
  public accessableby = [Accessableby.Member];
  public usage = "Display lyrics of the song";
  public aliases = ["ly"];
  public lavalink = true;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "search",
      description: "The song name",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();
    const configService = new ConfigDataService();
    const config = configService.data;
    const geniusConfig = config.player.GENIUS;

    let lyricsRes = null;
    let query = handler.args.join(" ");
    let title = "";
    let artist = "";

    if (query.length == 0) {
      const player = client.players.get(String(handler.guild?.id));
      if (player && player.current) {
        title = player.current.title || "";
        artist = player.current.author || "";
      }
      if (!title || !artist) {
        return handler.editReply({
          flags: CV2_FLAG,
          components: [cv2.simple(`No song is currently playing, or missing title/artist info. Please use /lyrics search <title> <artist>.`, client.color)],
        });
      }
    } else {
      const split = query.split(" - ");
      if (split.length < 2) {
        return handler.editReply({
          flags: CV2_FLAG,
          components: [cv2.simple(`Please provide both the song title and artist, separated by a dash. Example: /lyrics search Shape of You - Ed Sheeran`, client.color)],
        });
      }
      title = split[0].trim();
      artist = split.slice(1).join("-").trim();
      if (!title || !artist) {
        return handler.editReply({
          flags: CV2_FLAG,
          components: [cv2.simple(`Please provide both the song title and artist. Example: /lyrics search Shape of You - Ed Sheeran`, client.color)],
        });
      }
    }

    if (geniusConfig && geniusConfig.enable && geniusConfig.api_key) {
      try {
        const options = {
          apiKey: geniusConfig.api_key,
          title: title,
          artist: artist,
          optimizeQuery: true,
        };
        lyricsRes = await getLyrics(options);
      } catch (err) {
        lyricsRes = null;
      }
    }

    if (!lyricsRes) {
      try {
        const lyrics = new Lyricist({
          plugins: [],
          saveLastResult: false,
        });
        const result = await lyrics.fetch(query, 3);
        lyricsRes = result.lyrics;
      } catch (err) {
        lyricsRes = null;
      }
    }

    if (!lyricsRes) {
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.music", "lyrics_notfound")}`, client.color)],
      });
    }

    if (lyricsRes) {
      const match = lyricsRes.match(/(\[[A-Za-z0-9''\- ]+\][\s\S]*)/);
      if (match && match[1]) {
        lyricsRes = match[1].trim();
      }
    }

    let description = `${lyricsRes}\n\nNot the correct lyrics?\n Try \`/lyrics song_name author_name\``;

    if (lyricsRes.length > 4096) {
      description = `${client.i18n.get(handler.language, "command.music", "lyrics_toolong")}`;
    }

    return handler.editReply({
      flags: CV2_FLAG,
      components: [cv2.build({
        title: `${client.i18n.get(handler.language, "command.music", "lyrics_title", { song: query })}`,
        description,
        color: client.color,
        timestamp: true,
      })],
    });
  }
}
