import { ButtonStyle, Message } from "discord.js";
import { Manager } from "../../manager.js";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder } from "discord.js";
import { Command, Accessableby } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";

export default class implements Command {
  public name = ["developer"];
  public description = "Shows the developer information of the Bot (Credit)";
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
    const nostepdex = new EmbedBuilder()
      .setTitle(`${client.getString(handler.language, "command.info", "dev_title")}`)
      .setDescription(`${client.getString(handler.language, "command.info", "dev_desc")}`)
      .setFooter({
        text: `${client.getString(handler.language, "command.info", "dev_foot")}`,
      })
      .setColor(client.color);

    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setLabel("Github (krushna06)")
          .setStyle(ButtonStyle.Link)
          .setURL("https://github.com/krushna06")
      )
      .addComponents(
        new ButtonBuilder()
          .setLabel("Support Server")
          .setStyle(ButtonStyle.Link)
          .setURL("https://discord.gg/aNkaHUZyMS")
      );

    await handler.editReply({ embeds: [nostepdex], components: [row1] });
  }
}
