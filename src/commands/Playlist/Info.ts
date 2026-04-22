import { ApplicationCommandOptionType, Message, CommandInteraction, AutocompleteInteraction } from "discord.js";
import humanizeDuration from "humanize-duration";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { AutocompleteInteractionChoices, GlobalInteraction } from "../../@types/Interaction.js";
import { getPlaylistAutocomplete } from "../../utilities/PlaylistAutocomplete.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["pl", "info"];
  public description = "Check the playlist infomation";
  public category = "Playlist";
  public accessableby = [Accessableby.Member];
  public usage = "<playlist_id>";
  public aliases = [];
  public lavalink = true;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  public options = [
    {
      name: "id",
      description: "The id of the playlist",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
      await handler.deferReply();

      const value = handler.args[0] ? handler.args[0] : null;
      const reply = (desc: string) => handler.editReply({ flags: CV2_FLAG, components: [cv2.simple(desc, client.color)] });

      if (value == null) return reply(`${client.i18n.get(handler.language, "command.playlist", "invalid")}`);

      const info = await client.db.playlist.get(value);
      if (!info) return reply(`${client.i18n.get(handler.language, "command.playlist", "invalid")}`);

      const created = humanizeDuration(Date.now() - Number(info.created), { largest: 1 });
      const name = await client.users.fetch(info.owner);

      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.build({
          title: info.name,
          color: client.color,
          fields: [
            { name: `${client.i18n.get(handler.language, "command.playlist", "info_owner")}`, value: `${name.username}` },
            { name: `${client.i18n.get(handler.language, "command.playlist", "info_id")}`, value: `${info.id}` },
            { name: `${client.i18n.get(handler.language, "command.playlist", "info_des")}`, value: `${info.description === null || info.description === "null" ? client.i18n.get(handler.language, "command.playlist", "no_des") : info.description}` },
            { name: `${client.i18n.get(handler.language, "command.playlist", "info_private")}`, value: `${info.private ? client.i18n.get(handler.language, "command.playlist", "public") : client.i18n.get(handler.language, "command.playlist", "private")}` },
            { name: `${client.i18n.get(handler.language, "command.playlist", "info_created")}`, value: `${created}` },
            { name: `${client.i18n.get(handler.language, "command.playlist", "info_total")}`, value: `${info.tracks!.length}` },
          ],
        })],
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