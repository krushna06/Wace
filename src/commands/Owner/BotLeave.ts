import { ApplicationCommandOptionType } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["botleave"];
  public description = "Force the bot to leave a guild by ID";
  public category = "Owner";
  public accessableby = [Accessableby.Owner];
  public usage = "<guild_id>";
  public aliases = ["bleave"];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];

  public options = [
    {
      name: "guild_id",
      description: "The ID of the guild to leave",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const guildId = handler.args[0];

    if (!guildId) {
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple("`⚠️` | Please provide a guild ID.", client.color)],
      });
    }

    const guild = client.guilds.cache.get(guildId);

    if (!guild) {
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`\`⚠️\` | Guild \`${guildId}\` not found or the bot is not in it.`, client.color)],
      });
    }

    const guildName = guild.name;

    const player = client.players.get(guildId);
    if (player) {
      await player.destroy().catch(() => null);
    }

    await guild.leave();

    return handler.editReply({
      flags: CV2_FLAG,
      components: [cv2.simple(`\`✅\` | Left guild **${guildName}** (\`${guildId}\`).`, client.color)],
    });
  }
}
