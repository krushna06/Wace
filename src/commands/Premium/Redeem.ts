import { ApplicationCommandOptionType } from "discord.js";
import moment from "moment";
import { Accessableby, Command } from "../../structures/Command.js";
import { Manager } from "../../manager.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Premium } from "../../database/schema/Premium.js";
import { GuildPremium } from "../../database/schema/GuildPremium.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["pm", "redeem"];
  public description = "Redeem your premium!";
  public category = "Premium";
  public accessableby = [Accessableby.Member];
  public usage = "<type> <input>";
  public aliases = [];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "type",
      description: "Which type you want to redeem?",
      required: true,
      type: ApplicationCommandOptionType.String,
      choices: [
        { name: "User", value: "user" },
        { name: "Guild", value: "guild" },
      ],
    },
    {
      name: "code",
      description: "The code you want to redeem",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();
    const avaliableMode = this.options[0].choices!.map((d) => d.value);
    const type = handler.args[0];
    const input = handler.args[1];
    const reply = (desc: string) => handler.editReply({ flags: CV2_FLAG, components: [cv2.simple(desc, client.color)] });

    if (!type || !avaliableMode.includes(type))
      return reply(`${client.i18n.get(handler.language, "command.premium", "redeem_invalid_mode")}`);
    if (!input)
      return reply(`${client.i18n.get(handler.language, "command.premium", "redeem_invalid")}`);

    let preData = await client.db.premium.get(`${handler.user?.id}`);
    if (type == "guild") preData = await client.db.preGuild.get(`${handler.guild?.id}`);

    if (preData && preData.isPremium)
      return reply(`${client.i18n.get(handler.language, "command.premium", type == "guild" ? "redeem_already_guild" : "redeem_already")}`);

    const premium = await client.db.code.get(`${input.toUpperCase()}`);
    if (!premium || (premium.expiresAt !== "lifetime" && premium.expiresAt < Date.now()))
      return reply(`${client.i18n.get(handler.language, "command.premium", "redeem_invalid")}`);

    const expires = moment(premium.expiresAt !== "lifetime" ? premium.expiresAt : 0).format("dddd, MMMM Do YYYY (HH:mm:ss)");

    await handler.editReply({
      flags: CV2_FLAG,
      components: [cv2.build({
        author: `${client.i18n.get(handler.language, "command.premium", "redeem_title")}`,
        description: `${client.i18n.get(handler.language, "command.premium", "redeem_desc", { expires: premium.expiresAt !== "lifetime" ? expires : "lifetime", plan: premium.plan })}`,
        color: client.color,
        timestamp: true,
      })],
    });

    await client.db.code.delete(`${input.toUpperCase()}`);

    if (type == "guild") {
      const newPreGuild = await client.db.preGuild.set(`${handler.guild?.id}`, {
        id: String(handler.guild?.id),
        isPremium: true,
        redeemedBy: { id: String(handler.guild?.id), name: String(handler.guild?.name), createdAt: Number(handler.guild?.createdAt.getTime()), ownerId: String(handler.guild?.ownerId) },
        redeemedAt: Date.now(),
        expiresAt: premium.expiresAt,
        plan: premium.plan,
      });
      await this.sendRedeemLog(client, handler, null, newPreGuild);
      return;
    }
    const newPreUser = await client.db.premium.set(`${handler.user?.id}`, {
      id: String(handler.user?.id),
      isPremium: true,
      redeemedBy: { id: String(handler.user?.id), username: String(handler.user?.username), displayName: String(handler.user?.displayName), avatarURL: handler.user?.avatarURL() ?? null, createdAt: Number(handler.user?.createdAt.getTime()), mention: `<@${handler.user?.id}>` },
      redeemedAt: Date.now(),
      expiresAt: premium.expiresAt,
      plan: premium.plan,
    });
    await this.sendRedeemLog(client, handler, newPreUser, null);
  }

  protected async sendRedeemLog(client: Manager, handler: CommandHandler, premium: Premium | null, guildPremium: GuildPremium | null): Promise<void> {
    if (!client.config.utilities.PREMIUM_LOG_CHANNEL) return;
    const language = client.config.bot.LANGUAGE;

    const redeemedAt = premium ? premium.redeemedAt : guildPremium ? guildPremium.redeemedAt : 0;
    const expiresAt = premium ? premium.expiresAt : guildPremium ? guildPremium.expiresAt : 0;
    const plan = premium ? premium.plan : guildPremium ? guildPremium.plan : "wace@error";

    try {
      const channel = await client.channels.fetch(client.config.utilities.PREMIUM_LOG_CHANNEL).catch(() => undefined);
      if (!channel || !channel.isTextBased()) return;
      channel.messages.channel.send({
        flags: CV2_FLAG,
        components: [cv2.build({
          author: `${client.i18n.get(language, "event.premium", premium ? "title" : "guild_title")}`,
          color: client.color,
          timestamp: true,
          fields: [
            ...(premium ? [{ name: `${client.i18n.get(language, "event.premium", "username")}`, value: `${handler.user?.username}` }] : []),
            { name: `${client.i18n.get(language, "event.premium", "display_name")}`, value: `${premium ? handler.user?.displayName : handler.guild?.name}` },
            { name: "ID", value: `${premium ? handler.user?.id : handler.guild?.id}` },
            { name: `${client.i18n.get(language, "event.premium", "redeemedAt")}`, value: `${moment(redeemedAt).format("dddd, MMMM Do YYYY (HH:mm:ss)")}` },
            { name: `${client.i18n.get(language, "event.premium", "expiresAt")}`, value: `${expiresAt == "lifetime" ? "lifetime" : moment(expiresAt).format("dddd, MMMM Do YYYY (HH:mm:ss)")}` },
            { name: `${client.i18n.get(language, "event.premium", "plan")}`, value: `${plan}` },
          ],
        })],
      });
    } catch {}
  }
}
