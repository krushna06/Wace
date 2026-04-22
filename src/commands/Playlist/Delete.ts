import {
  ApplicationCommandOptionType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  AutocompleteInteraction,
} from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { AutocompleteInteractionChoices, GlobalInteraction } from "../../@types/Interaction.js";
import { getPlaylistAutocomplete } from "../../utilities/PlaylistAutocomplete.js";
import EventEmitter from "node:events";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["pl", "delete"];
  public description = "Delete a playlist";
  public category = "Playlist";
  public accessableby = [Accessableby.Member];
  public usage = "<playlist_id>";
  public aliases = [];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  public options = [
    {
      name: "id",
      description: "The id of the playlist",
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
      await handler.deferReply();

      const value = handler.args[0] ? handler.args[0] : null;
      const reply = (desc: string) => handler.editReply({ flags: CV2_FLAG, components: [cv2.simple(desc, client.color)] });

      if (value == null) return reply(`${client.i18n.get(handler.language, "command.playlist", "invalid")}`);

      const playlist = await client.db.playlist.get(value);
      if (!playlist) return reply(`${client.i18n.get(handler.language, "command.playlist", "delete_notfound")}`);
      if (playlist.owner !== handler.user?.id) return reply(`${client.i18n.get(handler.language, "command.playlist", "delete_owner")}`);

      const action = new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder().setStyle(ButtonStyle.Danger).setCustomId("yes").setLabel("Yes"),
        new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId("no").setLabel("No"),
      ]);

      const msg = await handler.editReply({
        flags: CV2_FLAG,
        components: [
          cv2.simple(`${client.i18n.get(handler.language, "command.playlist", "delete_confirm", { playlist_id: value })}`, client.color),
          action,
        ],
      });

      const collector = msg?.createMessageComponentCollector({
        filter: (m) => m.user.id == handler.user?.id,
        time: 20000,
      });

      collector?.on("collect", async (interaction) => {
        const id = interaction.customId;
        if (id == "yes") {
          await client.db.playlist.delete(value);
          interaction.reply({ flags: CV2_FLAG, components: [cv2.simple(`${client.i18n.get(handler.language, "command.playlist", "delete_deleted", { name: value })}`, client.color)] });
          collector.stop();
          msg?.delete().catch(() => null);
        } else if (id == "no") {
          interaction.reply({ flags: CV2_FLAG, components: [cv2.simple(`${client.i18n.get(handler.language, "command.playlist", "delete_no")}`, client.color)] });
          collector.stop();
          msg?.delete().catch(() => null);
        }
      });

      collector?.on("end", async () => {
        const checkMsg = await handler.channel?.messages.fetch(String(msg?.id)).catch(() => undefined);
        checkMsg ? checkMsg.edit({ flags: CV2_FLAG, components: [cv2.simple(`${client.i18n.get(handler.language, "command.playlist", "delete_no")}`, client.color)] }).catch(() => null) : true;
        // @ts-ignore
        collector?.removeAllListeners();
      });
    }

  public async autocomplete(client: Manager, interaction: GlobalInteraction, language: string) {
    // @ts-ignore
    const idOption = (interaction as CommandInteraction).options.get("id");
    const focusedValue = String(idOption?.value || "").toLowerCase();

    const choices = await getPlaylistAutocomplete(client, interaction, focusedValue);
    await (interaction as AutocompleteInteraction).respond(choices).catch(() => {});
  }
}