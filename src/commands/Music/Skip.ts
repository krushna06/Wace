import { EmbedBuilder, Message } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Player } from "../../structures/Player.js";

// Main code
export default class implements Command {
  public name = ["skip"];
  public description = "Skips the song currently playing.";
  public category = "Music";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = [];
  public lavalink = true;
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public permissions = [];
  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const player = client.players.get(handler.guild!.id) as Player;

    if (player.queue.length == 0 && player.data.get("autoplay") !== true) {
      player.data.set("sudo-destroy", true);
      const is247 = await client.db.autoreconnect.get(`${handler.guild!.id}`);
      player.stop(is247 && is247.twentyfourseven ? false : true);

      const stopped = new EmbedBuilder()
        .setDescription(`${client.i18n.get(handler.language, "button.music", "stop_msg")}`)
        .setColor(client.color);

      return handler.editReply({ content: " ", embeds: [stopped] });
    } else {
      await player.skip();

      const skipped = new EmbedBuilder()
        .setDescription(`${client.i18n.get(handler.language, "command.music", "skip_msg")}`)
        .setColor(client.color);

      handler.editReply({ content: " ", embeds: [skipped] });
    }
  }
}
