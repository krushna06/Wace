import { EmbedBuilder } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";

export default class implements Command {
  public name = ["pmrole-info"];
  public description = "View the current premium role for the server";
  public category = "Premium";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = [];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    try {
      const setup = await client.db.setup.get(handler.guild!.id);

      if (!setup || !setup.premiumRole) {
        const embed = new EmbedBuilder()
          .setDescription(`${client.i18n.get(handler.language, "command.premium", "setup_pm_info_no_role")}`)
          .setColor(client.color);
        return handler.editReply({ embeds: [embed] });
      }

      const role = handler.guild!.roles.cache.get(setup.premiumRole);

      if (!role) {
        const embed = new EmbedBuilder()
          .setDescription(`${client.i18n.get(handler.language, "command.premium", "setup_pm_info_role_deleted")}`)
          .setColor(client.color);
        return handler.editReply({ embeds: [embed] });
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${client.i18n.get(handler.language, "command.premium", "setup_pm_info_author")}`,
          iconURL: client.user!.displayAvatarURL(),
        })
        .setDescription(
          `${client.i18n.get(handler.language, "command.premium", "setup_pm_info_desc", {
            role: role.name,
            roleId: role.id,
            guild: handler.guild!.name,
          })}`
        )
        .setColor(role.color || client.color)
        .setTimestamp();

      return handler.editReply({ embeds: [embed] });
    } catch (error) {
      client.logger.error("PmRoleInfo", `Error getting premium role info: ${error}`);
      const embed = new EmbedBuilder()
        .setDescription(`${client.i18n.get(handler.language, "error", "unexpected_error")}`)
        .setColor(client.color);
      return handler.editReply({ embeds: [embed] });
    }
  }
}