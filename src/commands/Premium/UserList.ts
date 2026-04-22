import { ApplicationCommandOptionType } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Page } from "../../structures/Page.js";
import { Premium } from "../../database/schema/Premium.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["pm", "list"];
  public description = "View all existing premium user!";
  public category = "Premium";
  public accessableby = [Accessableby.Admin];
  public usage = "";
  public aliases = ["pml"];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "page",
      description: "Page number to show.",
      type: ApplicationCommandOptionType.Number,
      required: false,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const value = handler.args[0];
    const reply = (desc: string) => handler.editReply({ flags: CV2_FLAG, components: [cv2.simple(desc, client.color)] });

    if (value && isNaN(+value))
      return reply(`${client.i18n.get(handler.language, "error", "number_invalid")}`);

    const users = Array.from(await client.db.premium.all<Premium>()).map((d) => d.value);
    let pagesNum = Math.ceil(users.length / 10);
    if (pagesNum === 0) pagesNum = 1;

    const userStrings = users.map((u, i) => `\`${i + 1}. ${u.redeemedBy.username}/${u.id} - ${u.plan}\``);

    const pages = [];
    for (let i = 0; i < pagesNum; i++) {
      const str = userStrings.slice(i * 10, i * 10 + 10).join("\n");
      pages.push(cv2.build({
        author: `${client.i18n.get(handler.language, "command.premium", "list_title")}`,
        description: str == "" ? "  Nothing" : "\n" + str,
        color: client.color,
      }));
    }

    if (!value) {
      if (pages.length == pagesNum && users.length > 10) {
        if (handler.message) await new Page(client, pages, 60000, handler.language).prefixPage(handler.message);
        else if (handler.interaction) await new Page(client, pages, 60000, handler.language).slashPage(handler.interaction);
        else return;
      } else return handler.editReply({ flags: CV2_FLAG, components: [pages[0]] });
    } else {
      if (isNaN(+value)) return reply(`${client.i18n.get(handler.language, "command.premium", "list_notnumber")}`);
      if (Number(value) > pagesNum) return reply(`${client.i18n.get(handler.language, "command.premium", "list_page_notfound", { page: String(pagesNum) })}`);
      const pageNum = Number(value) == 0 ? 1 : Number(value) - 1;
      return handler.editReply({ flags: CV2_FLAG, components: [pages[pageNum]] });
    }
  }
}
