import { ApplicationCommandOptionType } from "discord.js";
import { Manager } from "../../manager.js";
import { AutoReconnectBuilderService } from "../../services/AutoReconnectBuilderService.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["247"];
  public description = "24/7 in voice channel";
  public category = "Utils";
  public accessableby = [Accessableby.Manager];
  public usage = "<enable> or <disable>";
  public aliases = [];
  public lavalink = true;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  public options = [
    {
      name: "type",
      description: "Choose enable or disable",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Enable", value: "enable" },
        { name: "Disable", value: "disable" },
      ],
    },
  ];
  public playerCheck = false;

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    let player = client.players.get(handler.guild!.id);

    const value = handler.args[0];

    const reconnectBuilder = new AutoReconnectBuilderService(client, player);

    const data = await reconnectBuilder.execute(handler.guild?.id!);

    if (value == "disable") {
      if (!data.twentyfourseven) {
        return handler.editReply({
          flags: CV2_FLAG,
          components: [cv2.simple(`${client.i18n.get(handler.language, "command.utils", "247_already", { mode: handler.modeLang.disable })}`, client.color)],
        });
      }

      data.current || data.current.length !== 0
        ? await client.db.autoreconnect.set(`${handler.guild!.id}.twentyfourseven`, false)
        : await client.db.autoreconnect.delete(`${handler.guild!.id}`);

      player ? player.data.set("sudo-destroy", true) : true;
      player && player.voiceId && handler.member!.voice.channel == null ? player.destroy() : true;

      handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.utils", "247_off")}`, client.color)],
      });
    } else if (value == "enable") {
      const { channel } = handler.member!.voice;
      if (!channel || handler.member!.voice.channel == null)
        return handler.editReply({
          flags: CV2_FLAG,
          components: [cv2.simple(`${client.i18n.get(handler.language, "error", "no_in_voice")}`, client.color)],
        });

      if (data.twentyfourseven) {
        return handler.editReply({
          flags: CV2_FLAG,
          components: [cv2.simple(`${client.i18n.get(handler.language, "command.utils", "247_already", { mode: handler.modeLang.enable })}`, client.color)],
        });
      }

      if (!player)
        player = await client.playerManager.create({
          guildId: handler.guild!.id,
          voiceId: handler.member!.voice.channel!.id,
          textId: String(handler.channel?.id),
          shardId: handler.guild?.shardId ?? 0,
          deaf: true,
          volume: client.config.player.DEFAULT_VOLUME,
        });

      data.voice
        ? await client.db.autoreconnect.set(`${handler.guild!.id}.twentyfourseven`, true)
        : new AutoReconnectBuilderService(client, player).playerBuild(player?.guildId, true);

      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.utils", "247_on")}`, client.color)],
      });
    } else {
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "error", "arg_error", { text: "**enable** or **disable**!" })}`, client.color)],
      });
    }
  }
}
