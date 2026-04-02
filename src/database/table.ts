import { IDriver, QuickDB } from "quick.db";
import { Manager } from "../manager.js";
import { Handler } from "./handler.js";
import { AutoReconnect } from "./schema/AutoReconnect.js";
import { Playlist } from "./schema/Playlist.js";
import { Code } from "./schema/Code.js";
import { Premium } from "./schema/Premium.js";
import { Setup } from "./schema/Setup.js";
import { Language } from "./schema/Language.js";
import { Prefix } from "./schema/Prefix.js";
import { SongNoti } from "./schema/SongNoti.js";
import { QuickDatabasePlus } from "../structures/QuickDatabasePlus.js";
import { UserRecommendations } from "./schema/UserRecommendations.js";
import { GameStats } from "./schema/GameStats.js";
import { LastFMNews } from "./schema/LastFMNews.js";
import { Achievement } from "./schema/Achievement.js";
export class TableSetup {
  client: Manager;
  driver: IDriver;
  driverName: string;
  constructor(client: Manager, driver: IDriver, driverName: string) {
    this.client = client;
    this.driver = driver;
    this.driverName = driverName;
    this.register();
  }
  async register() {
    const baseDB = new QuickDatabasePlus(this.client.config.utilities.DATABASE.cacheCleanSchedule, {
      driver: this.driver,
    });
    const start = Date.now();
    await baseDB.init();
    const end = Date.now();
    this.client.logger.info(
      "DatabaseService",
      `Connected to the database! [${this.driverName}] [${end - start}ms]`
    );
    this.client.db = {
      autoreconnect: await baseDB.table<AutoReconnect>("autoreconnect"),
      playlist: await baseDB.table<Playlist>("playlist"),
      code: await baseDB.table<Code>("code"),
      premium: await baseDB.table<Premium>("premium"),
      setup: await baseDB.table<Setup>("setup"),
      language: await baseDB.table<Language>("language"),
      prefix: await baseDB.table<Prefix>("prefix"),
      songNoti: await baseDB.table<SongNoti>("songNoti"),
      preGuild: await baseDB.table<Premium>("preGuild"),
      lastfmSession: await baseDB.table("lastfmSession"),
      userStats: await baseDB.table("userStats"),
      guildStats: await baseDB.table("guildStats"),
      songStats: await baseDB.table("songStats"),
      guildLastPlayed: await baseDB.table("guildLastPlayed"),
      userLastPlayed: await baseDB.table("userLastPlayed"),
      userPlayHistory: await baseDB.table("userPlayHistory"),
      userRecommendations: await baseDB.table<UserRecommendations>("userRecommendations"),
      gameStats: await baseDB.table<GameStats>("gameStats"),
      lastfmNews: await baseDB.table<LastFMNews>("lastfmNews"),
      achievement: await baseDB.table<Achievement>("achievement"),
    };
    this.client.isDatabaseConnected = true;
    new Handler(this.client);
  }
}