import { Manager } from "../manager.js";
import { AutoReconnectLavalinkService } from "./setup/lavalink.js";
import { PremiumScheduleSetup } from "./setup/premium.js";
import { SongRequesterCleanSetup } from "./setup/setup.js";

export class Handler {
  constructor(client: Manager) {
    new SongRequesterCleanSetup(client);
    new AutoReconnectLavalinkService(client);
    new PremiumScheduleSetup(client);
  }
}

export async function incrementUserSongPlay(db, userId, guildId) {
  const key = `${userId}:${guildId}`;
  let stats = await db.userStats.get(key);
  if (!stats) {
    stats = { userId, guildId, songsPlayed: 1, commandsExecuted: 0 };
  } else {
    stats.songsPlayed = (stats.songsPlayed || 0) + 1;
  }
  await db.userStats.set(key, stats);
}

export async function incrementGuildSongPlay(db, guildId) {
  let stats = await db.guildStats.get(guildId);
  if (!stats) {
    stats = { guildId, songsPlayed: 1, commandsExecuted: 0 };
  } else {
    stats.songsPlayed = (stats.songsPlayed || 0) + 1;
  }
  await db.guildStats.set(guildId, stats);
}

export async function incrementUserCommand(db, userId, guildId) {
  const key = `${userId}:${guildId}`;
  let stats = await db.userStats.get(key);
  if (!stats) {
    stats = { userId, guildId, songsPlayed: 0, commandsExecuted: 1 };
  } else {
    stats.commandsExecuted = (stats.commandsExecuted || 0) + 1;
  }
  await db.userStats.set(key, stats);
}

export async function incrementGuildCommand(db, guildId) {
  let stats = await db.guildStats.get(guildId);
  if (!stats) {
    stats = { guildId, songsPlayed: 0, commandsExecuted: 1 };
  } else {
    stats.commandsExecuted = (stats.commandsExecuted || 0) + 1;
  }
  await db.guildStats.set(guildId, stats);
}

export async function incrementGuildSongStats(db, guildId, song, userId) {
  const key = `${guildId}:${userId}:${song.identifier || song.uri}`;
  let stats = await db.songStats.get(key);
  if (!stats) {
    stats = {
      guildId,
      userId,
      songId: song.identifier || song.uri,
      title: song.title,
      author: song.author,
      uri: song.uri,
      playCount: 1,
      artworkUrl: song.artworkUrl || undefined,
    };
  } else {
    stats.playCount = (stats.playCount || 0) + 1;
    if (!stats.artworkUrl && song.artworkUrl) {
      stats.artworkUrl = song.artworkUrl;
    }
  }
  await db.songStats.set(key, stats);
}

export async function setGuildLastPlayed(db, guildId, song) {
  const data = {
    guildId,
    songId: song.identifier || song.uri,
    title: song.title,
    author: song.author,
    uri: song.uri,
    playedAt: Date.now(),
  };
  await db.guildLastPlayed.set(guildId, data);
}

export async function getTopSongsForGuild(db, guildId, limit = 5) {
  const all = await db.songStats.all();
  return all
    .filter((entry) => entry.value.guildId === guildId)
    .sort((a, b) => (b.value.playCount || 0) - (a.value.playCount || 0))
    .slice(0, limit)
    .map((entry) => entry.value);
}

export async function getTopUsersForGuild(db, guildId, limit = 5) {
  const all = await db.userStats.all();
  return all
    .filter((entry) => entry.value.guildId === guildId)
    .sort((a, b) => (b.value.songsPlayed || 0) - (a.value.songsPlayed || 0))
    .slice(0, limit)
    .map((entry) => entry.value);
}

export async function getLastPlayedSongForGuild(db, guildId) {
  return await db.guildLastPlayed.get(guildId);
}

export async function getTopSongsForUser(db, userId, limit = 5) {
  const all = await db.songStats.all();
  return all
    .filter((entry) => entry.value.userId === userId)
    .sort((a, b) => (b.value.playCount || 0) - (a.value.playCount || 0))
    .slice(0, limit)
    .map((entry) => entry.value);
}

export async function setUserLastPlayed(db, userId, song) {
  const data = {
    userId,
    songId: song.identifier || song.uri,
    title: song.title,
    author: song.author,
    uri: song.uri,
    playedAt: Date.now(),
  };
  await db.userLastPlayed.set(userId, data);
}

export async function logUserPlayHistory(db, userId, guildId, song) {
  const entry = {
    userId,
    guildId,
    songId: song.identifier || song.uri,
    title: song.title,
    author: song.author,
    uri: song.uri,
    playedAt: Date.now(),
    artworkUrl: song.artworkUrl || undefined,
  };
  await db.userPlayHistory.set(`${userId}:${guildId}:${Date.now()}`, entry);
}

export async function getLastPlayedSongForUser(db, userId) {
  return await db.userLastPlayed.get(userId);
}

export async function getUserPlayHistory(db, userId, guildId) {
  const all = await db.userPlayHistory.all();
  return all
    .filter((entry) => entry.value.userId === userId && entry.value.guildId === guildId)
    .sort((a, b) => (a.value.playedAt || 0) - (b.value.playedAt || 0))
    .map((entry) => entry.value);
}
