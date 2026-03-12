export interface NodeOptions {
  name: string;
  host: string;
  port: number;
  auth: string;
  secure?: boolean;
}
export interface Config {
  bot: Bot;
  player: Player;
  utilities: Utilities;
  emojis: Emojis;
  PATREON_IMAGE?: string[];
}
export interface Bot {
  TOKEN: string[];
  EMBED_COLOR: string;
  OWNER_ID: string;
  ADMIN: string[];
  LANGUAGE: string;
  DEBUG_MODE: boolean;
  BOT_NAME: string;
  INVITE_LINK: string;
  SOURCE_CODE_LINK: string;
  SUPPORT_LINK: string;
  PRESENCE: BotPresence;
}
export interface BotPresence {
  status: "online" | "idle" | "dnd" | "invisible";
  activity_name: string;
  activity_type: 0 | 1 | 2 | 3 | 4 | 5;
}
export interface Utilities {
  AUTO_RESUME: boolean;
  DELETE_MSG_TIMEOUT: number;
  DATABASE: Database;
  TOPGG_TOKEN: string;
  MESSAGE_CONTENT: MessageContent;
  AUTOFIX_LAVALINK: AutofixLavalink;
  WEB_SERVER: WebServer;
  PREMIUM_LOG_CHANNEL: string;
  GUILD_LOG_CHANNEL: string;
  LOG_CHANNEL: string;
  DASHBOARD_URL?: string;
  GUILD_JOIN_MESSAGE: GuildJoinMessage;
}
export interface AutofixLavalink {
  enable: boolean;
  retryCount: number;
  retryTimeout: number;
}
export interface GuildJoinMessage {
  enable: boolean;
  dm_owner: boolean;
}
export interface Database {
  driver: string;
  config: any;
  cacheCleanSchedule: string;
}
export interface MessageContent {
  enable: boolean;
  commands: Commands;
}
export interface Commands {
  enable: boolean;
  prefix: string;
}
export interface WebServer {
  enable: boolean;
  host: string;
  port: number;
  auth: string;
  whitelist: string[];
  BOT_NAME: string;
  EASTER_EGG_REFERENCE: string;
}
export interface Player {
  SPOTIFY: Spotify;
  LASTFM: Lastfm;
  GENIUS: Genius;
  AUTOCOMPLETE_SEARCH: string[];
  NP_REALTIME: boolean;
  LEAVE_TIMEOUT: number;
  NODES: NodeOptions[];
  DEFAULT_VOLUME: number;
  AVOID_SUSPEND: boolean;
  LIMIT_TRACK: number;
  LIMIT_PLAYLIST: number;
}
export interface Lastfm {
  enable: boolean;
  api_key: string;
  shared_secret: string;
  callback_url?: string;
}
export interface Spotify {
  enable: boolean;
  id: string;
  secret: string;
}
export interface Genius {
  enable: boolean;
  api_key: string;
}
export interface Emojis {
  PLAYER: PlayerEmojis;
  GLOBAL: GlobalEmojis;
}
export interface PlayerEmojis {
  play: string;
  pause: string;
  loop: string;
  shuffle: string;
  stop: string;
  skip: string;
  previous: string;
  voldown: string;
  volup: string;
  queue: string;
  delete: string;
}
export interface GlobalEmojis {
  arrow_next: string;
  arrow_previous: string;
}