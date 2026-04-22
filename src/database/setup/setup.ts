import { Manager } from "../../manager.js";
import { Setup } from "../schema/Setup.js";
import { TextChannel } from "discord.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export class SongRequesterCleanSetup {
  client: Manager;
  constructor(client: Manager) {
    this.client = client;
    this.execute();
  }

  async execute() {
    const guilds = await this.client.db.setup.all();

    for (let data of guilds) {
      const extractData = data.value;
      const player = this.client.players.get(extractData.guild);
      if (!extractData.enable) return;
      if (player) return;
      await this.restore(extractData);
    }
  }

  async restore(setupData: Setup) {
    let channel = (await this.client.channels
      .fetch(setupData.channel)
      .catch(() => undefined)) as TextChannel;
    if (!channel) return;

    let playMsg = await channel.messages.fetch(setupData.playmsg).catch(() => undefined);
    if (!playMsg) return;

    let guildModel = await this.client.db.language.get(`${setupData.guild}`);
    if (!guildModel) {
      guildModel = await this.client.db.language.set(
        `${setupData.guild}`,
        this.client.config.bot.LANGUAGE
      );
    }

    const language = guildModel;

    const queueMsg = `${this.client.i18n.get(language, "event.setup", "setup_queuemsg")}`;

    const playEmbed = cv2.build({
      color: this.client.color,
      author: `${this.client.i18n.get(language, "event.setup", "setup_playembed_author")}`,
      thumbnail: `https://cdn.discordapp.com/avatars/${this.client.user!.id}/${this.client.user!.avatar}.jpeg?size=300`,
    });

    return await playMsg
      .edit({
        flags: CV2_FLAG,
        content: `${queueMsg}`,
        components: [playEmbed, this.client.diSwitch],
      })
      .catch((e) => {});
  }
}