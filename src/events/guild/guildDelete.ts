import { Manager } from "../../manager.js";
import { Guild } from "discord.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class {
  async execute(client: Manager, guild: Guild) {
    client.logger.info("GuildDelete", `Left guild ${guild.name} @ ${guild.id}`);
    const language = client.config.bot.LANGUAGE;
    client.guilds.cache.delete(`${guild!.id}`);
    if (!client.config.utilities.GUILD_LOG_CHANNEL) return;
    const eventChannel = await client.channels
      .fetch(client.config.utilities.GUILD_LOG_CHANNEL)
      .catch(() => undefined);
    if (!eventChannel || !eventChannel.isTextBased()) return;
    const owner = await guild.fetchOwner();
    eventChannel.messages.channel.send({
      flags: CV2_FLAG,
      components: [cv2.build({
        author: `${client.i18n.get(language, "event.guild", "leave_title")}`,
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
    }).catch(() => undefined);
  }
}