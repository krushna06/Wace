import { User as DiscordUser } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { getUserTopArtists, getUserAllArtists } from "../../services/LastfmService.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["compare"];
  public description = "Compare your music taste with another user (Last.fm)";
  public category = "LastFM";
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
      // @ts-ignore
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
      return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: "Not Connected to Last.fm", description: "You need to connect your Last.fm account first. Use /lastfm-connect.", color: client.color })] });
    }
    if (!sessionB || !sessionB.session_key) {
      return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: "User Not Connected to Last.fm", description: `${targetUser.username} hasn't connected their Last.fm account.`, color: client.color })] });
    }

    const apiKey = client.config.player.LASTFM.api_key;
    const [allA, allB] = await Promise.all([
      getUserAllArtists(sessionA.username, apiKey),
      getUserAllArtists(sessionB.username, apiKey),
    ]);
    if (!allA.length || !allB.length) {
      return handler.editReply({ content: "Could not fetch artists for one or both users." });
    }
    const topA = allA
      .slice()
      .sort((a: any, b: any) => parseInt(b.playcount || '0', 10) - parseInt(a.playcount || '0', 10))
      .slice(0, 1000);
    const topB = allB
      .slice()
      .sort((a: any, b: any) => parseInt(b.playcount || '0', 10) - parseInt(a.playcount || '0', 10))
      .slice(0, 1000);
    const mapA = new Map(topA.map((a: any) => [a.name.toLowerCase(), a]));
    const mapB = new Map(topB.map((a: any) => [a.name.toLowerCase(), a]));
    const intersectionKeys = [...mapA.keys()].filter(x => mapB.has(x));
    const sortedCommon = intersectionKeys
      .map(key => {
        const artistA = mapA.get(key);
        const artistB = mapB.get(key);
        const playcountA = parseInt(artistA?.playcount || '0', 10);
        const playcountB = parseInt(artistB?.playcount || '0', 10);
        return {
          name: artistA?.name || key,
          playcountA,
          playcountB,
        };
      })
      .sort((a, b) => (b.playcountA + b.playcountB) - (a.playcountA + a.playcountB))
      .slice(0, 15);
    let table = 'Artist'.padEnd(16) + handler.user?.username.padStart(8) + '   ' + targetUser.username.padStart(8) + '\n';
    table += '-'.repeat(16) + ' ' + '-'.repeat(8) + '   ' + '-'.repeat(8) + '\n';
    for (const row of sortedCommon) {
      table += row.name.padEnd(16).slice(0, 16) + String(row.playcountA).padStart(8) + '   ' + String(row.playcountB).padEnd(8) + '\n';
    }
    const percent = ((intersectionKeys.length / Math.min(mapA.size, mapB.size)) * 100).toFixed(1);
    const embed = cv2.build({
      title: `Top artist comparison - ${handler.user?.username} vs ${targetUser.username}`,
      description: intersectionKeys.length > 0
        ? `${intersectionKeys.length} (${percent}%) out of top ${Math.min(mapA.size, mapB.size)} alltime match\n\n\`\`\`\n${table}\`\`\``
        : `No common artists found in your top ${Math.min(mapA.size, mapB.size)}.`,
      color: client.color,
    });
    return handler.editReply({ flags: CV2_FLAG, components: [embed] });
  }
}