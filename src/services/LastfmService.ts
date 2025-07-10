// This file contains Last.fm API utility functions....
import fetch from "node-fetch";

// Get user info
export async function getUserInfo(username: string, apiKey: string) {
  const url = `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${encodeURIComponent(username)}&api_key=${apiKey}&format=json`;
  const res = await fetch(url);
  return res.json();
}

// Get user's top artists
export async function getUserTopArtists(username: string, apiKey: string, period = "overall", limit = 10, sessionKey?: string) {
  let url = `https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${encodeURIComponent(username)}&api_key=${apiKey}&format=json&period=${period}&limit=${limit}`;
  if (sessionKey) url += `&sk=${sessionKey}`;
  const res = await fetch(url);
  return res.json();
}

// Get user's top albums
export async function getUserTopAlbums(username: string, apiKey: string, period = "overall", limit = 10, sessionKey?: string) {
  let url = `https://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${encodeURIComponent(username)}&api_key=${apiKey}&format=json&period=${period}&limit=${limit}`;
  if (sessionKey) url += `&sk=${sessionKey}`;
  const res = await fetch(url);
  return res.json();
}

// Get user's top tracks
export async function getUserTopTracks(username: string, apiKey: string, period = "overall", limit = 10, sessionKey?: string) {
  let url = `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${encodeURIComponent(username)}&api_key=${apiKey}&format=json&period=${period}&limit=${limit}`;
  if (sessionKey) url += `&sk=${sessionKey}`;
  const res = await fetch(url);
  return res.json();
}

// Get user's recent tracks
export async function getUserRecentTracks(username: string, apiKey: string, limit = 5, sessionKey?: string) {
  let url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(username)}&api_key=${apiKey}&format=json&limit=${limit}`;
  if (sessionKey) url += `&sk=${sessionKey}`;
  const res = await fetch(url);
  return res.json();
}

// Get global top artists
export async function getGlobalTopArtists(apiKey: string, limit = 10) {
  const url = `https://ws.audioscrobbler.com/2.0/?method=chart.gettopartists&api_key=${apiKey}&format=json&limit=${limit}`;
  const res = await fetch(url);
  return res.json();
}

// Get global top tracks
export async function getGlobalTopTracks(apiKey: string, limit = 10) {
  const url = `https://ws.audioscrobbler.com/2.0/?method=chart.gettoptracks&api_key=${apiKey}&format=json&limit=${limit}`;
  const res = await fetch(url);
  return res.json();
} 