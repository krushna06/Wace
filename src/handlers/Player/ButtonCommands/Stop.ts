import { ButtonInteraction, EmbedBuilder, VoiceBasedChannel } from "discord.js";
import { Manager } from "../../../manager.js";
import { WacelinkPlayer } from "../../../wacelink/main.js";

export class ButtonStop {
  client: Manager;
  interaction: ButtonInteraction;
  channel: VoiceBasedChannel | null;
  language: string;
  player: WacelinkPlayer;
  constructor(
    client: Manager,
    interaction: ButtonInteraction,
    channel: VoiceBasedChannel | null,
    language: string,
    player: WacelinkPlayer
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
        embeds: [
          new EmbedBuilder()
            .setDescription(`${this.client.i18n.get(this.language, "error", "no_in_voice")}`)
            .setColor(this.client.color),
        ],
      });
      return;
    } else if (
      this.interaction.guild!.members.me!.voice.channel &&
      !this.interaction.guild!.members.me!.voice.channel.equals(this.channel)
    ) {
      this.interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${this.client.i18n.get(this.language, "error", "no_same_voice")}`)
            .setColor(this.client.color),
        ],
      });
      return;
    } else if (!this.player) {
      this.interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${this.client.i18n.get(this.language, "error", "no_player")}`)
            .setColor(this.client.color),
        ],
      });
      return;
    } else {
      this.player.data.set("sudo-destroy", true);
      const is247 = await this.client.db.autoreconnect.get(`${this.player.guildId}`);
      await this.player.stop(is247 && is247.twentyfourseven ? false : true);
      await this.client.UpdateMusic(this.player);

      const embed = new EmbedBuilder()
        .setDescription(`${this.client.i18n.get(this.language, "button.music", "stop_msg")}`)
        .setImage(
          "https://media.discordapp.net/attachments/890634398981042246/1251990013193879562/54.png?ex=6670960f&is=666f448f&hm=d11ef9f858c1a2030ccdfe58aaa6fcd4a80725f6d250a67adb7aca38b88628de&=&format=webp&quality=lossless&width=687&height=223"
        )
        .setColor(this.client.color);

      this.interaction.reply({ embeds: [embed] });
    }
  }
}
