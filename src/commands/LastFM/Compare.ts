import { EmbedBuilder, User as DiscordUser } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { getUserTopArtists } from "../../services/LastfmService.js";

export default class implements Command {
  public name = ["compare"];
  public description = "Compare your music taste with another user (Last.fm)";
  public category = "Utils";
  public accessableby = [Accessableby.Member];
  public usage = "@user";
  public aliases = ["lastfm-compare", "lfm-compare"];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "user",
      description: "The user to compare with",
      type: 6,
      required: true,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();
    const discordId = handler.user?.id;
    if (!discordId) {
      return handler.editReply({ content: "Could not determine your Discord user ID." });
    }

    let targetUser: DiscordUser | undefined = undefined;
    if (handler.interaction) {
      const userOption = handler.interaction.options?.get('user');
      if (userOption && userOption.user) targetUser = userOption.user as DiscordUser;
    } else if (handler.args[0]) {
      const mention = await handler.parseMentions(handler.args[0]);
      if (mention.type === 1 && mention.data) targetUser = mention.data as DiscordUser;
    }
    if (!targetUser) {
      return handler.editReply({ content: "Please mention a user to compare with." });
    }

    const [sessionA, sessionB] = await Promise.all([
      client.db.lastfmSession.get(discordId),
      client.db.lastfmSession.get(targetUser.id),
    ]);

    if (!sessionA || !sessionA.session_key) {
      const embed = new EmbedBuilder()
        .setTitle("Not Connected to Last.fm")
        .setDescription("You need to connect your Last.fm account first. Use /lastfm-connect.")
        .setColor(client.color);
      return handler.editReply({ content: " ", embeds: [embed] });
    }
    if (!sessionB || !sessionB.session_key) {
      const embed = new EmbedBuilder()
        .setTitle("User Not Connected to Last.fm")
        .setDescription(`${targetUser.username} hasn't connected their Last.fm account.`)
        .setColor(client.color);
      return handler.editReply({ content: " ", embeds: [embed] });
    }

    const apiKey = client.config.player.LASTFM.api_key;
    const [topA, topB] = await Promise.all([
      getUserTopArtists(sessionA.username, apiKey, "overall", 20, sessionA.session_key),
      getUserTopArtists(sessionB.username, apiKey, "overall", 20, sessionB.session_key),
    ]);
    const artistsA = Array.isArray((topA as any)?.topartists?.artist) ? (topA as any).topartists.artist : [(topA as any)?.topartists?.artist].filter(Boolean);
    const artistsB = Array.isArray((topB as any)?.topartists?.artist) ? (topB as any).topartists.artist : [(topB as any)?.topartists?.artist].filter(Boolean);
    if (!artistsA.length || !artistsB.length) {
      return handler.editReply({ content: "Could not fetch top artists for one or both users." });
    }
    const mapA = new Map(artistsA.map((a: any) => [a.name.toLowerCase(), a]));
    const mapB = new Map(artistsB.map((a: any) => [a.name.toLowerCase(), a]));
    const intersectionKeys = [...mapA.keys()].filter(x => mapB.has(x));
    const percent = ((intersectionKeys.length / Math.min(mapA.size, mapB.size)) * 100).toFixed(1);
    const embed = new EmbedBuilder()
      .setTitle(`Music Taste Comparison: ${handler.user?.username} vs ${targetUser.username}`)
      .setDescription(
        intersectionKeys.length > 0
          ? `You have **${intersectionKeys.length}** artists in common out of 20.\n**${percent}%** similarity!\n\n**Common Artists:**\n${intersectionKeys.map((key, i) => {
              const artist = (mapA.get(key) || mapB.get(key)) as any;
              return `**${i + 1}.** [${artist.name}](${artist.url})`;
            }).join("\n")}`
          : `No common top artists found in your top 20.\nSimilarity: **0%**`
      )
      .setColor(client.color);
    return handler.editReply({ content: " ", embeds: [embed] });
  }
} 