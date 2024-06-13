import { EmbedBuilder, ApplicationCommandOptionType } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";

export default class implements Command {
  public name = ["language"];
  public description = "Change the language for the bot";
  public category = "Utils";
  public accessableby = [Accessableby.Manager];
  public usage = "<language>";
  public aliases = ["lang", "language"];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  public options = [
    {
      name: "language",
      description: "Select the new language",
      required: true,
      type: ApplicationCommandOptionType.String,
      choices: [
        { name: "English", value: "en" },
        { name: "French", value: "fr" },
        { name: "Hindi", value: "hi" },
        { name: "Korean", value: "ko" },
        { name: "Russian", value: "ru" },
        { name: "Turkish", value: "tu" },
        { name: "French (Incomplete)", value: "fr" },
        { name: "German (Incomplete)", value: "gr" },
        { name: "Spanish (Incomplete)", value: "sp" },
      ],
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const input = handler.args[0];

    const languages = client.i18n.getLocales();

    if (!languages.includes(input as string)) {
      const embed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(handler.language, "command.utils", "provide_lang", {
            languages: languages.join(", "),
          })}`
        )
        .setColor(client.color);
      return handler.editReply({ content: " ", embeds: [embed] });
    }

    const newLang = await client.db.language.get(`${handler.guild!.id}`);

    if (!newLang) {
      await client.db.language.set(`${handler.guild!.id}`, input);
      const embed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(handler.language, "command.utils", "lang_set", {
            language: String(input),
          })}`
        )
        .setColor(client.color);

      return handler.editReply({ content: " ", embeds: [embed] });
    } else if (newLang) {
      await client.db.language.set(`${handler.guild!.id}`, input);

      const embed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(handler.language, "command.utils", "lang_change", {
            language: String(input),
          })}`
        )
        .setColor(client.color);

      return handler.editReply({ content: " ", embeds: [embed] });
    }
  }
}
