import { ApplicationCommandOptionType } from "discord.js";
import moment from "moment";
import voucher_codes from "voucher-code-generator";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["pm", "generate"];
  public description = "Generate a premium code!";
  public category = "Premium";
  public accessableby = [Accessableby.Admin];
  public usage = "<type> <number>";
  public aliases = ["pmg"];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "plan",
      description: "Avalible: daily, weekly, monthly, yearly",
      required: true,
      type: ApplicationCommandOptionType.String,
      choices: [
        {
          name: "Daily",
          value: "daily",
        },
        {
          name: "Weekly",
          value: "weekly",
        },
        {
          name: "Monthly",
          value: "monthly",
        },
        {
          name: "Yearly",
          value: "yearly",
        },
        {
          name: "Lifetime",
          value: "lifetime",
        },
      ],
    },
    {
      name: "amount",
      description: "The amount of code you want to generate",
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
      await handler.deferReply();
      const plans = this.options[0].choices!.map((data) => data.value);
      const name = handler.args[0];
      const camount = Number(handler.args[1]);
      const reply = (desc: string) => handler.editReply({ flags: CV2_FLAG, components: [cv2.simple(desc, client.color)] });

      if (!name || !plans.includes(name))
        return reply(`${client.i18n.get(handler.language, "error", "arg_error", { text: "**daily**, **weekly**, **monthly**, **yearly**, **lifetime**!" })}`);
      if (!camount)
        return reply(`${client.i18n.get(handler.language, "error", "arg_error", { text: "**Number**!" })}`);

      let codes = [];
      const plan = name;
      let time: number | string;
      switch (plan) {
        case "daily": time = Date.now() + 86400000; break;
        case "weekly": time = Date.now() + 86400000 * 7; break;
        case "monthly": time = Date.now() + 86400000 * 30; break;
        case "yearly": time = Date.now() + 86400000 * 365; break;
        case "lifetime": time = "lifetime"; break;
      }

      let amount = camount;
      if (!amount) amount = 1;

      for (var i = 0; i < amount; i++) {
        const codePremium = voucher_codes.generate({ pattern: "#############-#########-######" });
        const code = codePremium.toString().toUpperCase();
        const find = await client.db.code.get(`${code}`);
        if (!find) {
          await client.db.code.set(`${code}`, { code, plan, expiresAt: time });
          codes.push(`${i + 1} - ${code}`);
        }
      }

      const getDM = await handler.user.createDM(true);
      if (!getDM || !getDM.isDMBased()) return reply(`${client.i18n.get(handler.language, "command.premium", "gen_failed")}`);

      await getDM.send({
        flags: CV2_FLAG,
        components: [cv2.build({
          author: `${client.i18n.get(handler.language, "command.premium", "gen_author")}`,
          description: `${client.i18n.get(handler.language, "command.premium", "gen_desc", { codes_length: String(codes.length), codes: codes.join("\n"), plan: String(plan), expires: time == "lifetime" ? "lifetime" : moment(time as number).format("dddd, MMMM Do YYYY (HH:mm:ss)") })}`,
          footer: `${client.i18n.get(handler.language, "command.premium", "gen_footer", { prefix: "/" })}`,
          color: client.color,
          timestamp: true,
        })],
      });

      return reply(`${client.i18n.get(handler.language, "command.premium", "gen_success")}`);
    }
}