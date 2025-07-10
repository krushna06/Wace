import { EmbedBuilder } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";

export default class implements Command {
  public name = ["setup-pm-remove"];
  public description = "Remove the premium role from the server";
  public category = "Premium";
  public accessableby = [Accessableby.Manager];
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
          .setDescription(`${client.i18n.get(handler.language, "command.premium", "setup_pm_remove_no_role")}`)
          .setColor(client.color);
        return handler.editReply({ embeds: [embed] });
      }

      // Remove the premium role
      setup.premiumRole = undefined;
      await client.db.setup.set(handler.guild!.id, setup);

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${client.i18n.get(handler.language, "command.premium", "setup_pm_remove_author")}`,
          iconURL: client.user!.displayAvatarURL(),
        })
        .setDescription(
          `${client.i18n.get(handler.language, "command.premium", "setup_pm_remove_success", {
            guild: handler.guild!.name,
          })}`
        )
        .setColor(client.color)
        .setTimestamp();

      return handler.editReply({ embeds: [embed] });
    } catch (error) {
      client.logger.error("PmRoleRemove", `Error removing premium role: ${error}`);
      const embed = new EmbedBuilder()
        .setDescription(`${client.i18n.get(handler.language, "error", "unexpected_error")}`)
        .setColor(client.color);
      return handler.editReply({ embeds: [embed] });
    }
  }
} 