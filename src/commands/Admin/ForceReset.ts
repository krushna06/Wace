import { PermissionsBitField } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Player } from "../../structures/Player.js";
import { AutoReconnectBuilderService } from "../../services/AutoReconnectBuilderService.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

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
    const player = client.players.get(handler.guild!.id) as Player | undefined;
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
    await handler.editReply({
      flags: CV2_FLAG,
      components: [cv2.simple("Successfully force reset the music player and settings.", client.color)],
    });
  }
}
