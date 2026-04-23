import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default class implements Command {
  public name = ["help"];
  public description = "Displays all commands that the bot has.";
  public category = "Info";
  public accessableby = [Accessableby.Member];
  public usage = "/help";
  public aliases = ["h"];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const categories = readdirSync(join(__dirname, "..", "..", "commands"));

    const menuOptions = categories.map((category) => ({
      label: category.toUpperCase(),
      value: category,
    }));

    const categoriesList = '```\n' + categories.join('\n') + '\n```';

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("select-category")
      .setPlaceholder(client.i18n.get(handler.language, "help", "choose_category"))
      .addOptions(menuOptions);

    const hasLink = (val?: string) => typeof val === "string" && val.trim() !== "";

    const showSourceCodeButton = hasLink(client.config.bot.SOURCE_CODE_LINK);
    const showInviteButton = hasLink(client.config.bot.INVITE_LINK);
    const showSupportButton = hasLink(client.config.bot.SUPPORT_LINK);
    const showDonateButton = false;
    const showDashboardButton = hasLink(client.config.utilities.DASHBOARD_URL);

    const buttons: ButtonBuilder[] = [];

    if (showSourceCodeButton) {
      buttons.push(
        new ButtonBuilder()
          .setLabel(client.i18n.get(handler.language, "help", "source_code_label"))
          .setURL(client.config.bot.SOURCE_CODE_LINK)
          .setStyle(ButtonStyle.Link)
      );
    }

    if (showInviteButton) {
      buttons.push(
        new ButtonBuilder()
          .setLabel(client.i18n.get(handler.language, "help", "invite_label"))
          .setStyle(ButtonStyle.Link)
          .setURL(client.config.bot.INVITE_LINK)
      );
    }

    if (showSupportButton) {
      buttons.push(
        new ButtonBuilder()
          .setLabel(client.i18n.get(handler.language, "help", "support_label"))
          .setStyle(ButtonStyle.Link)
          .setURL(client.config.bot.SUPPORT_LINK)
      );
    }

    if (showDashboardButton) {
      const dashboardUrl = client.config.utilities.DASHBOARD_URL!;
      buttons.push(
        new ButtonBuilder()
          .setLabel("Music Controller")
          .setStyle(ButtonStyle.Link)
          .setURL(dashboardUrl.replace(/\/$/, "") + `/guild/${handler.guild?.id ?? ""}`)
      );
    }

    if (showDonateButton) {
      buttons.push(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Secondary)
          .setLabel(client.i18n.get(handler.language, "help", "donate_label"))
          .setCustomId("donate")
      );
    }

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const components: Array<ActionRowBuilder<StringSelectMenuBuilder> | ActionRowBuilder<ButtonBuilder>> = [row];
    if (buttons.length > 0) {
      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
      components.push(buttonRow);
    }

    await handler.editReply({
      flags: CV2_FLAG,
      components: [
        cv2.build({
          description: client.i18n.get(handler.language, "help", "help_menu"),
          fields: [
            {
              name: client.i18n.get(handler.language, "help", "categories"),
              value: categoriesList,
              inline: true,
            },
            {
              name: client.i18n.get(handler.language, "help", "information_title"),
              value: client.i18n.get(handler.language, "help", "information_content"),
              inline: true,
            },
            {
              name: client.i18n.get(handler.language, "help", "get_started_title"),
              value: client.i18n.get(handler.language, "help", "get_started_content"),
            },
          ],
          color: client.color,
        }),
        ...components,
      ],
    });

    const filter = (i) => i.customId === "select-category" && i.user.id === handler.user.id;
    // @ts-ignore
    const collector = handler.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on("collect", async (i) => {
      if (!i.isSelectMenu()) return;
      const selectedCategory = i.values[0];
      const commands = client.commands.filter((c) => c.category === selectedCategory);
      const description = commands.map((command) => `\`${command.name.join("-")}\``).join(", ");
      await i.update({
        flags: CV2_FLAG,
        components: [
          cv2.build({
            title: `Commands in ${selectedCategory.toUpperCase()}`,
            description: description && description.length > 0 ? description : undefined,
            color: client.color,
          }),
          ...components,
        ],
      });
    });

    collector.on("end", (collected) => {
      if (!collected.size) {
        handler.editReply({
          content: client.i18n.get(handler.language, "help", "didnt_select"),
          components: [],
        });
      }
    });

    handler.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isButton()) return;

      if (interaction.customId === "donate") {
        const modal = new ModalBuilder()
          .setCustomId("donateModal")
          .setTitle(client.i18n.get(handler.language, "help", "donate_amount_title"));

        const donationInput = new TextInputBuilder()
          .setCustomId("donationAmount")
          .setLabel(client.i18n.get(handler.language, "help", "donate_amount_description"))
          .setStyle(TextInputStyle.Short);

        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(donationInput));

        await interaction.showModal(modal);
      }
    });

    handler.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isModalSubmit()) return;

      if (interaction.customId === "donateModal") {
        const donationAmount = interaction.fields.getTextInputValue("donationAmount");

        const amount = parseFloat(donationAmount);
        if (isNaN(amount)) {
          await interaction.reply({
            content: client.i18n.get(handler.language, "help", "invalid_amount"),
            ephemeral: true,
          });
          return;
        }

        const paypalLink = `https://www.paypal.com/paypalme/krushna06/${amount}`;

        await interaction.reply({
          content: `[Click here to donate ${amount}](${paypalLink})`,
          ephemeral: true,
        });
      }
    });
  }
}
