import { load } from "js-yaml";
import { YAMLParseService } from "./YAMLParseService.js";
import { config } from "dotenv";
import { Config } from "../@types/Config.js";
config();

export class ConfigDataService {
  get data() {
    const yaml_files = load(new YAMLParseService("./app.yml").execute()) as Config;
    const old_data = load(new YAMLParseService("./app.yml").execute()) as Config;

    const raw = yaml_files;
    this.checkConfig(raw);

    if (raw.bot) {
      if (raw.bot.OWNER_ID) raw.bot.OWNER_ID = String(raw.bot.OWNER_ID);
      if (Array.isArray(raw.bot.ADMIN)) raw.bot.ADMIN = raw.bot.ADMIN.map(String);
      if (Array.isArray(raw.bot.TOKEN)) raw.bot.TOKEN = raw.bot.TOKEN.map(String);
    }

    const res = this.mergeDefault(this.defaultConfig, raw);

    if (old_data.utilities && old_data.utilities.DATABASE && old_data.utilities.DATABASE.config) {
      res.utilities.DATABASE.config = old_data.utilities.DATABASE.config;
    }

    if (process.env.DOCKER_COMPOSE_MODE) {

      const lavalink_changedata = res.player.NODES[0];
      lavalink_changedata.host = String(process.env.NODE_HOST);
      lavalink_changedata.port = Number(process.env.NODE_PORT);
      lavalink_changedata.name = "node_1";
      lavalink_changedata.auth = String(process.env.NODE_AUTH);
      lavalink_changedata.secure = false;

      if (process.env.DOCKER_COMPOSE_DATABASE) {

        const db_chnagedata = res.utilities.DATABASE;
        if (db_chnagedata.driver == "mongodb") {
          db_chnagedata.config.uri = String(process.env.MONGO_URI);
        }
      }
    }

    return res;
  }

  checkConfig(res?: Config) {
    if (!res)
      throw new Error(
        "Config file not contains any config, please check app.example.yml for example"
      );
    if (!res.bot)
      throw new Error(
        "Config file not contains bot config field, please check app.example.yml for example"
      );
    if (!res.player)
      throw new Error(
        "Config file not contains lavalink config field, please check app.example.yml for example"
      );
    if (!res.bot.OWNER_ID)
      throw new Error(
        "Config file not contains OWNER_ID, please check app.example.yml for example"
      );
    if (!res.bot.TOKEN || res.bot.TOKEN.length == 0)
      throw new Error("Config file not contains TOKEN, please check app.example.yml for example");
    if (!Array.isArray(res.bot.TOKEN))
      throw new Error("TOKEN field not in array, please check app.example.yml for example");
    if (!res.player.NODES || res.player.NODES.length == 0)
      throw new Error("Config file not contains NODES, please check app.example.yml for example");
  }

  mergeDefault<T extends { [key: string]: any }>(def: T, given: T): Required<T> {
    if (!given) return def as Required<T>;
    const defaultKeys: (keyof T)[] = Object.keys(def);
    for (const key in given) {
      if (defaultKeys.includes(key)) continue;
      if (this.isNumber(key)) continue;
      delete given[key];
    }
    for (const key of defaultKeys) {
      if (Array.isArray(given[key]) && given[key].length == 0) given[key] = def[key];
      if (def[key] === null || (typeof def[key] === "string" && def[key].length === 0)) {
        if (!given[key]) given[key] = def[key];
      }
      if (given[key] === null || given[key] === undefined) given[key] = def[key];
      if (typeof given[key] === "object" && given[key] !== null && !Array.isArray(given[key])) {
        this.mergeDefault(def[key], given[key]);
      }
      if (typeof given[key] !== typeof def[key]) if (!given[key]) given[key] = def[key];
    }
    return given as Required<T>;
  }

  isNumber(data: string): boolean {
    return /^[+-]?\d+(\.\d+)?$/.test(data);
  }

  get defaultConfig(): Config {
    return {
      bot: {
        TOKEN: [],
        OWNER_ID: "",
        EMBED_COLOR: "#2B2D31",
        LANGUAGE: "en",
        DEBUG_MODE: false,
        ADMIN: [],
        BOT_NAME: "Wace",
        INVITE_LINK: "https://discord.gg/ReA5JyJCR6",
        SOURCE_CODE_LINK: "https://discord.gg/m5Y3rRPuFT",
        SUPPORT_LINK: "https://discord.gg/ReA5JyJCR6",
        PRESENCE: {
          status: "online",
          activity_name: "v${version} | /play",
          activity_type: 2,
        },
      },
      player: {
        SPOTIFY: {
          enable: false,
          id: "",
          secret: "",
        },
        LASTFM: {
          enable: false,
          api_key: "",
          shared_secret: "",
          callback_url: "http://localhost:3001/api/lastfm/callback",
        },
        GENIUS: {
          enable: false,
          api_key: "",
        },
        AUTOCOMPLETE_SEARCH: ["yorushika", "yoasobi", "tuyu", "hinkik"],
        NP_REALTIME: false,
        LEAVE_TIMEOUT: 30000,
        NODES: [],
        DEFAULT_VOLUME: 100,
        AVOID_SUSPEND: false,
        LIMIT_TRACK: 50,
        LIMIT_PLAYLIST: 20,
      },
      utilities: {
        AUTO_RESUME: false,
        TOPGG_TOKEN: "",
        TOPGG: {
          token: "",
          webhook_secret: "",
          vote_reward_hours: 12,
        },
        DELETE_MSG_TIMEOUT: 2000,
        DATABASE: {
          driver: "json",
          config: { path: "./wace.database.json" },
          cacheCleanSchedule: "0 */30 * * * *",
        },
        MESSAGE_CONTENT: {
          enable: true,
          commands: {
            enable: true,
            prefix: "d!",
          },
        },
        AUTOFIX_LAVALINK: {
          enable: true,
          retryCount: 10,
          retryTimeout: 3000,
        },
        WEB_SERVER: {
          enable: false,
          host: "0.0.0.0",
          port: 2880,
          auth: "youshallnotpass",
          whitelist: [],
          BOT_NAME: "[{botName}]",
          EASTER_EGG_REFERENCE: "nostep",
        },
        PREMIUM_LOG_CHANNEL: "",
        GUILD_LOG_CHANNEL: "",
        LOG_CHANNEL: "",
        DASHBOARD_URL: "",
        GUILD_JOIN_MESSAGE: {
          enable: false,
          dm_owner: false,
        },
        DATABASE_BACKUP: {
          enable: false,
          backup_dir: "./backups",
          keep_backups: 4,
        },
        GUILD_MANAGEMENT: {
          LEAVE_SMALL_GUILDS: {
            enable: false,
            min_members: 15,
          },
          LEAVE_INACTIVE_GUILDS: {
            enable: false,
            inactive_threshold: "30d",
          },
        },
      },
      emojis: {
        PLAYER: {
          play: "▶️",
          pause: "⏸️",
          loop: "🔁",
          shuffle: "🔀",
          stop: "⏹️",
          skip: "⏩",
          previous: "⏪",
          voldown: "🔉",
          volup: "🔊",
          queue: "📋",
          delete: "🗑",
        },
        GLOBAL: {
          arrow_next: "➡",
          arrow_previous: "⬅",
        },
      },
      PATREON_IMAGE: [
        "https://media.discordapp.net/attachments/890634398981042246/1251990013193879562/54.png?ex=6670960f&is=666f448f&hm=d11ef9f858c1a2030ccdfe58aaa6fcd4a80725f6d250a67adb7aca38b88628de&=&format=webp&quality=lossless&width=687&height=223"
      ],
    };
  }
}