import { stripIndents } from "common-tags";
import { Manager } from "../../manager.js";
import { Guild } from "discord.js";
import fs from "fs";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class {
  async execute(client: Manager, guild: Guild) {
    client.logger.info("GuildCreate", `Joined guild ${guild.name} @ ${guild.id}`);
    const owner = await guild.fetchOwner();
    const language = client.config.bot.LANGUAGE;

    client.guilds.cache.set(`${guild!.id}`, guild);
    let PREFIX = client.prefix;

    const GuildPrefix = await client.db.prefix.get(`${guild!.id}`);
    if (GuildPrefix) PREFIX = GuildPrefix;
    else if (!GuildPrefix)
      PREFIX = String(await client.db.prefix.set(`${guild!.id}`, client.prefix));

    if (client.config.utilities.GUILD_JOIN_MESSAGE.enable) {
      if (client.config.utilities.GUILD_JOIN_MESSAGE.dm_owner) {
        const userDm = await owner.createDM(true).catch(() => null);
        if (userDm) userDm.send({
          flags: CV2_FLAG,
          components: [cv2.build({
            title: `${client.i18n.get(language, "event.guild", "join_dm_title", { username: String(client.user?.username) })}`,
            description: stripIndents`
              ${client.i18n.get(language, "event.message", "intro1", { bot: String(client.user?.displayName) })}
              ${client.i18n.get(language, "event.message", "intro")}
            `,
            color: client.color,
          })],
        }).catch(() => {});
      }
    }

    if (!client.config.utilities.GUILD_LOG_CHANNEL) return;
    const eventChannel = await client.channels.fetch(client.config.utilities.GUILD_LOG_CHANNEL).catch(() => undefined);
    if (!eventChannel || !eventChannel.isTextBased()) return;

    eventChannel.messages.channel.send({
      flags: CV2_FLAG,
      components: [cv2.build({
        author: `${client.i18n.get(language, "event.guild", "joined_title")}`,
        color: client.color,
        timestamp: true,
        fields: [
          { name: `${client.i18n.get(language, "event.guild", "guild_name")}`, value: String(guild.name) },
          { name: `${client.i18n.get(language, "event.guild", "guild_id")}`, value: String(guild.id) },
          { name: `${client.i18n.get(language, "event.guild", "guild_owner")}`, value: `${owner.displayName} [ ${guild.ownerId} ]` },
          { name: `${client.i18n.get(language, "event.guild", "guild_member_count")}`, value: `${guild.memberCount}` },
          { name: `${client.i18n.get(language, "event.guild", "guild_creation_date")}`, value: `${guild.createdAt}` },
          { name: `${client.i18n.get(language, "event.guild", "current_server_count")}`, value: `${client.guilds.cache.size}` },
        ],
      })],
    }).catch(() => null);
  }
}