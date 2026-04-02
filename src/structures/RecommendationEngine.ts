import { Manager } from "../manager.js";
import { UserRecommendations } from "../database/schema/UserRecommendations.js";
import { UserStats } from "../database/schema/UserStats.js";

export class RecommendationEngine {
  constructor(private client: Manager) {}

  async generateWeeklyRecommendations(
    userId: string,
    guildId: string
  ): Promise<void> {
    const key = `${userId}-${guildId}`;
    
    const userStats = await this.client.db.userStats.get(key);
    if (!userStats) {
      return;
    }

    const topSongs = await this.client.db.songStats.get(`${guildId}`);
    if (!topSongs) {
      return;
    }

    const recommendations = Array.isArray(topSongs)
      ? topSongs.slice(0, 20).map((song: any, index: number) => ({
          title: song.title || "Unknown",
          artist: song.author || "Unknown",
          uri: song.uri || "",
          score: 100 - index * 5,
        }))
      : [];

    let userRecs = await this.client.db.userRecommendations.get(key);
    if (!userRecs) {
      userRecs = {
        userId,
        guildId,
        weeklyRecommendations: {
          tracks: [],
          generatedAt: Date.now(),
        },
        yearlyWrapped: {
          topTracks: [],
          topArtists: [],
          topGenres: [],
          totalMinutesListened: 0,
          generatedAt: Date.now(),
        },
      };
    }

    userRecs.weeklyRecommendations = {
      tracks: recommendations,
      generatedAt: Date.now(),
    };

    await this.client.db.userRecommendations.set(key, userRecs);
  }

  async generateYearlyWrapped(userId: string, guildId: string): Promise<void> {
    const key = `${userId}-${guildId}`;
    
    const userStats = await this.client.db.userStats.get(key);
    if (!userStats) {
      return;
    }

    const topSongs = await this.client.db.songStats.get(`${guildId}`);
    
    const topTracks = Array.isArray(topSongs)
      ? topSongs.slice(0, 50).map((song: any) => ({
          title: song.title || "Unknown",
          artist: song.author || "Unknown",
          plays: song.plays || 1,
        }))
      : [];

    const artistMap = new Map<string, number>();
    topTracks.forEach((track) => {
      const current = artistMap.get(track.artist) || 0;
      artistMap.set(track.artist, current + track.plays);
    });

    const topArtists = Array.from(artistMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([name, plays]) => ({ name, plays }));

    const totalMinutesListened = Math.floor((userStats.songsPlayed || 0) * 3.5);

    let userRecs = await this.client.db.userRecommendations.get(key);
    if (!userRecs) {
      userRecs = {
        userId,
        guildId,
        weeklyRecommendations: {
          tracks: [],
          generatedAt: Date.now(),
        },
        yearlyWrapped: {
          topTracks: [],
          topArtists: [],
          topGenres: [],
          totalMinutesListened: 0,
          generatedAt: Date.now(),
        },
      };
    }

    userRecs.yearlyWrapped = {
      topTracks,
      topArtists,
      topGenres: [],
      totalMinutesListened,
      generatedAt: Date.now(),
    };

    await this.client.db.userRecommendations.set(key, userRecs);
  }
}
