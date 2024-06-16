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

interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string }[];
  followers: { total: number };
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

interface SpotifyArtistsResponse {
  artists: {
    items: SpotifyArtist[];
  };
}

interface SpotifyTracksResponse {
  tracks: SpotifyTrack[];
}

interface SpotifyAlbumsResponse {
  items: { total_tracks: number }[];
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

export async function searchAlbum(query: string, accessToken: string): Promise<SpotifyAlbum | null> {
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

export async function getAlbumTracks(albumId: string, accessToken: string): Promise<SpotifyTrack[]> {
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

export async function searchArtists(query: string, accessToken: string): Promise<SpotifyArtist[]> {
  const searchEndpoint = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=5`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(searchEndpoint, { headers });
  const data = (await response.json()) as SpotifyArtistsResponse;

  if (!response.ok) {
    throw new Error("Failed to fetch artist data from Spotify.");
  }

  return data.artists.items;
}

export async function getPopularSongs(artistId: string, accessToken: string): Promise<SpotifyTrack[]> {
  const endpoint = `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(endpoint, { headers });
  const data = (await response.json()) as SpotifyTracksResponse;

  if (!response.ok) {
    throw new Error("Failed to fetch top tracks from Spotify.");
  }

  return data.tracks;
}

export async function getTotalSongs(artistId: string, accessToken: string): Promise<number> {
  const endpoint = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=50`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(endpoint, { headers });
  const data = (await response.json()) as SpotifyAlbumsResponse;

  if (!response.ok) {
    throw new Error("Failed to fetch albums from Spotify.");
  }

  const totalSongs = data.items.reduce((total, album) => total + album.total_tracks, 0);
  return totalSongs;
}

export async function getTotalAlbums(artistId: string, accessToken: string): Promise<number> {
  const endpoint = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=50`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(endpoint, { headers });
  const data = (await response.json()) as SpotifyAlbumsResponse;

  if (!response.ok) {
    throw new Error("Failed to fetch albums from Spotify.");
  }

  return data.items.length;
}
