import { ApplicationCommandOptionType } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

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
        { name: "German", value: "de" },
        { name: "Hindi", value: "hi" },
        { name: "Korean", value: "ko" },
        { name: "Russian", value: "ru" },
        { name: "Spanish", value: "es" },
        { name: "Turkish", value: "tr" },
      ],
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const input = handler.args[0];

    const languages = client.i18n.getLocales();

    if (!languages.includes(input as string)) {
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.utils", "provide_lang", { languages: languages.join(", ") })}`, client.color)],
      });
    }

    const newLang = await client.db.language.get(`${handler.guild!.id}`);

    if (!newLang) {
      await client.db.language.set(`${handler.guild!.id}`, input);
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.utils", "lang_set", { language: String(input) })}`, client.color)],
      });
    } else if (newLang) {
      await client.db.language.set(`${handler.guild!.id}`, input);
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.utils", "lang_change", { language: String(input) })}`, client.color)],
      });
    }
  }
}
