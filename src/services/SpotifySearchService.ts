import fetch from "node-fetch";
import { ConfigDataService } from "./ConfigDataService.js";

interface SpotifyAlbum {
  id: string;
  name: string;
  artists: { name: string }[];
  release_date: string;
  images: { url: string }[];
  total_tracks: number;
  popularity: number;
  external_urls: { spotify: string };
}

interface SpotifyTrack {
  name: string;
  external_urls: { spotify: string };
}

interface SpotifyAlbumResponse {
  albums: {
    items: SpotifyAlbum[];
  };
}

interface SpotifyTracksResponse {
  items: SpotifyTrack[];
}

export async function getAccessToken(): Promise<string> {
  const configService = new ConfigDataService();
  const config = configService.data;

  const tokenEndpoint = "https://accounts.spotify.com/api/token";
  const headers = {
    Authorization: `Basic ${Buffer.from(`${config.player.SPOTIFY.id}:${config.player.SPOTIFY.secret}`).toString("base64")}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  const body = "grant_type=client_credentials";

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: headers,
    body: body,
  });

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

export async function searchAlbum(
  query: string,
  accessToken: string
): Promise<SpotifyAlbum | null> {
  const configService = new ConfigDataService();
  const config = configService.data;

  const searchEndpoint = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=1`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(searchEndpoint, { headers });
  const data = (await response.json()) as SpotifyAlbumResponse;

  if (!response.ok) {
    throw new Error("Failed to fetch album data from Spotify.");
  }

  const album = data.albums.items[0];
  return album || null;
}

export async function getAlbumTracks(
  albumId: string,
  accessToken: string
): Promise<SpotifyTrack[]> {
  const configService = new ConfigDataService();
  const config = configService.data;

  const tracksEndpoint = `https://api.spotify.com/v1/albums/${albumId}/tracks`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(tracksEndpoint, { headers });
  const data = (await response.json()) as SpotifyTracksResponse;

  if (!response.ok) {
    throw new Error("Failed to fetch tracks data from Spotify.");
  }

  return data.items;
}
