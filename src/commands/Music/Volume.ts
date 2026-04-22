import { ApplicationCommandOptionType } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Player } from "../../structures/Player.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["volume"];
  public description = "Adjusts the volume of the bot.";
  public category = "Music";
  public accessableby = [Accessableby.Member];
  public usage = "<number>";
  public aliases = ["vol"];
  public lavalink = true;
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public permissions = [];
  public options = [
    {
      name: "amount",
      description: "The amount of volume to set the bot to.",
      type: ApplicationCommandOptionType.Number,
      required: true,
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

    const player = client.players.get(handler.guild!.id) as Player;

    if (!value)
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "error", "number_invalid")}`, client.color)],
      });
    if (Number(value) <= 0 || Number(value) > 100)
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.music", "volume_invalid")}`, client.color)],
      });

    await player.setVolume(Number(value));

    client.wsl.get(handler.guild!.id)?.send({
      op: "playerVolume",
      guild: handler.guild!.id,
      volume: player.volume,
    });

    handler.editReply({
      flags: CV2_FLAG,
      components: [cv2.simple(`${client.i18n.get(handler.language, "command.music", "volume_msg", { volume: value })}`, client.color)],
    });
  }
}
