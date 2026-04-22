import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import { stripIndents } from "common-tags";
import { version } from "discord.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["info"];
  public description = "Shows the information of the Bot";
  public category = "Info";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = [];
  public lavalink = false;
  public options = [];
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();
    const voiceConnections = Array.from(client.players.values()).filter(
      (player) =>
        player.shoukaku &&
        player.voiceId !== null
    ).length;
    const botInfo = stripIndents`\`\`\`
    Codename        | ${client.metadata.codename}
    Bot Version     | ${client.metadata.version}
    Node.js         | ${process.version}
    Discord.js      | ${version}
    Autofix Version | ${client.metadata.autofix}
    Guild Count     | ${client.guilds.cache.size}
    User Count      | ${client.guilds.cache.reduce((a, b) => a + b.memberCount, 0)}
    Active Voices   | ${voiceConnections}
    \`\`\``;
    await handler.editReply({
      flags: CV2_FLAG,
      components: [cv2.build({
        author: client.user!.username,
        fields: [{ name: "Bot Info", value: botInfo }],
        timestamp: true,
        color: client.color,
      })],
    });
  }
}
