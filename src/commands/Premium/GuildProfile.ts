import moment from "moment";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["pm", "guild", "profile"];
  public description = "View your guild premium profile!";
  public category = "Premium";
  public accessableby = [Accessableby.GuildPremium];
  public usage = "";
  public aliases = ["pmgp"];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
      await handler.deferReply();

      const PremiumPlan = await client.db.preGuild.get(`${handler.guild?.id}`);

      if (!PremiumPlan) {
        return handler.editReply({
          flags: CV2_FLAG,
          components: [cv2.build({
            author: `${client.i18n.get(handler.language, "error", "no_premium_author")}`,
            description: `${client.i18n.get(handler.language, "error", "no_guild_premium_desc")}`,
            color: client.color,
            timestamp: true,
          })],
        });
      }

      const expires = moment(PremiumPlan.expiresAt !== "lifetime" ? PremiumPlan.expiresAt : 0).format("dddd, MMMM Do YYYY (HH:mm:ss)");

      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.build({
          author: `${client.i18n.get(handler.language, "command.premium", "guild_profile_author")}`,
          description: `${client.i18n.get(handler.language, "command.premium", "guild_profile_desc", { guild: String(handler.guild?.name), plan: PremiumPlan.plan, expires: PremiumPlan.expiresAt == "lifetime" ? "lifetime" : expires })}`,
          color: client.color,
          timestamp: true,
        })],
      });
    }
}