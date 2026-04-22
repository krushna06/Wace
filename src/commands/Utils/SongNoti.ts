import { ApplicationCommandOptionType } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { SongNotiEnum } from "../../database/schema/SongNoti.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["songnoti"];
  public description = "Enable or disable the player control notifications";
  public category = "Utils";
  public accessableby = [Accessableby.Manager];
  public usage = "<enable> or <disable>";
  public aliases = ["song-noti", "snt", "sn"];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  public options = [
    {
      name: "type",
      description: "Choose enable or disable",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Enable", value: "enable" },
        { name: "Disable", value: "disable" },
      ],
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const value = handler.args[0];
    const originalValue = await client.db.songNoti.get(`${handler.guild!.id}`);

    if (value === "enable") {
      if (originalValue === SongNotiEnum.Enable)
        return handler.editReply({
          flags: CV2_FLAG,
          components: [cv2.simple(`${client.i18n.get(handler.language, "command.utils", "songnoti_already", { mode: handler.modeLang.enable })}`, client.color)],
        });

      await client.db.songNoti.set(`${handler.guild!.id}`, SongNotiEnum.Enable);

      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.utils", "songnoti_set", { toggle: handler.modeLang.enable })}`, client.color)],
      });
    } else if (value === "disable") {
      if (originalValue === SongNotiEnum.Disable)
        return handler.editReply({
          flags: CV2_FLAG,
          components: [cv2.simple(`${client.i18n.get(handler.language, "command.utils", "songnoti_already", { mode: handler.modeLang.disable })}`, client.color)],
        });

      await client.db.songNoti.set(`${handler.guild!.id}`, SongNotiEnum.Disable);
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.utils", "songnoti_set", { toggle: handler.modeLang.disable })}`, client.color)],
      });
    } else {
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "error", "arg_error", { text: "**enable** or **disable**!" })}`, client.color)],
      });
    }
  }
}
