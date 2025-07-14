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
