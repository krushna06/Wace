import { ApplicationCommandOptionType, Role } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler, ParseMentionEnum } from "../../structures/CommandHandler.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["setup-pm"];
  public description = "Set a premium role for the server";
  public category = "Premium";
  public accessableby = [Accessableby.Manager];
  public usage = "";
  public aliases = [];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "role",
      description: "The role to set as premium role",
      type: ApplicationCommandOptionType.Role,
      required: true,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const roleData = handler.args[0];
    const getRole = await handler.parseMentions(roleData);
    const reply = (desc: string) => handler.editReply({ flags: CV2_FLAG, components: [cv2.simple(desc, client.color)] });

    if (!getRole || getRole.type !== ParseMentionEnum.ROLE)
      return reply(`${client.i18n.get(handler.language, "error", "no_role")}`);

    const role = getRole.data as Role;
    if (!role.editable)
      return reply(`${client.i18n.get(handler.language, "error", "role_not_editable")}`);

    try {
      const setup = await client.db.setup.get(handler.guild!.id);
      if (setup) {
        setup.premiumRole = role.id;
        await client.db.setup.set(handler.guild!.id, setup);
      } else {
        await client.db.setup.set(handler.guild!.id, { guild: handler.guild!.id, enable: false, channel: "", playmsg: "", voice: "", category: "", premiumRole: role.id });
      }

      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.build({
          author: `${client.i18n.get(handler.language, "command.premium", "setup_pm_author")}`,
          description: `${client.i18n.get(handler.language, "command.premium", "setup_pm_success", { role: role.name, guild: handler.guild!.name })}`,
          color: client.color,
          timestamp: true,
        })],
      });
    } catch (error) {
      client.logger.error("PmRole", `Error setting premium role: ${error}`);
      return reply(`${client.i18n.get(handler.language, "error", "unexpected_error")}`);
    }
  }
}
