import { ButtonInteraction, CacheType } from "discord.js";
import { Manager } from "../manager.js";
import { cv2, CV2_FLAG } from "../utilities/ComponentsV2.js";

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
    const msg = await this.message
      .reply({
        flags: CV2_FLAG,
        components: [cv2.simple(this.content, this.client.color)],
      })
      .catch(() => null);

    if (!msg) {

      return;
    }

    const setup = await this.client.db.setup.get(String(this.message.guildId));

    setTimeout(() => {
      if (!setup || setup.channel !== this.message.channelId) {
        msg.delete().catch(() => {

        });
      }
    }, this.client.config.utilities.DELETE_MSG_TIMEOUT);
  }
}