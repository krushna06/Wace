import { EmbedBuilder, PermissionsBitField } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { WacelinkPlayer } from "../../wacelink/main.js";
import { AutoReconnectBuilderService } from "../../services/AutoReconnectBuilderService.js";

export default class implements Command {
  public name = ["forcereset"];
  public description = "Force reset the music player and settings (Admin only)";
  public category = "Admin";
  public accessableby = [Accessableby.Manager];
  public usage = "";
  public aliases = ["freset"];
  public lavalink = true;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [PermissionsBitField.Flags.Administrator];
  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const player = client.wacelink.players.get(handler.guild!.id) as WacelinkPlayer | undefined;

    const reconnectBuilder = new AutoReconnectBuilderService(client, player);
    const data = await reconnectBuilder.get(handler.guild!.id);
    
    if (data && data.twentyfourseven) {
      await reconnectBuilder.build247(handler.guild!.id, false, data.voice);
    }

    if (player) {
      try {
        player.data.set("sudo-destroy", true);
        await player.destroy();
      } catch (error) {
        client.logger.error("ForceReset", `Error destroying player: ${error}`);
      }
    }

    const embed = new EmbedBuilder()
      .setDescription("Successfully force reset the music player and settings.")
      .setColor(client.color);

    await handler.editReply({ content: " ", embeds: [embed] });
  }
}
