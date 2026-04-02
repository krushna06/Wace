export interface UserRecommendations {
  userId: string;
  guildId: string;
  weeklyRecommendations: {
    tracks: Array<{
      title: string;
      artist: string;
      uri: string;
      score: number;
    }>;
    generatedAt: number;
  };
  yearlyWrapped: {
    topTracks: Array<{
      title: string;
      artist: string;
      plays: number;
    }>;
    topArtists: Array<{
      name: string;
      plays: number;
    }>;
    topGenres: Array<{
      name: string;
      plays: number;
    }>;
    totalMinutesListened: number;
    generatedAt: number;
  };
}
