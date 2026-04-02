export interface Achievement {
  userId: string;
  guildId: string;
  achievements: {
    [key: string]: {
      unlockedAt: number;
      progress?: number;
    };
  };
  totalPoints: number;
}
