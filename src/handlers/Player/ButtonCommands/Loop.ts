import { ButtonInteraction } from "discord.js";
import { Manager } from "../../../manager.js";
import { AutoReconnectBuilderService } from "../../../services/AutoReconnectBuilderService.js";
import { Player } from "../../../structures/Player.js";
import { cv2, CV2_FLAG } from "../../../utilities/ComponentsV2.js";

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

        await this.interaction.reply({
          flags: CV2_FLAG,
          components: [cv2.simple(`${this.client.i18n.get(this.language, "button.music", "loop_current")}`, this.client.color)],
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

        await this.interaction.reply({
          flags: CV2_FLAG,
          components: [cv2.simple(`${this.client.i18n.get(this.language, "button.music", "loop_all")}`, this.client.color)],
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

        await this.interaction.reply({
          flags: CV2_FLAG,
          components: [cv2.simple(`${this.client.i18n.get(this.language, "button.music", "unloop_all")}`, this.client.color)],
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