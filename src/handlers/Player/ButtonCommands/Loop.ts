import { ButtonInteraction, EmbedBuilder } from "discord.js";
import { Manager } from "../../../manager.js";
import { AutoReconnectBuilderService } from "../../../services/AutoReconnectBuilderService.js";
import { Player } from "../../../structures/Player.js";

export class ButtonLoop {
  client: Manager;
  interaction: ButtonInteraction;
  language: string;
  player: Player;
  constructor(
    client: Manager,
    interaction: ButtonInteraction,
    language: string,
    player: Player
  ) {
    this.client = client;
    this.language = language;
    this.player = player;
    this.interaction = interaction;
    this.execute();
  }

  async execute() {
    if (!this.player) {
      return;
    }

    switch (this.player.loop) {
      case "none":
        this.player.setLoop("track");

        if (this.client.config.utilities.AUTO_RESUME)
          this.setLoop247("track");

        const looptrack = new EmbedBuilder()
          .setDescription(`${this.client.i18n.get(this.language, "button.music", "loop_current")}`)
          .setColor(this.client.color);
        await this.interaction.reply({
          content: " ",
          embeds: [looptrack],
        });

        this.client.wsl.get(this.interaction.guild!.id)?.send({
          op: "playerLoop",
          guild: this.interaction.guild!.id,
          mode: "track",
        });
        break;

      case "track":
        this.player.setLoop("queue");

        if (this.client.config.utilities.AUTO_RESUME)
          this.setLoop247("queue");

        const loopall = new EmbedBuilder()
          .setDescription(`${this.client.i18n.get(this.language, "button.music", "loop_all")}`)
          .setColor(this.client.color);
        await this.interaction.reply({
          content: " ",
          embeds: [loopall],
        });

        this.client.wsl.get(this.interaction.guild!.id)?.send({
          op: "playerLoop",
          guild: this.interaction.guild!.id,
          mode: "queue",
        });
        break;

      case "queue":
        this.player.setLoop("none");

        if (this.client.config.utilities.AUTO_RESUME)
          this.setLoop247("none");

        const unloopall = new EmbedBuilder()
          .setDescription(`${this.client.i18n.get(this.language, "button.music", "unloop_all")}`)
          .setColor(this.client.color);
        await this.interaction.reply({
          content: " ",
          embeds: [unloopall],
        });

        this.client.wsl.get(this.interaction.guild!.id)?.send({
          op: "playerLoop",
          guild: this.interaction.guild!.id,
          mode: "none",
        });
        break;
    }
  }

  async setLoop247(loop: string) {
    const check = await new AutoReconnectBuilderService(this.client, this.player).execute(
      this.player.guildId
    );
    if (check) {
      await this.client.db.autoreconnect.set(`${this.player.guildId}.config.loop`, loop);
    }
  }
}
