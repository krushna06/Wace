import { EmbedBuilder, ButtonInteraction, CacheType } from "discord.js";
import { Manager } from "../manager.js";

export class ReplyInteractionService {
  client: Manager;
  message: ButtonInteraction<CacheType>;
  content: string;

  constructor(client: Manager, message: ButtonInteraction<CacheType>, content: string) {
    this.client = client;
    this.content = content;
    this.message = message;
    this.execute();
  }

  async execute() {
    const embed = new EmbedBuilder().setDescription(this.content).setColor(this.client.color);

    const msg = await this.message
      .reply({
        embeds: [embed],
        ephemeral: false,
      })
      .catch(() => null);

    if (!msg) {
      // Optionally log an error here if necessary
      return;
    }

    const setup = await this.client.db.setup.get(String(this.message.guildId));

    setTimeout(() => {
      if (!setup || setup.channel !== this.message.channelId) {
        msg.delete().catch(() => {
          // Silence the error without logging it
        });
      }
    }, this.client.config.utilities.DELETE_MSG_TIMEOUT);
  }
}
