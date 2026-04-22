import { Manager } from "../../manager.js";
import { TextChannel } from "discord.js";
import { formatDuration } from "../../utilities/FormatDuration.js";
import { Player } from "../../structures/Player.js";
import { getTitle } from "../../utilities/GetTitle.js";
import { filterSelect } from "../../utilities/PlayerControlButton.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export class PlayerUpdateLoader {
  client: Manager;
  constructor(client: Manager) {
    this.client = client;
    this.loader(this.client);
  }

  async loader(client: Manager) {
    client.UpdateQueueMsg = async function (player: Player) {
      let data = await client.db.setup.get(`${player.guildId}`);
      if (!data) return;
      if (data.enable === false) return;

      let channel = (await client.channels
        .fetch(data.channel)
        .catch(() => undefined)) as TextChannel;
      if (!channel) return;

      let playMsg = await channel.messages.fetch(data.playmsg).catch(() => undefined);
      if (!playMsg) return;

      let guildModel = await client.db.language.get(`${player.guildId}`);
      if (!guildModel) {
        guildModel = await client.db.language.set(`${player.guildId}`, client.config.bot.LANGUAGE);
      }

      const language = guildModel;

      const songStrings = [];
      const queuedSongs = player.queue.map(
        (song, i) =>
          `${client.i18n.get(language, "event.setup", "setup_content_queue", {
            index: `${i + 1}`,
            title: song.title,
            duration: formatDuration(song.duration),
            request: `${song.requester}`,
          })}`
      );

      songStrings.push(...queuedSongs);

      const Str = songStrings.slice(0, 10).join("\n");

      const TotalDuration = player.queue.reduce((acc, t) => acc + (t.duration || t.info?.length || 0), 0);

      let cSong = player.current;
      let qDuration = `${formatDuration(TotalDuration + Number(player.current?.duration))}`;

      let dashboardUrl = client.config.utilities.DASHBOARD_URL;
      let dashboardGuildUrl = "";
      if (dashboardUrl && dashboardUrl.trim() !== "") {
        dashboardUrl = dashboardUrl.replace(/\/$/, "");
        dashboardGuildUrl = `${dashboardUrl}/guild/${player.guildId}`;
      }

      const fields = [];
      if (dashboardGuildUrl) {
        fields.push({ name: "Dashboard", value: `[Music Controller](${dashboardGuildUrl})` });
      }

      const embed = cv2.build({
        color: client.color,
        author: `${client.i18n.get(language, "event.setup", "setup_author")}`,
        description: `${client.i18n.get(language, "event.setup", "setup_desc", {
          title: getTitle(client, cSong!),
          duration: formatDuration(cSong!.duration),
          request: `${cSong!.requester}`,
        })}`,
        thumbnail: cSong!.artworkUrl
          ? cSong!.artworkUrl
          : `https://cdn.discordapp.com/avatars/${client.user!.id}/${client.user!.avatar}.jpeg?size=300`,
        fields,
        footer: `${client.i18n.get(language, "event.setup", "setup_footer", {
          volume: `${player.volume}`,
          duration: qDuration,
        })}`,
      });

      const queueString = `${client.i18n.get(language, "event.setup", "setup_content")}\n${
        Str == "" ? " " : "\n" + Str
      }`;

      return await playMsg
        .edit({
          flags: CV2_FLAG,
          content: player.current && player.queue.length == 0 ? " " : queueString,
          components: [embed, client.enSwitchMod, filterSelect(client)],
        })
        .catch(() => {});
    };

    client.UpdateMusic = async function (player: Player) {
      let data = await client.db.setup.get(`${player.guildId}`);
      if (!data) return;
      if (data.enable === false) return;

      let channel = (await client.channels
        .fetch(data.channel)
        .catch(() => undefined)) as TextChannel;
      if (!channel) return;

      let playMsg = await channel.messages.fetch(data.playmsg).catch(() => undefined);
      if (!playMsg) return;

      let guildModel = await client.db.language.get(`${player.guildId}`);
      if (!guildModel) {
        guildModel = await client.db.language.set(`${player.guildId}`, client.config.bot.LANGUAGE);
      }

      const language = guildModel;

      const queueMsg = `${client.i18n.get(language, "event.setup", "setup_queuemsg")}`;

      const playEmbed = cv2.build({
        color: client.color,
        author: `${client.i18n.get(language, "event.setup", "setup_playembed_author")}`,
        thumbnail: `https://cdn.discordapp.com/avatars/${client.user!.id}/${client.user!.avatar}.jpeg?size=300`,
      });

      return await playMsg
        .edit({
          flags: CV2_FLAG,
          content: `${queueMsg}`,
          components: [playEmbed, client.diSwitch],
        })
        .catch(() => {});
    };
  }
}