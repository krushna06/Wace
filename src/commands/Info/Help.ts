import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionCollector,
} from "discord.js";
import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";

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

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("select-category")
      .setPlaceholder(client.i18n.get(handler.language, "help", "choose_category"))
      .addOptions(menuOptions);

    const buttonsourcecode = new ButtonBuilder()
      .setLabel(client.i18n.get(handler.language, "help", "source_code_label"))
      .setURL("https://discord.gg/m5Y3rRPuFT")
      .setStyle(ButtonStyle.Link);

    const buttonInvite = new ButtonBuilder()
      .setLabel(client.i18n.get(handler.language, "help", "invite_label"))
      .setStyle(ButtonStyle.Link)
      .setURL("https://discord.com/oauth2/authorize?client_id=1221392528566386768");

    const buttonSupport = new ButtonBuilder()
      .setLabel(client.i18n.get(handler.language, "help", "support_label"))
      .setStyle(ButtonStyle.Link)
      .setURL("https://discord.gg/ReA5JyJCR6");

    const buttonDonate = new ButtonBuilder()
      .setEmoji("<:__paypal:996085845423562762>")
      .setStyle(ButtonStyle.Secondary)
      .setLabel(client.i18n.get(handler.language, "help", "donate_label"))
      .setCustomId("donate");

    const initialEmbed = new EmbedBuilder()
      .setDescription(client.i18n.get(handler.language, "help", "help_menu"))
      .addFields(
        {
          name: client.i18n.get(handler.language, "help", "categories"),
          value: client.i18n.get(handler.language, "help", "categories_list"),
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
        }
      )
      .setColor(client.color);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      buttonsourcecode,
      buttonInvite,
      buttonSupport,
      buttonDonate
    );

    const initialMessage = await handler.editReply({
      embeds: [initialEmbed],
      components: [row, buttons],
    });

    const filter = (i) => i.customId === "select-category" && i.user.id === handler.user.id;
    const collector = handler.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on("collect", async (i) => {
      if (!i.isSelectMenu()) return;
      const selectedCategory = i.values[0];
      const embed = this.generateCategoryEmbed(client, selectedCategory);
      embed.setTitle(`Commands in ${selectedCategory.toUpperCase()}`);
      await i.update({
        embeds: [embed],
        components: [row, buttons],
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

    // Event listener for button clicks
    handler.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isButton()) return;

      if (interaction.customId === "donate") {
        // Create a modal
        const modal = new ModalBuilder()
          .setCustomId("donateModal")
          .setTitle(client.i18n.get(handler.language, "help", "donate_amount_title"));

        // Create a text input for the donation amount
        const donationInput = new TextInputBuilder()
          .setCustomId("donationAmount")
          .setLabel(client.i18n.get(handler.language, "help", "donate_amount_description"))
          .setStyle(TextInputStyle.Short);

        // Add the text input to the modal
        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(donationInput));

        // Show the modal to the user
        await interaction.showModal(modal);
      }
    });

    // Handle modal submission
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

        // Generate PayPal donation link based on the entered amount
        const paypalLink = `https://www.paypal.com/paypalme/krushna06/${amount}`;

        // Send the PayPal link to the user
        await interaction.reply({
          content: `[Click here to donate $${amount}](${paypalLink})`,
          ephemeral: true,
        });
      }
    });
  }

  private generateCategoryEmbed(client: Manager, category: string): EmbedBuilder {
    const commands = client.commands.filter((c) => c.category === category);

    const description = commands.map((command) => `\`${command.name.join("-")}\``).join(", ");

    const embed = new EmbedBuilder()
      .setTitle(`Commands in ${category.toUpperCase()}`)
      .setDescription(description)
      .setColor(client.color);

    return embed;
  }

  private transalatedFinder(client: Manager, handler: CommandHandler) {
    return {
      name: `${client.i18n.get(handler.language, "help", "ce_finder_name")}`,
      des: `${client.i18n.get(handler.language, "help", "ce_finder_des")}`,
      usage: `${client.i18n.get(handler.language, "help", "ce_finder_usage")}`,
      access: `${client.i18n.get(handler.language, "help", "ce_finder_access")}`,
      aliases: `${client.i18n.get(handler.language, "help", "ce_finder_aliases")}`,
      slash: `${client.i18n.get(handler.language, "help", "ce_finder_slash")}`,
      desNone: `${client.i18n.get(handler.language, "help", "ce_finder_des_no")}`,
      usageNone: `${client.i18n.get(handler.language, "help", "ce_finder_usage_no")}`,
      aliasesPrefix: `${client.i18n.get(handler.language, "help", "ce_finder_aliases_prefix")}`,
      aliasesNone: `${client.i18n.get(handler.language, "help", "ce_finder_aliases_no")}`,
      slashEnable: `${client.i18n.get(handler.language, "help", "ce_finder_slash_enable")}`,
      slashDisable: `${client.i18n.get(handler.language, "help", "ce_finder_slash_disable")}`,
    };
  }
}
