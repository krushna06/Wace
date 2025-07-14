import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";

export default class implements Command {
  public name = ["stats"];
  public description = "Show user or guild stats (songs played, commands executed)";
  public category = "Info";
  public accessableby = [Accessableby.Member];
  public usage = "/stats [type]";
  public aliases = [];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "type",
      description: "Stats type (user or guild)",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "User", value: "user" },
        { name: "Guild", value: "guild" },
      ],
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();
    const type = handler.args[0];
    let embed;
    if (type === "user") {
      const key = `${handler.user?.id}:${handler.guild?.id}`;
      const stats = await client.db.userStats.get(key);
      embed = new EmbedBuilder()
        .setTitle(`User Stats for ${handler.user?.username}`)
        .setColor(client.color)
        .addFields(
          { name: "Songs Played", value: String(stats?.songsPlayed ?? 0), inline: true },
          { name: "Commands Executed", value: String(stats?.commandsExecuted ?? 0), inline: true }
        );
    } else if (type === "guild") {
      const stats = await client.db.guildStats.get(handler.guild?.id);
      embed = new EmbedBuilder()
        .setTitle(`Guild Stats for ${handler.guild?.name}`)
        .setColor(client.color)
        .addFields(
          { name: "Songs Played", value: String(stats?.songsPlayed ?? 0), inline: true },
          { name: "Commands Executed", value: String(stats?.commandsExecuted ?? 0), inline: true }
        );
    } else {
      embed = new EmbedBuilder()
        .setDescription("Invalid type. Use 'user' or 'guild'.")
        .setColor(client.color);
    }
    await handler.editReply({ embeds: [embed] });
  }
} 