// Preview: https://i.imgur.com/lOOCQYZ.png

import { Manager } from "../../manager.js";
import { EmbedBuilder, TextChannel } from "discord.js";
import { formatDuration } from "../../utilities/FormatDuration.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Player } from "../../structures/Player.js";
import { getTitle } from "../../utilities/GetTitle.js";
import { Classic } from "musicard";
import fs from "fs";

// Main code
export default class implements Command {
  public name = ["card"];
  public description = "Display a card of the song currently playing.";
  public category = "Music";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = ["np"];
  public lavalink = true;
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const player = client.players.get(handler.guild!.id);
    const song = player?.current;

    if (!song || !player) {
      return handler.editReply({
        content: "There is no song currently playing.",
        embeds: [],
      });
    }

    const position = player.position;
    const CurrentDuration = formatDuration(position);
    const TotalDuration = formatDuration(song!.duration);
    const Thumbnail = song?.artworkUrl ?? `https://img.youtube.com/vi/${song!.identifier}/maxresdefault.jpg`;
    const Part = Math.floor((position / song!.duration!) * 30);

    const fieldDataGlobal = [
      {
        name: `${client.i18n.get(handler.language, "event.player", "volume_title")}`,
        value: `${player.volume}%`,
        inline: true,
      },
      {
        name: `${client.i18n.get(handler.language, "event.player", "queue_title")}`,
        value: `${player.queue.length}`,
        inline: true,
      },
      {
        name: `${client.i18n.get(handler.language, "event.player", "request_title")}`,
        value: `${song!.requester}`,
        inline: true,
      },
      {
        name: `${client.i18n.get(handler.language, "event.player", "download_title")}`,
        value: `**[${song!.title}](https://www.000tube.com/watch?v=${song?.identifier})**`,
        inline: false,
      },
    ];

    const musicard = await Classic({
      thumbnailImage: Thumbnail,
      backgroundImage: Thumbnail,
      author: song!.author,
      imageDarkness: 60,
      progressColor: '#ddbaf5',
      progressBarColor: '#EBD7F9',
      name: song!.title,
      nameColor: '#ddbaf5',
      authorColor: '#696969',
      startTime: CurrentDuration,
      endTime: TotalDuration,
      timeColor: '#ddbaf5',
    });

    const filePath = `./output.png`;
    fs.writeFileSync(filePath, musicard);

    const embeded = new EmbedBuilder()
      .setAuthor({
        name: `${client.i18n.get(handler.language, "command.music", "np_title")}`,
        iconURL: `${client.i18n.get(handler.language, "command.music", "np_icon")}`,
      })
      .setColor(client.color)
      .setDescription(`**${getTitle(client, song!)}**`)
      .addFields(fieldDataGlobal)
      .setImage(`attachment://output.png`)
      .setTimestamp();

    await handler.editReply({
      content: " ",
      embeds: [embeded],
      files: [{
        attachment: filePath,
        name: 'output.png'
      }],
    });

    fs.unlinkSync(filePath);
  }
}
