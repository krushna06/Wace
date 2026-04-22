import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import os from "os";
import ms from "pretty-ms";
import { stripIndents } from "common-tags";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import { version } from "discord.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["host"];
  public description = "Show the host information/status!";
  public category = "Info";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = [];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const total = os.totalmem() / 1024 / 1024;
    const used = process.memoryUsage().rss / 1024 / 1024;
    const heapUsed = process.memoryUsage().heapUsed / 1024 / 1024;
    const heapTotal = os.totalmem() / 1024 / 1024;

    const botInfo = stripIndents`\`\`\`
      - Codename: ${client.metadata.codename}
      - Bot version: ${client.metadata.version}
      - Autofix version: ${client.metadata.autofix}
      - Discord.js: ${version}
      - WebSocket Ping: ${client.ws.ping}ms
      - Guild Count: ${client.guilds.cache.size}
      - User count: ${client.guilds.cache.reduce((a, b) => a + b.memberCount, 0)}
    \`\`\``;

    const hostInfo = stripIndents`\`\`\`
      - OS: ${os.type()} ${os.release()} (${os.arch()})
      - CPU: ${os.cpus()[0].model}
      - Uptime: ${ms(client.uptime as number)}
      - RAM: ${(total / 1024).toFixed(2)} GB
      - Memory Usage: ${used.toFixed(2)}/${total.toFixed(2)} (MB)
      - ├── RSS: ${used.toFixed(2)} MB
      - ├── Used Heap: ${heapUsed.toFixed(2)} MB
      - ├── Total Heap: ${heapTotal.toFixed(2)} MB
      - ├── Heap Usage: ${((heapUsed / heapTotal) * 100).toFixed(2)}%
      - └── External: ${(process.memoryUsage().external / 1024 / 1024).toFixed(2)} MB
      - Node.js: ${process.version}
    \`\`\``;

    const prevButton = new ButtonBuilder()
      .setLabel("Previous")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId("prev");

    const homeButton = new ButtonBuilder()
      .setLabel("Home")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId("home");

    const nextButton = new ButtonBuilder()
      .setLabel("Next")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId("next");

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      prevButton,
      homeButton,
      nextButton
    );

    const initialMessage = await handler.editReply({
      flags: CV2_FLAG,
      components: [
        cv2.build({
          title: "Host Information",
          description: hostInfo,
          color: client.color,
          components: [actionRow],
        }),
      ],
    });

    let currentPage = "hostInfo";

    const buildPage = (title: string, description: string, row: ActionRowBuilder<ButtonBuilder>) =>
      cv2.build({ title, description, color: client.color, components: [row] });

    const filter = (i) => i.user.id === handler.user.id;
    // @ts-ignore
    const collector = handler.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on("collect", async (i) => {
      await i.deferUpdate();

      if (i.customId === "home") {
        currentPage = "hostInfo";
        await i.editReply({ flags: CV2_FLAG, components: [buildPage("Host Information", hostInfo, actionRow)] });
      } else if (i.customId === "prev" || i.customId === "next") {
        if (currentPage === "hostInfo") {
          currentPage = "botInfo";
          await i.editReply({ flags: CV2_FLAG, components: [buildPage("Bot Information", botInfo, actionRow)] });
        } else {
          currentPage = "hostInfo";
          await i.editReply({ flags: CV2_FLAG, components: [buildPage("Host Information", hostInfo, actionRow)] });
        }
      }
    });

    const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      prevButton.setDisabled(true),
      homeButton.setDisabled(true),
      nextButton.setDisabled(true)
    );

    collector.on("end", async () => {
      try {
        const title = currentPage === "hostInfo" ? "Host Information" : "Bot Information";
        const description = currentPage === "hostInfo" ? hostInfo : botInfo;
        await initialMessage.edit({ flags: CV2_FLAG, components: [buildPage(title, description, disabledRow)] });
      } catch (error) {
        if (error.code !== 10008) console.error("Failed to edit the message:", error);
      }
    });
  }
}
