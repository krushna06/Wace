import { Manager } from "../manager.js";
import { Achievement } from "../database/schema/Achievement.js";

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  condition: (stats: any) => boolean;
}

export class AchievementManager {
  private achievements: Map<string, AchievementDefinition> = new Map();

  constructor(private client: Manager) {
    this.registerAchievements();
  }

  private registerAchievements(): void {
    this.register({
      id: "first_song",
      name: "First Note",
      description: "Play your first song",
      icon: "🎵",
      points: 10,
      condition: (stats) => stats.songsPlayed >= 1,
    });

    this.register({
      id: "century",
      name: "Century Club",
      description: "Play 100 songs",
      icon: "💯",
      points: 50,
      condition: (stats) => stats.songsPlayed >= 100,
    });

    this.register({
      id: "thousand",
      name: "Thousand Strong",
      description: "Play 1000 songs",
      icon: "🏆",
      points: 200,
      condition: (stats) => stats.songsPlayed >= 1000,
    });

    this.register({
      id: "gamer",
      name: "Gamer",
      description: "Play your first game",
      icon: "🎮",
      points: 15,
      condition: (gameStats) =>
        gameStats.guessTheSong.played > 0 ||
        gameStats.artistNameGame.played > 0 ||
        gameStats.musicTrivia.played > 0,
    });

    this.register({
      id: "perfect_guesser",
      name: "Perfect Guesser",
      description: "Get 10 correct guesses in Guess The Song",
      icon: "🎯",
      points: 75,
      condition: (gameStats) => gameStats.guessTheSong.correct >= 10,
    });

    this.register({
      id: "artist_expert",
      name: "Artist Expert",
      description: "Get 10 correct guesses in Artist Name Game",
      icon: "🎤",
      points: 75,
      condition: (gameStats) => gameStats.artistNameGame.correct >= 10,
    });

    this.register({
      id: "streak_master",
      name: "Streak Master",
      description: "Get a 5-game winning streak",
      icon: "🔥",
      points: 100,
      condition: (gameStats) =>
        gameStats.guessTheSong.bestStreak >= 5 ||
        gameStats.artistNameGame.bestStreak >= 5 ||
        gameStats.musicTrivia.bestStreak >= 5,
    });

    this.register({
      id: "curator",
      name: "Curator",
      description: "Create your first playlist",
      icon: "📋",
      points: 20,
      condition: (stats) => stats.playlistsCreated >= 1,
    });

    this.register({
      id: "collector",
      name: "Collector",
      description: "Create 10 playlists",
      icon: "📚",
      points: 100,
      condition: (stats) => stats.playlistsCreated >= 10,
    });

    this.register({
      id: "sound_engineer",
      name: "Sound Engineer",
      description: "Apply 5 different filters",
      icon: "🎚️",
      points: 50,
      condition: (stats) => stats.filtersApplied >= 5,
    });

    this.register({
      id: "bass_head",
      name: "Bass Head",
      description: "Apply bass filter 20 times",
      icon: "🔊",
      points: 75,
      condition: (stats) => stats.bassFilterUsed >= 20,
    });

    this.register({
      id: "premium_member",
      name: "Premium Member",
      description: "Become a premium user",
      icon: "👑",
      points: 150,
      condition: (stats) => stats.isPremium === true,
    });

    this.register({
      id: "command_master",
      name: "Command Master",
      description: "Execute 500 commands",
      icon: "⚡",
      points: 100,
      condition: (stats) => stats.commandsExecuted >= 500,
    });

    this.register({
      id: "command_legend",
      name: "Command Legend",
      description: "Execute 2000 commands",
      icon: "⭐",
      points: 250,
      condition: (stats) => stats.commandsExecuted >= 2000,
    });
  }

  private register(achievement: AchievementDefinition): void {
    this.achievements.set(achievement.id, achievement);
  }

  async checkAndUnlock(
    userId: string,
    guildId: string,
    stats: any,
    gameStats?: any
  ): Promise<AchievementDefinition[]> {
    const key = `${userId}-${guildId}`;
    let achievements = await this.client.db.achievement.get(key);

    if (!achievements) {
      achievements = {
        userId,
        guildId,
        achievements: {},
        totalPoints: 0,
      };
    }

    const unlockedAchievements: AchievementDefinition[] = [];

    for (const [id, achievement] of this.achievements) {
      if (achievements.achievements[id]) continue;

      const combinedStats = { ...stats, ...gameStats };
      if (achievement.condition(combinedStats)) {
        achievements.achievements[id] = {
          unlockedAt: Date.now(),
        };
        achievements.totalPoints += achievement.points;
        unlockedAchievements.push(achievement);
      }
    }

    if (unlockedAchievements.length > 0) {
      await this.client.db.achievement.set(key, achievements);
    }

    return unlockedAchievements;
  }

  getAchievement(id: string): AchievementDefinition | undefined {
    return this.achievements.get(id);
  }

  getAllAchievements(): AchievementDefinition[] {
    return Array.from(this.achievements.values());
  }
}
