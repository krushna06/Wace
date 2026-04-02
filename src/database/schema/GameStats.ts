export interface GameStats {
  userId: string;
  guildId: string;
  guessTheSong: {
    played: number;
    correct: number;
    streak: number;
    bestStreak: number;
  };
  artistNameGame: {
    played: number;
    correct: number;
    streak: number;
    bestStreak: number;
  };
  musicTrivia: {
    played: number;
    correct: number;
    streak: number;
    bestStreak: number;
  };
}
