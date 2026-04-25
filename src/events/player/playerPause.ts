import { Manager } from "../../manager.js";
import { TextChannel } from "discord.js";
import { Player } from "../../structures/Player.js";
import { buildNowPlayingContainer } from "../../utilities/BuildNowPlayingContainer.js";
import { CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class {
  async execute(client: Manager, player: Player) {
    if (player.voiceId == null) return;

    const nowPlaying = client.nplayingMsg.get(`${player.guildId}`);
    if (nowPlaying) {
      const language = await client.db.language.get(`${player.guildId}`) ?? client.config.bot.LANGUAGE;
      nowPlaying.msg
        .edit({ flags: CV2_FLAG, components: [buildNowPlayingContainer(client, player, language)] })
        .catch(() => null);
    }

    const setup = await client.db.setup.get(`${player.guildId}`);
    if (setup && setup.playmsg) {
      const channel = await client.channels.fetch(setup.channel).catch(() => undefined);
      if (!channel) return;
      if (!channel.isTextBased) return;
      const msg = await (channel as TextChannel).messages.fetch(setup.playmsg).catch(() => undefined);
      if (!msg) return;
      msg.edit({ components: [client.enSwitch] }).catch(() => null);
    }
  }
}
