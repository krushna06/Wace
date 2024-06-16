import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Interaction,
  CacheType,
  GuildMember,
  ComponentType,
  ApplicationCommandOptionType,
  CommandInteraction,
  CommandInteractionOptionResolver,
} from "discord.js";

export default class implements Command {
  public name = ["userinfo"];
  public description = "Shows the information of the user";
  public category = "Others";
  public accessableby = [Accessableby.Member];
  public usage = "";
  public aliases = [];
  public lavalink = false;
  public options = [
    {
      name: "user",
      type: ApplicationCommandOptionType.User,
      description: "The user to get information about",
      required: false,
    },
  ];
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const interaction = handler.interaction as CommandInteraction;
    const options = interaction.options as CommandInteractionOptionResolver;

    const targetUser = options.getUser("user") || interaction.user || handler.message?.author;
    const member =
      interaction.guild?.members.cache.get(targetUser.id) ||
      (handler.message?.member as GuildMember);
    if (!targetUser || !member) {
      await handler.editReply({ content: "Could not fetch user information." });
      return;
    }

    const joinDateServerUnix = member.joinedAt
      ? Math.floor(member.joinedAt.getTime() / 1000)
      : null;
    const joinDateDiscordUnix = Math.floor(targetUser.createdAt.getTime() / 1000);
    const userName = targetUser.username;
    const userAvatar = targetUser.displayAvatarURL({ size: 2048 });

    const embed = new EmbedBuilder()
      .setAuthor({
        name: userName,
        iconURL: userAvatar,
      })
      .setColor(client.color)
      .addFields(
        { name: "User Name", value: userName, inline: true },
        {
          name: "Join Date (Server)",
          value: joinDateServerUnix ? `<t:${joinDateServerUnix}:F>` : "N/A",
          inline: true,
        },
        { name: "Join Date (Discord)", value: `<t:${joinDateDiscordUnix}:F>`, inline: true }
      )
      .setThumbnail(userAvatar)
      .setTimestamp();

    const rolesButton = new ButtonBuilder()
      .setCustomId("roles")
      .setLabel("Show Roles")
      .setStyle(ButtonStyle.Primary);

    const permissionsButton = new ButtonBuilder()
      .setCustomId("permissions")
      .setLabel("Show Permissions")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(rolesButton, permissionsButton);

    await handler.editReply({ embeds: [embed], components: [row] });

    const filter = (i: Interaction) => i.user.id === interaction.user.id;
    const collector = interaction.channel?.createMessageComponentCollector({
      filter,
      componentType: ComponentType.Button,
      time: 60000,
    });

    collector?.on("collect", async (i) => {
      if (i.customId === "roles") {
        const roles =
          member.roles.cache
            .filter((role) => role.name !== "@everyone")
            .map((role) => `<@&${role.id}>`)
            .join(", ") || "No roles";

        const rolesEmbed = new EmbedBuilder()
          .setTitle("User Roles")
          .setDescription(roles)
          .setColor(client.color)
          .setTimestamp();

        await i.reply({ embeds: [rolesEmbed], ephemeral: true });
      } else if (i.customId === "permissions") {
        const permissions = member.permissions.toArray().join(", ") || "No permissions";
        const permissionsEmbed = new EmbedBuilder()
          .setTitle("User Permissions")
          .setDescription(permissions)
          .setColor(client.color)
          .setTimestamp();

        await i.reply({ embeds: [permissionsEmbed], ephemeral: true });
      }
    });

    collector?.on("end", async () => {
      await handler.editReply({ components: [] });
    });
  }
}
