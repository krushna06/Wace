export interface UserPlayHistory {
  userId: string;
  guildId: string;
  songId: string;
  title: string;
  author: string;
  uri: string;
  playedAt: number;
  artworkUrl?: string;
} 