import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["filter", "nightcore"];
  public description = "Turning on nightcore filter";
  public category = "Filter";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = ["nightcore"];
  public lavalink = true;
  public options = [];
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public permissions = [];
  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();
    const player = client.players.get(handler.guild!.id);
    if (player?.data.get("filter-mode") == this.name[0])
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.filter", "filter_already", { name: this.name[0] })}`, client.color)],
      });
    player?.data.set("filter-mode", this.name[0]);
    player?.filters.set("nightcore");
    await handler.editReply({
      flags: CV2_FLAG,
      components: [cv2.simple(`${client.i18n.get(handler.language, "command.filter", "filter_on", { name: this.name[0] })}`, client.color)],
    });
  }
}
