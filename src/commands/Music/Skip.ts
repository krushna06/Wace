import { EmbedBuilder, Message } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { WacelinkPlayer } from "../../wacelink/main.js";

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

    const player = client.wacelink.players.get(handler.guild!.id) as WacelinkPlayer;

    if (player.queue.size == 0 && player.data.get("autoplay") !== true) {
      const skipped = new EmbedBuilder()
        .setDescription(`${client.getString(handler.language, "command.music", "skip_notfound")}`)
        .setColor(client.color);

      handler.editReply({ content: " ", embeds: [skipped] });
    } else {
      await player.skip();

      const skipped = new EmbedBuilder()
        .setDescription(`${client.getString(handler.language, "command.music", "skip_msg")}`)
        .setColor(client.color);

      handler.editReply({ content: " ", embeds: [skipped] });
    }
  }
}
