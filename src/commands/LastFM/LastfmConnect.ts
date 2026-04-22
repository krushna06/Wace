import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["lastfm-connect"];
  public description = "Connect your Last.fm account to the bot";
  public category = "LastFM";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = ["lastfm", "lfm-connect"];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
      await handler.deferReply();
      const discordId = handler.user?.id;
      if (!discordId) return handler.editReply({ content: "Could not determine your Discord user ID." });

      const apiKey = client.config.player.LASTFM.api_key;
      const callbackBaseUrl = client.config.player.LASTFM.callback_url || "http://localhost:3001/api/lastfm/callback";
      const callbackUrl = `${callbackBaseUrl}?discord_id=${discordId}`;
      const authUrl = `https://www.last.fm/api/auth/?api_key=${apiKey}&cb=${encodeURIComponent(callbackUrl)}`;

      return handler.editReply({ flags: CV2_FLAG, components: [cv2.build({ title: "Connect your Last.fm account", description: `To connect your Last.fm account, [click here to authorize](${authUrl}).\n\nAfter authorizing, you can use /track to see your current track!`, color: client.color })] });
    }
}