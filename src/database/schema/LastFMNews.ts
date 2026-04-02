export interface LastFMNews {
  userId: string;
  followedArtists: string[];
  lastNewsCheck: number;
  newsCache: Array<{
    artist: string;
    title: string;
    description: string;
    url: string;
    date: number;
  }>;
}
