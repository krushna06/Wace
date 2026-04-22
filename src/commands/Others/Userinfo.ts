import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Interaction,
  GuildMember,
  ComponentType,
  ApplicationCommandOptionType,
  CommandInteraction,
  CommandInteractionOptionResolver,
} from "discord.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

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
    // @ts-ignore
    const options = interaction.options as CommandInteractionOptionResolver;
    const targetUser = options.getUser("user") || interaction.user || handler.message?.author;
    const member = interaction.guild?.members.cache.get(targetUser.id) || (handler.message?.member as GuildMember);

    if (!targetUser || !member) {
      await handler.editReply({ content: "Could not fetch user information." });
      return;
    }

    const joinDateServerUnix = member.joinedAt ? Math.floor(member.joinedAt.getTime() / 1000) : null;
    const joinDateDiscordUnix = Math.floor(targetUser.createdAt.getTime() / 1000);
    const userAvatar = targetUser.displayAvatarURL({ size: 2048 });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("roles").setLabel("Show Roles").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("permissions").setLabel("Show Permissions").setStyle(ButtonStyle.Secondary)
    );

    await handler.editReply({
      flags: CV2_FLAG,
      components: [
        cv2.build({
          author: targetUser.username,
          thumbnail: userAvatar,
          color: client.color,
          timestamp: true,
          fields: [
            { name: "User Name", value: targetUser.username, inline: true },
            { name: "Join Date (Server)", value: joinDateServerUnix ? `<t:${joinDateServerUnix}:F>` : "N/A", inline: true },
            { name: "Join Date (Discord)", value: `<t:${joinDateDiscordUnix}:F>`, inline: true },
          ],
        }),
        row,
      ],
    });

    const filter = (i: Interaction) => i.user.id === interaction.user.id;
    const collector = interaction.channel?.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 60000 });

    collector?.on("collect", async (i) => {
      if (i.customId === "roles") {
        const roles = member.roles.cache.filter((r) => r.name !== "@everyone").map((r) => `<@&${r.id}>`).join(", ") || "No roles";
        await i.reply({ flags: CV2_FLAG, components: [cv2.build({ title: "User Roles", description: roles, color: client.color, timestamp: true })], ephemeral: true });
      } else if (i.customId === "permissions") {
        const permissions = member.permissions.toArray().join(", ") || "No permissions";
        await i.reply({ flags: CV2_FLAG, components: [cv2.build({ title: "User Permissions", description: permissions, color: client.color, timestamp: true })], ephemeral: true });
      }
    });

    collector?.on("end", async () => { await handler.editReply({ components: [] }); });
  }
}
