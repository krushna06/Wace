import { ApplicationCommandOptionType } from "discord.js";
import { Manager } from "../../manager.js";
import { AutoReconnectBuilderService } from "../../services/AutoReconnectBuilderService.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Player } from "../../structures/Player.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["loop"];
  public description = "Loop song in queue type all/current!";
  public category = "Music";
  public accessableby = [Accessableby.Member];
  public usage = "<mode>";
  public aliases = [];
  public lavalink = true;
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public permissions = [];
  public options = [
    {
      name: "type",
      description: "Type of loop",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Song", value: "track" },
        { name: "Queue", value: "queue" },
        { name: "None", value: "none" },
      ],
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const player = client.players.get(handler.guild!.id) as Player;

    const mode_array = ["track", "queue", "none"];

    const mode = handler.args[0];

    if (!mode_array.includes(mode))
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.music", "loop_invalid", { mode: this.changeBold(mode_array).join(", ") })}`, client.color)],
      });

    if ((mode == "track" && player.loop == "track") || mode == player.loop)
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.music", "loop_already", { mode: mode })}`, client.color)],
      });

    if (mode == "track") {
      player.setLoop("track");
      if (client.config.utilities.AUTO_RESUME)
        this.setLoop247(client, player, "track");

      handler.editReply({ flags: CV2_FLAG, components: [cv2.simple(`${client.i18n.get(handler.language, "command.music", "loop_current")}`, client.color)] });
    } else if (mode == "queue") {
      player.setLoop("queue");
      if (client.config.utilities.AUTO_RESUME)
        this.setLoop247(client, player, "queue");

      handler.editReply({ flags: CV2_FLAG, components: [cv2.simple(`${client.i18n.get(handler.language, "command.music", "loop_all")}`, client.color)] });
    } else if (mode === "none") {
      player.setLoop("none");
      if (client.config.utilities.AUTO_RESUME)
        this.setLoop247(client, player, "none");

      handler.editReply({ flags: CV2_FLAG, components: [cv2.simple(`${client.i18n.get(handler.language, "command.music", "unloop_all")}`, client.color)] });
    }

    client.wsl.get(handler.guild!.id)?.send({
      op: "playerLoop",
      guild: handler.guild!.id,
      mode: mode,
    });
  }

  async setLoop247(client: Manager, player: Player, loop: string) {
    const data = await new AutoReconnectBuilderService(client, player).execute(player.guildId);
    if (data) {
      await client.db.autoreconnect.set(`${player.guildId}.config.loop`, loop);
    }
  }

  changeBold(arrayMode: string[]) {
    const res = [];
    for (const data of arrayMode) {
      res.push(`**${data}**`);
    }
    return res;
  }
}
