import { ApplicationCommandOptionType, User } from "discord.js";
import moment from "moment";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler, ParseMentionEnum } from "../../structures/CommandHandler.js";
import { Premium } from "../../database/schema/Premium.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["pm", "profile"];
  public description = "View your premium profile!";
  public category = "Premium";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = [];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "user",
      description: "Type your user here",
      type: ApplicationCommandOptionType.User,
      required: false,
    },
  ];

  private profileEmbed(client: Manager, handler: CommandHandler, plan: string, expires: string) {
    return handler.editReply({
      flags: CV2_FLAG,
      components: [cv2.build({
        author: `${client.i18n.get(handler.language, "command.premium", "profile_author")}`,
        description: `${client.i18n.get(handler.language, "command.premium", "profile_desc", { user: String(handler.user?.tag), plan, expires })}`,
        color: client.color,
        timestamp: true,
      })],
    });
  }

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    let user = handler.user;
    const data = handler.args[0];
    const getData = await handler.parseMentions(data);
    if (data && getData && getData.type == ParseMentionEnum.USER) user = getData.data as User;

    if (user?.id == client.owner) return this.profileEmbed(client, handler, "wace@owner", "lifetime");
    if (client.config.bot.ADMIN.includes(user?.id ?? "null")) return this.profileEmbed(client, handler, "wace@admin", "lifetime");

    const PremiumPlan = (await client.db.premium.get(`${handler.user?.id}`)) as Premium;

    if (!PremiumPlan) {
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.build({
          author: `${client.i18n.get(handler.language, "command.premium", "profile_author")}`,
          description: `${client.i18n.get(handler.language, "command.premium", "profile_error_desc", { user: String(user?.username) })}`,
          color: client.color,
          timestamp: true,
        })],
      });
    }

    const expires = moment(PremiumPlan.expiresAt !== "lifetime" ? PremiumPlan.expiresAt : 0).format("dddd, MMMM Do YYYY (HH:mm:ss)");
    return this.profileEmbed(client, handler, PremiumPlan.plan, PremiumPlan.expiresAt == "lifetime" ? "lifetime" : expires);
  }
}
