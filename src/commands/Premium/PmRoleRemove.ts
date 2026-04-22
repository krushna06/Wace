import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

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
    const reply = (desc: string) => handler.editReply({ flags: CV2_FLAG, components: [cv2.simple(desc, client.color)] });

    try {
      const setup = await client.db.setup.get(handler.guild!.id);
      if (!setup || !setup.premiumRole)
        return reply(`${client.i18n.get(handler.language, "command.premium", "setup_pm_remove_no_role")}`);

      setup.premiumRole = undefined;
      await client.db.setup.set(handler.guild!.id, setup);

      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.build({
          author: `${client.i18n.get(handler.language, "command.premium", "setup_pm_remove_author")}`,
          description: `${client.i18n.get(handler.language, "command.premium", "setup_pm_remove_success", { guild: handler.guild!.name })}`,
          color: client.color,
          timestamp: true,
        })],
      });
    } catch (error) {
      client.logger.error("PmRoleRemove", `Error removing premium role: ${error}`);
      return reply(`${client.i18n.get(handler.language, "error", "unexpected_error")}`);
    }
  }
}
