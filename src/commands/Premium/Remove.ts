import { ApplicationCommandOptionType } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["pm", "remove"];
  public description = "Remove premium from members!";
  public category = "Premium";
  public accessableby = [Accessableby.Admin];
  public usage = "<id>";
  public aliases = ["prm"];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "id",
      description: "The user id you want to remove!",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const id = handler.args[0];
    const reply = (desc: string) => handler.editReply({ flags: CV2_FLAG, components: [cv2.simple(desc, client.color)] });

    if (!id)
      return reply(`${client.i18n.get(handler.language, "command.premium", "remove_no_params")}`);

    const db = await client.db.premium.get(`${id}`);
    if (!db)
      return handler.editReply({ content: `${client.i18n.get(handler.language, "command.premium", "remove_404", { userid: id })}` });

    if (db.isPremium) {
      await client.db.premium.delete(`${id}`);
      return reply(`${client.i18n.get(handler.language, "command.premium", "remove_desc", { user: db.redeemedBy?.username as string })}`);
    }
    return reply(`${client.i18n.get(handler.language, "command.premium", "remove_already", { user: db.redeemedBy?.username as string })}`);
  }
}
