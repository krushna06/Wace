import { ApplicationCommandOptionType } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["setup-dj"];
  public description = "Set or remove DJ role";
  public category = "Utils";
  public accessableby = [Accessableby.Manager];
  public usage = "<@role> or 'remove'";
  public aliases = [];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "role",
      description: "The role to set as DJ or 'remove' to remove DJ role",
      type: ApplicationCommandOptionType.Role,
      required: true,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    // @ts-ignore
    const roleOption = handler.interaction?.options.get('role');
    if (!roleOption || roleOption.role === null) {
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "error", "arg_error", { text: "a role mention or 'remove'!" })}`, client.color)],
      });
    }

    const setup = await client.db.setup.get(handler.guild!.id);

    if (roleOption.value === "remove") {
      if (!setup || !setup.djRole) {
        return handler.editReply({
          flags: CV2_FLAG,
          components: [cv2.simple(`${client.i18n.get(handler.language, "command.utils", "dj_already_empty")}`, client.color)],
        });
      }

      const newSetup = { ...setup, djRole: undefined };
      await client.db.setup.set(handler.guild!.id, newSetup);

      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.utils", "dj_removed")}`, client.color)],
      });
    } else {
      const role = roleOption.role!;
      const newSetup = setup
        ? { ...setup, djRole: role.id }
        : {
            guild: handler.guild!.id,
            enable: false,
            channel: "",
            playmsg: "",
            voice: "",
            category: "",
            djRole: role.id,
          };

      await client.db.setup.set(handler.guild!.id, newSetup);

      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.utils", "dj_set", { role: role.toString() })}`, client.color)],
      });
    }
  }
}
