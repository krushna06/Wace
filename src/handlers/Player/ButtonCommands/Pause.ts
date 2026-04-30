import { ButtonInteraction, TextChannel, VoiceBasedChannel } from "discord.js";
import { Manager } from "../../../manager.js";
import { Player } from "../../../structures/Player.js";
import { cv2, CV2_FLAG } from "../../../utilities/ComponentsV2.js";

export class ButtonPause {
  client: Manager;
  interaction: ButtonInteraction;
  channel: VoiceBasedChannel | null;
  language: string;
  player: Player;
  constructor(
    client: Manager,
    interaction: ButtonInteraction,
    channel: VoiceBasedChannel | null,
    language: string,
    player: Player
  ) {
    this.channel = channel;
    this.client = client;
    this.language = language;
    this.player = player;
    this.interaction = interaction;
    this.execute();
  }

  async execute() {
    let data = await this.client.db.setup.get(`${this.player.guildId}`);
    if (!data) return;
    if (data.enable === false) return;

    if (!this.channel) {
      this.interaction.reply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${this.client.i18n.get(this.language, "error", "no_in_voice")}`, this.client.color)],
      });
      return;
    } else if (
      this.interaction.guild!.members.me!.voice.channel &&
      !this.interaction.guild!.members.me!.voice.channel.equals(this.channel)
    ) {
      this.interaction.reply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${this.client.i18n.get(this.language, "error", "no_same_voice")}`, this.client.color)],
      });
      return;
    } else if (!this.player) {
      this.interaction.reply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${this.client.i18n.get(this.language, "error", "no_player")}`, this.client.color)],
      });
      return;
    } else {
      const getChannel = await this.client.channels.fetch(data.channel).catch(() => undefined);
      if (!getChannel) return;
      let playMsg = await (getChannel as TextChannel)!.messages
        .fetch(data.playmsg)
        .catch(() => undefined);
      if (!playMsg) return;

      await this.player.setPause(!this.player.paused);

      await this.client.UpdateQueueMsg(this.player);

      this.interaction.reply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${this.client.i18n.get(this.language, "button.music", this.player.paused ? "pause_msg" : "resume_msg")}`, this.client.color)],
      });
    }
  }
}