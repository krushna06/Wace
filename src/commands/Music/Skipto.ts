import { ApplicationCommandOptionType, EmbedBuilder, User } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Player } from "../../structures/Player.js";

export default class implements Command {
  public name = ["skipto"];
  public description = "Skip to a specific position";
  public category = "Music";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = ["sk"];
  public lavalink = true;
  public options = [
    {
      name: "position",
      description: "The position of the song",
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
  ];
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public permissions = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();
    const player = client.players.get(handler.guild!.id) as Player;

    const getPosition = Number(handler.args[0]);

    if (!handler.args[0] || isNaN(getPosition) || getPosition < 0)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${client.i18n.get(handler.language, "error", "number_invalid")}`)
            .setColor(client.color),
        ],
      });

    if (player.queue.length == 0 || getPosition >= player.queue.length) {
      const skipped = new EmbedBuilder()
        .setDescription(`${client.i18n.get(handler.language, "command.music", "skip_notfound")}`)
        .setColor(client.color);

      handler.editReply({ content: " ", embeds: [skipped] });
    } else {
      const cuttedQueue = player.queue.splice(0, getPosition);
      const nowCurrentTrack = cuttedQueue.splice(-1)[0];

      if (!nowCurrentTrack) {
        const skipped = new EmbedBuilder()
          .setDescription(`${client.i18n.get(handler.language, "command.music", "skip_notfound")}`)
          .setColor(client.color);
        return handler.editReply({ content: " ", embeds: [skipped] });
      }

      player.previousQueue.push(...cuttedQueue);
      player.current ? player.previousQueue.unshift(player.current) : true;

      await player.play(nowCurrentTrack).catch((err) => {
        client.logger.error("Skipto play error:", err);
      });

      client.wsl.get(handler.guild!.id)?.send({
        op: "playerQueueSkip",
        guild: handler.guild!.id,
        queue: player.queue.map((track) => {
          const requesterQueue = track.requester as User;
          return {
            title: track.info.title,
            uri: track.info.uri,
            length: track.duration || track.info?.length,
            thumbnail: track.info.artworkUrl,
            author: track.info.author,
            requester: requesterQueue
              ? {
                  id: requesterQueue.id,
                  username: requesterQueue.username,
                  globalName: requesterQueue.globalName,
                  defaultAvatarURL: requesterQueue.defaultAvatarURL ?? null,
                }
              : null,
          };
        }),
      });
      const skipped = new EmbedBuilder()
        .setDescription(`${client.i18n.get(handler.language, "command.music", "skip_msg")}`)
        .setColor(client.color);
      handler.editReply({ content: " ", embeds: [skipped] });
    }
  }
}