import { Manager } from "../../manager.js";
import { ApplicationCommandOptionType } from "discord.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["filter", "bass", "bassboost"];
  public description = "Turning on bassboost filter";
  public category = "Filter";
  public accessableby = [Accessableby.Member];
  public usage = "<number>";
  public aliases = ["bassboost"];
  public lavalink = true;
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public permissions = [];
  public options = [
    {
      name: "amount",
      description: "The amount of the bassboost",
      type: ApplicationCommandOptionType.Number,
    },
  ];
  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();
    const value = handler.args[0];
    if (value && isNaN(+value))
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.filter", "filter_number")}`, client.color)],
      });
    const player = client.players.get(handler.guild!.id);
    if (!value) {
      await player?.filters.set("bass");
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.filter", "filter_on", { name: "Bassboost" })}`, client.color)],
      });
    }
    if (Number(value) > 10 || Number(value) < -10)
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.filter", "bassboost_limit")}`, client.color)],
      });
    await player?.filters.set("bass");
    player?.data.set("filter-mode", this.name[1]);
    return handler.editReply({
      flags: CV2_FLAG,
      components: [cv2.simple(`${client.i18n.get(handler.language, "command.filter", "bassboost_set", { amount: value })}`, client.color)],
    });
  }
}
