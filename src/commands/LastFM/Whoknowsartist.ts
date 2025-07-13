import { EmbedBuilder } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { getUserRecentTracks, getArtistInfo } from "../../services/LastfmService.js";

function chunk<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timeout")), ms);
    promise.then((val) => {
      clearTimeout(timer);
      resolve(val);
    }, (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export default class implements Command {
  public name = ["whoknowsartist"];
  public description = "Shows users in the server who listened to the current artist the most (Top 10)";
  public category = "LastFM";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = ["wka", "whoknows", "whoknows-artist"];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();
    
    const discordId = handler.user?.id;
    if (!discordId) {
      return handler.editReply({ content: "Could not determine your Discord user ID." });
    }
    
    const session = await client.db.lastfmSession.get(discordId);
    if (!session || !session.session_key) {
      return handler.editReply({ content: "You need to connect your Last.fm account first. Use /lastfm-connect." });
    }
    
    const apiKey = client.config.player.LASTFM.api_key;
    
    const tracksData: any = await getUserRecentTracks(session.username, apiKey, 1, session.session_key);
    const tracks = tracksData.recenttracks.track;
    let nowPlaying = null;
    if (Array.isArray(tracks)) {
      nowPlaying = tracks.find((t) => t["@attr"] && t["@attr"].nowplaying === "true");
    } else if (tracks && tracks["@attr"] && tracks["@attr"].nowplaying === "true") {
      nowPlaying = tracks;
    }
    
    if (!nowPlaying || !nowPlaying.artist?.['#text']) {
      return handler.editReply({ content: "You are not currently playing any track on Last.fm." });
    }
    
    const artist = nowPlaying.artist['#text'];
    
    const guild = handler.guild;
    if (!guild) {
      return handler.editReply({ content: "This command can only be used in a server." });
    }
    
    let allSessions: { id: string; value: { discord_id: string; session_key: string; username: string; expires?: number } }[];
    try {
      allSessions = await withTimeout(client.db.lastfmSession.all(), 10000);
    } catch (err) {
      return handler.editReply({ content: "Error accessing Last.fm data. Please try again." });
    }
    
    const guildSessions = allSessions.filter(s => {
      const member = guild.members.cache.get(s.id);
      return member !== undefined;
    });
    
    if (guildSessions.length === 0) {
      return handler.editReply({ content: "No users in this server have connected their Last.fm accounts." });
    }
    
    const results: { userId: string, username: string, avatar: string, playcount: number }[] = [];
    const chunks = chunk(guildSessions, 3);
    
    let timedOut = false;
    try {
      await withTimeout((async () => {
        
        for (let i = 0; i < chunks.length; i++) {
          const group = chunks[i];
          
          await Promise.all(group.map(async (s) => {
            const member = guild.members.cache.get(s.id);
            if (!member) {
              return;
            }
            
            try {
              const artistInfo: any = await getArtistInfo(artist, apiKey, s.value.username);
              
              const playcount = parseInt(artistInfo?.artist?.stats?.userplaycount || "0", 10);
              
              if (playcount > 0) {
                results.push({
                  userId: member.id,
                  username: member.user.username,
                  avatar: member.user.displayAvatarURL({ size: 64 }),
                  playcount
                });
              }
            } catch (err) {
            }
          }));
          
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
      })(), 30000);
      
    } catch (err) {
      timedOut = true;
    }
    
    if (timedOut) {
      const embed = new EmbedBuilder()
        .setTitle(`Who Knows: ${artist}`)
        .setDescription("Sorry, this command took too long to complete. Please try again later or with a more popular artist.")
        .setColor(client.color);
      return handler.editReply({ embeds: [embed] });
    }
    
    if (results.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle(`Who Knows: ${artist}`)
        .setDescription("No one in this server has listened to this artist yet!")
        .setColor(client.color);
      return handler.editReply({ embeds: [embed] });
    }
    
    results.sort((a, b) => b.playcount - a.playcount);
    const top10 = results.slice(0, 10);
    
    const embed = new EmbedBuilder()
      .setTitle(`Who Knows: ${artist}`)
      .setColor(client.color)
      .setDescription(
        top10
          .map((r, i) => `**${i + 1}.** <@${r.userId}> — **${r.playcount}** plays`)
          .join("\n")
      );
    
    if (top10[0]?.avatar) {
      embed.setThumbnail(top10[0].avatar);
    }
    
    await handler.editReply({ embeds: [embed] });
  }
} 