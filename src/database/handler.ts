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

// Utility: Increment user song play count
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

export async function incrementGuildSongStats(db, guildId, song) {
  const key = `${guildId}:${song.identifier || song.uri}`;
  let stats = await db.songStats.get(key);
  if (!stats) {
    stats = {
      guildId,
      songId: song.identifier || song.uri,
      title: song.title,
      author: song.author,
      uri: song.uri,
      playCount: 1,
    };
  } else {
    stats.playCount = (stats.playCount || 0) + 1;
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
