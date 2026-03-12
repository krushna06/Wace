import {
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  CommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { convertTime } from "../../utilities/ConvertTime.js";
import { AutocompleteInteractionChoices, GlobalInteraction } from "../../@types/Interaction.js";
import { Player } from "../../structures/Player.js";
import { getTitle } from "../../utilities/GetTitle.js";
import { getNode } from "../../utilities/GetNode.js";

// Main code
export default class implements Command {
  public name = ["insert"];
  public description = "Insert a song into a specific position in queue.";
  public category = "Music";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = [];
  public lavalink = true;
  public playerCheck = true;
  public usingInteraction = true;
  public sameVoiceCheck = true;
  public permissions = [];
  public options = [
    {
      name: "position",
      description: "The position in queue want to remove.",
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
    {
      name: "search",
      description: "The song link or name",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const player = client.players.get(handler.guild!.id) as Player;

    const position = Number(handler.args[0]);
    handler.args.splice(0, 1);
    const song = handler.args.join(" ");
    if (position && isNaN(+position))
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${client.i18n.get(handler.language, "error", "number_invalid")}`)
            .setColor(client.color),
        ],
      });
    if (Number(position) == 0)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "command.music", "insert_already")}`
            )
            .setColor(client.color),
        ],
      });
    if (Number(position) > player.queue.length)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "command.music", "insert_notfound")}`
            )
            .setColor(client.color),
        ],
      });

    const result = await player.search(song, { requester: handler.user });
    const track = result.tracks[0];

    if (!result.tracks.length)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "command.music", "insert_notfound")}`
            )
            .setColor(client.color),
        ],
      });

    player.queue.splice(position - 1, 0, track);

    const embed = new EmbedBuilder()
      .setDescription(
        `${client.i18n.get(handler.language, "command.music", "insert_desc", {
          name: getTitle(client, track),
          duration: convertTime(player.position),
          request: String(track.requester),
        })}`
      )
      .setColor(client.color);

    client.wsl.get(handler.guild!.id)?.send({
      op: "playerQueueInsert",
      guild: handler.guild!.id,
      track: {
        title: track.info.title,
        uri: track.info.uri,
        length: track.duration || track.info?.length,
        thumbnail: track.info.artworkUrl,
        author: track.info.author,
        requester: track.requester
          ? {
              id: (track.requester as any).id,
              username: (track.requester as any).username,
              globalName: (track.requester as any).globalName,
              defaultAvatarURL: (track.requester as any).defaultAvatarURL ?? null,
            }
          : null,
      },
      index: position - 1,
    });

    return handler.editReply({ embeds: [embed] });
  }

  // Autocomplete function
  async autocomplete(client: Manager, interaction: GlobalInteraction, language: string) {
    let choice: AutocompleteInteractionChoices[] = [];
    // @ts-ignore
    const url = String((interaction as CommandInteraction).options.get("search")!.value);

    const Random =
      client.config.player.AUTOCOMPLETE_SEARCH[
        Math.floor(Math.random() * client.config.player.AUTOCOMPLETE_SEARCH.length)
      ];

    const match = client.REGEX.some((match) => {
      return match.test(url) == true;
    });

    if (match == true) {
      choice.push({ name: url, value: url });
      await (interaction as AutocompleteInteraction).respond(choice).catch(() => {});
      return;
    }

    if (client.lavalinkUsing.length == 0) {
      choice.push({
        name: `${client.i18n.get(language, "error", "no_node")}`,
        value: `${client.i18n.get(language, "error", "no_node")}`,
      });
      return;
    }
    
    try {
      const searchRes = await getNode(client)?.rest.resolve(url || Random);

      if (!searchRes) {
        return choice.push({ name: "Error song not matches", value: url });
      }

      // Handle Shoukaku's LavalinkResponse format
      let tracks: any[] = [];
      switch (searchRes.loadType) {
        case "track":
          tracks = [searchRes.data];
          break;
        case "playlist":
          tracks = (searchRes.data as any).tracks || [];
          break;
        case "search":
          tracks = searchRes.data as any[];
          break;
        case "empty":
        case "error":
          return choice.push({ name: "Error song not matches", value: url });
      }

      if (!tracks || tracks.length === 0) {
        return choice.push({ name: "Error song not matches", value: url });
      }

      for (let i = 0; i < Math.min(10, tracks.length); i++) {
        const x = tracks[i];
        choice.push({
          name: x && x.info?.title ? x.info.title : "Unknown track name",
          value: x && x.info?.uri ? x.info.uri : url,
        });
      }
    } catch (error) {
      client.logger.error("Autocomplete search error:", error);
      choice.push({ name: "Search error - try again", value: url });
    }

    await (interaction as AutocompleteInteraction).respond(choice).catch(() => {});
  }
}
