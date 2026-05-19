import { ButtonInteraction, VoiceBasedChannel } from "discord.js";
import { Manager } from "../../../manager.js";
import { Player } from "../../../structures/Player.js";
import { cv2, CV2_FLAG } from "../../../utilities/ComponentsV2.js";

export class ButtonPrevious {
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
    } else if (!this.player || this.player.previousQueue.length == 0) {
      this.interaction.reply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${this.client.i18n.get(this.language, "button.music", "previous_notfound")}`, this.client.color)],
      });
      return;
    } else {
      await this.player.previous();
      this.player.data.set("endMode", "previous");
      this.interaction.reply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${this.client.i18n.get(this.language, "button.music", "previous_msg")}`, this.client.color)],
      });
    }
  }
}