import { ButtonInteraction, EmbedBuilder, TextChannel, VoiceBasedChannel } from "discord.js";
import { Manager } from "../../../manager.js";
import { Player } from "../../../structures/Player.js";

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
      const getChannel = await this.client.channels.fetch(data.channel).catch(() => undefined);
      if (!getChannel) return;
      let playMsg = await (getChannel as TextChannel)!.messages
        .fetch(data.playmsg)
        .catch(() => undefined);
      if (!playMsg) return;

      await this.player.setPause(!this.player.paused);

      this.player.paused
        ? playMsg
            .edit({


              components: [this.client.enSwitch],
            })
            .catch(() => null)
        : playMsg
            .edit({


              components: [this.client.enSwitchMod],
            })
            .catch(() => null);

      const embed = new EmbedBuilder()
        .setDescription(
          `${this.client.i18n.get(this.language, "button.music", this.player.paused ? "pause_msg" : "resume_msg")}`
        )
        .setColor(this.client.color);

      this.interaction.reply({ embeds: [embed] });
    }
  }
}