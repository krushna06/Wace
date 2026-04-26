import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["filter", "doubletime"];
  public description = "Turning on doubletime filter";
  public category = "Filter";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = ["doubletime"];
  public lavalink = true;
  public options = [];
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public permissions = [];
  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();
    const player = client.players.get(handler.guild!.id);
    player?.data.set("filter-mode", this.name[1]);
    await player?.filters.set("doubletime");
    await handler.editReply({
      flags: CV2_FLAG,
      components: [cv2.simple(`${client.i18n.get(handler.language, "command.filter", "filter_on", { name: this.name[1] })}`, client.color)],
    });
  }
}
