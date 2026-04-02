import { Manager } from "../manager.js";
import { LastFMNews } from "../database/schema/LastFMNews.js";

export class MusicNewsService {
  constructor(private client: Manager) {}

  async fetchArtistNews(artistName: string): Promise<any[]> {
    try {
      // This would integrate with Last.FM API or music news APIs
      // For now, returning a placeholder structure
      const response = await fetch(
        `https://www.last.fm/api/artist/${encodeURIComponent(artistName)}/news`
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.news || [];
    } catch (error) {
      this.client.logger.error("MusicNewsService", `Failed to fetch news for ${artistName}: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  async updateUserNews(userId: string): Promise<void> {
    const key = userId;
    let newsData = await this.client.db.lastfmNews.get(key);

    if (!newsData) {
      newsData = {
        userId,
        followedArtists: [],
        lastNewsCheck: Date.now(),
        newsCache: [],
      };
    }

    if (Date.now() - newsData.lastNewsCheck < 6 * 60 * 60 * 1000) {
      return;
    }

    const allNews: any[] = [];

    for (const artist of newsData.followedArtists) {
      const artistNews = await this.fetchArtistNews(artist);
      allNews.push(
        ...artistNews.map((n) => ({
          artist,
          title: n.title,
          description: n.description,
          url: n.url,
          date: new Date(n.date).getTime(),
        }))
      );
    }

    newsData.newsCache = allNews.sort((a, b) => b.date - a.date).slice(0, 50);
    newsData.lastNewsCheck = Date.now();

    await this.client.db.lastfmNews.set(key, newsData);
  }

  async followArtist(userId: string, artistName: string): Promise<void> {
    const key = userId;
    let newsData = await this.client.db.lastfmNews.get(key);

    if (!newsData) {
      newsData = {
        userId,
        followedArtists: [],
        lastNewsCheck: Date.now(),
        newsCache: [],
      };
    }

    if (!newsData.followedArtists.includes(artistName)) {
      newsData.followedArtists.push(artistName);
      await this.client.db.lastfmNews.set(key, newsData);
    }
  }

  async unfollowArtist(userId: string, artistName: string): Promise<void> {
    const key = userId;
    const newsData = await this.client.db.lastfmNews.get(key);

    if (newsData) {
      newsData.followedArtists = newsData.followedArtists.filter((a) => a !== artistName);
      await this.client.db.lastfmNews.set(key, newsData);
    }
  }
}
