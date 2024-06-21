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
      player.data.set("sudo-destroy", true);
      const is247 = await client.db.autoreconnect.get(`${handler.guild!.id}`);
      player.stop(is247 && is247.twentyfourseven ? false : true);

      const stopped = new EmbedBuilder()
        .setDescription(`${client.i18n.get(handler.language, "button.music", "stop_msg")}`)
        .setColor(client.color)
        .setImage('https://media.discordapp.net/attachments/890634398981042246/1251990013193879562/54.png?ex=6675dc0f&is=66748a8f&hm=d8da087fdf8cc829c1509a651ffd5028768f388d0d1b810c9dd1ce56e55683a6&=&format=webp&quality=lossless&width=1440&height=468'); 

      return handler.editReply({ content: " ", embeds: [stopped] });
    } else {
      await player.skip();

      const skipped = new EmbedBuilder()
        .setDescription(`${client.i18n.get(handler.language, "command.music", "skip_msg")}`)
        .setColor(client.color)
        .setImage('https://media.discordapp.net/attachments/890634398981042246/1251990013193879562/54.png?ex=6675dc0f&is=66748a8f&hm=d8da087fdf8cc829c1509a651ffd5028768f388d0d1b810c9dd1ce56e55683a6&=&format=webp&quality=lossless&width=1440&height=468'); 

      handler.editReply({ content: " ", embeds: [skipped] });
    }
  }
}
