import fetch from "node-fetch";

export async function getUserInfo(username: string, apiKey: string) {
  const url = `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${encodeURIComponent(username)}&api_key=${apiKey}&format=json`;
  const res = await fetch(url);
  return res.json();
}

export async function getUserTopArtists(username: string, apiKey: string, period = "overall", limit = 10, sessionKey?: string) {
  let url = `https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${encodeURIComponent(username)}&api_key=${apiKey}&format=json&period=${period}&limit=${limit}`;
  if (sessionKey) url += `&sk=${sessionKey}`;
  const res = await fetch(url);
  return res.json();
}

export async function getUserTopAlbums(username: string, apiKey: string, period = "overall", limit = 10, sessionKey?: string) {
  let url = `https://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${encodeURIComponent(username)}&api_key=${apiKey}&format=json&period=${period}&limit=${limit}`;
  if (sessionKey) url += `&sk=${sessionKey}`;
  const res = await fetch(url);
  return res.json();
}

export async function getUserTopTracks(username: string, apiKey: string, period = "overall", limit = 10, sessionKey?: string) {
  let url = `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${encodeURIComponent(username)}&api_key=${apiKey}&format=json&period=${period}&limit=${limit}`;
  if (sessionKey) url += `&sk=${sessionKey}`;
  const res = await fetch(url);
  return res.json();
}

export async function getUserRecentTracks(username: string, apiKey: string, limit = 5, sessionKey?: string) {
  let url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(username)}&api_key=${apiKey}&format=json&limit=${limit}`;
  if (sessionKey) url += `&sk=${sessionKey}`;
  const res = await fetch(url);
  return res.json();
}

export async function getGlobalTopArtists(apiKey: string, limit = 10) {
  const url = `https://ws.audioscrobbler.com/2.0/?method=chart.gettopartists&api_key=${apiKey}&format=json&limit=${limit}`;
  const res = await fetch(url);
  return res.json();
}

export async function getGlobalTopTracks(apiKey: string, limit = 10) {
  const url = `https://ws.audioscrobbler.com/2.0/?method=chart.gettoptracks&api_key=${apiKey}&format=json&limit=${limit}`;
  const res = await fetch(url);
  return res.json();
}

export async function getAlbumInfo(artist: string, album: string, apiKey: string, username?: string) {
  let url = `https://ws.audioscrobbler.com/2.0/?method=album.getinfo&artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(album)}&api_key=${apiKey}&format=json`;
  if (username) url += `&username=${encodeURIComponent(username)}`;
  const res = await fetch(url);
  return res.json();
}

export async function getArtistInfo(artist: string, apiKey: string, username?: string) {
  let url = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(artist)}&api_key=${apiKey}&format=json`;
  if (username) url += `&username=${encodeURIComponent(username)}`;
  const res = await fetch(url);
  return res.json();
}

export async function getTrackInfo(artist: string, track: string, apiKey: string, username?: string) {
  let url = `https://ws.audioscrobbler.com/2.0/?method=track.getinfo&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&api_key=${apiKey}&format=json`;
  if (username) url += `&username=${encodeURIComponent(username)}`;
  const res = await fetch(url);
  return res.json();
}

export async function getUserAllArtists(username: string, apiKey: string) {
  let page = 1;
  let totalPages = 1;
  const allArtists: any[] = [];
  do {
    const url = `https://ws.audioscrobbler.com/2.0/?method=library.getartists&user=${encodeURIComponent(username)}&api_key=${apiKey}&format=json&limit=2000&page=${page}`;
    const res = await fetch(url);
    const data: any = await res.json();
    if (Array.isArray(data?.artists?.artist)) {
      allArtists.push(...data.artists.artist);
    }
    totalPages = parseInt(data?.artists?.['@attr']?.totalPages || '1', 10);
    page++;
  } while (page <= totalPages);
  return allArtists;
}