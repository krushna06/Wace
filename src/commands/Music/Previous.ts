import { Manager } from "../../manager.js";
import { EmbedBuilder, Message } from "discord.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Player } from "../../structures/Player.js";

// Main code
export default class implements Command {
  public name = ["previous"];
  public description = "Play the previous song in the queue.";
  public category = "Music";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = ["pre"];
  public lavalink = true;
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public options = [];
  public permissions = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const player = client.players.get(handler.guild!.id) as Player;
    const previousIndex = player.previousQueue.length - 1;

    if (
      player.previousQueue.length == 0 ||
      player.previousQueue[0].uri == player.current?.uri ||
      previousIndex < -1
    )
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "command.music", "previous_notfound")}`
            )
            .setColor(client.color),
        ],
      });

    player.previous();

    player.data.set("endMode", "previous");

    const embed = new EmbedBuilder()
      .setDescription(`${client.i18n.get(handler.language, "command.music", "previous_msg")}`)
      .setColor(client.color);

    handler.editReply({ content: " ", embeds: [embed] });
  }
}
