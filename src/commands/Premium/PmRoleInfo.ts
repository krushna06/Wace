import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

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
    const reply = (desc: string) => handler.editReply({ flags: CV2_FLAG, components: [cv2.simple(desc, client.color)] });

    try {
      const setup = await client.db.setup.get(handler.guild!.id);
      if (!setup || !setup.premiumRole)
        return reply(`${client.i18n.get(handler.language, "command.premium", "setup_pm_info_no_role")}`);

      const role = handler.guild!.roles.cache.get(setup.premiumRole);
      if (!role)
        return reply(`${client.i18n.get(handler.language, "command.premium", "setup_pm_info_role_deleted")}`);

      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.build({
          author: `${client.i18n.get(handler.language, "command.premium", "setup_pm_info_author")}`,
          description: `${client.i18n.get(handler.language, "command.premium", "setup_pm_info_desc", { role: role.name, roleId: role.id, guild: handler.guild!.name })}`,
          color: role.color || client.color,
          timestamp: true,
        })],
      });
    } catch (error) {
      client.logger.error("PmRoleInfo", `Error getting premium role info: ${error}`);
      return reply(`${client.i18n.get(handler.language, "error", "unexpected_error")}`);
    }
  }
}
