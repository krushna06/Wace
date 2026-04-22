import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["prefix"];
  public description = "Change the prefix for the bot";
  public category = "Utils";
  public accessableby = [Accessableby.Manager];
  public usage = "<input>";
  public aliases = ["setprefix"];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = false;
  public sameVoiceCheck = false;
  public permissions = [];

  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    if (!handler.args[0])
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.utils", "prefix_arg")}`, client.color)],
      });

    if (handler.args[0].length > 10)
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.utils", "prefix_length")}`, client.color)],
      });

    const newPrefix = await client.db.prefix.get(`${handler.guild!.id}`);

    if (!newPrefix) {
      await client.db.prefix.set(`${handler.guild!.id}`, handler.args[0]);
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.utils", "prefix_set", { prefix: handler.args[0] })}`, client.color)],
      });
    } else if (newPrefix) {
      await client.db.prefix.set(`${handler.guild!.id}`, handler.args[0]);
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.utils", "prefix_change", { prefix: handler.args[0] })}`, client.color)],
      });
    }
  }
}
