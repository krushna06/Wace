import { ApplicationCommandOptionType } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["filter", "equalizer"];
  public description = "Custom Equalizer!";
  public category = "Filter";
  public accessableby = [Accessableby.Member];
  public usage = "<number>";
  public aliases = ["equalizer"];
  public lavalink = true;
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public permissions = [];
  public options = [
    {
      name: "bands",
      description: "Number of bands to use (max 14 bands.)",
      type: ApplicationCommandOptionType.String,
    },
  ];
  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();
    const value = handler.args[0];
    if (value && isNaN(+value))
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "error", "number_invalid")}`, client.color)],
      });
    const player = client.players.get(handler.guild!.id);
    if (!value) {
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.build({
          author: `${client.i18n.get(handler.language, "command.filter", "eq_author")}`,
          description: `${client.i18n.get(handler.language, "command.filter", "eq_desc")}`,
          fields: [
            {
              name: `${client.i18n.get(handler.language, "command.filter", "eq_field_title")}`,
              value: `${client.i18n.get(handler.language, "command.filter", "eq_field_value", { prefix: handler.prefix })}`,
              inline: false,
            },
          ],
          footer: `${client.i18n.get(handler.language, "command.filter", "eq_footer", { prefix: handler.prefix })}`,
          color: client.color,
        })],
      });
    } else if (value == "off" || value == "reset") return player?.filters.clear();
    const bands = value.split(/[ ]+/);
    let bandsStr = "";
    for (let i = 0; i < bands.length; i++) {
      if (i > 13) break;
      if (isNaN(+bands[i]))
        return handler.editReply({
          flags: CV2_FLAG,
          components: [cv2.simple(`${client.i18n.get(handler.language, "command.filter", "eq_number")}`, client.color)],
        });
      if (Number(bands[i]) > 10)
        return handler.editReply({
          flags: CV2_FLAG,
          components: [cv2.simple(`${client.i18n.get(handler.language, "command.filter", "eq_than")}`, client.color)],
        });
      if (Number(bands[i]) < -10)
        return handler.editReply({
          flags: CV2_FLAG,
          components: [cv2.simple(`${client.i18n.get(handler.language, "command.filter", "eq_greater")}`, client.color)],
        });
    }
    for (let i = 0; i < bands.length; i++) {
      if (i > 13) break;
      player?.filters.setEqualizer([{ band: i, gain: Number(bands[i]) / 10 }]);
      bandsStr += `${bands[i]} `;
    }
    player?.data.set("filter-mode", this.name[0]);
    return handler.editReply({
      flags: CV2_FLAG,
      components: [cv2.simple(`${client.i18n.get(handler.language, "command.filter", "eq_on", { bands: bandsStr })}`, client.color)],
    });
  }
}
