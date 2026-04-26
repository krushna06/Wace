import { ApplicationCommandOptionType } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["leaveserver"];
  public description = "Force the bot to leave a server by ID";
  public category = "Owner";
  public accessableby = [Accessableby.Owner];
  public usage = "<server_id>";
  public aliases = ["sleave"];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];

  public options = [
    {
      name: "server_id",
      description: "The ID of the server to leave",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const serverId = handler.args[0];

    if (!serverId) {
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple("`⚠️` | Please provide a server ID.", client.color)],
      });
    }

    const guild = client.guilds.cache.get(serverId);

    if (!guild) {
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`\`⚠️\` | Server \`${serverId}\` not found or the bot is not in it.`, client.color)],
      });
    }

    const serverName = guild.name;

    const player = client.players.get(serverId);
    if (player) {
      await player.destroy().catch(() => null);
    }

    await guild.leave();

    return handler.editReply({
      flags: CV2_FLAG,
      components: [cv2.simple(`\`✅\` | Left server **${serverName}** (\`${serverId}\`).`, client.color)],
    });
  }
}
