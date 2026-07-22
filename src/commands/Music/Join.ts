import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["join"];
  public description = "Make the bot join the voice channel.";
  public category = "Music";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = ["j"];
  public lavalink = true;
  public options = [];
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const { channel } = handler.member!.voice;
    if (!channel)
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "error", "no_in_voice")}`, client.color)],
      });

    let player = client.players.get(handler.guild!.id);

    if (!player) {
      try {
        player = await client.playerManager.create({
          guildId: handler.guild!.id,
          voiceId: handler.member!.voice.channel!.id,
          textId: handler.channel!.id,
          shardId: handler.guild?.shardId ?? 0,
          deaf: true,
          volume: client.config.player.DEFAULT_VOLUME,
        });
      } catch (error) {
        client.logger.error("Join.execute", `Failed to create player: ${error}`);
        return handler.editReply({
          flags: CV2_FLAG,
          components: [cv2.simple(`Failed to join voice channel. Please try again.`, client.color)],
        });
      }
    } else if (player && !this.checkSameVoice(client, handler, handler.language)) {
      return;
    }

    player.textId = handler.channel!.id;

    handler.editReply({
      flags: CV2_FLAG,
      components: [cv2.simple(`${client.i18n.get(handler.language, "command.music", "join_msg", { channel: String(channel) })}`, client.color)],
    });
  }

  checkSameVoice(client: Manager, handler: CommandHandler, language: string) {
    if (handler.member!.voice.channel !== handler.guild!.members.me!.voice.channel) {
      handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "error", "no_same_voice")}`, client.color)],
      });
      return false;
    } else if (handler.member!.voice.channel === handler.guild!.members.me!.voice.channel) {
      handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(handler.language, "command.music", "join_already", { channel: String(handler.member!.voice.channel) })}`, client.color)],
      });
      return false;
    }

    return true;
  }
}
