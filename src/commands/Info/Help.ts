import {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ContainerBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  resolveColor,
} from "discord.js";
import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import { CV2_FLAG } from "../../utilities/ComponentsV2.js";

const __dirname = dirname(fileURLToPath(import.meta.url));



function buildHelpContainer(client: Manager, handler: CommandHandler, categories: string[]): ContainerBuilder {
  const container = new ContainerBuilder();

  try {
    const color = resolveColor(client.color as any);
    container.setAccentColor(color);
  } catch {}

  const avatarURL = client.user?.displayAvatarURL({ size: 64 }) ?? "";
  const headerText = [
    `## ${client.config.bot.BOT_NAME} — Help`,
    `-# Use the menu below to browse commands by category.`,
  ].join("\n");

  const headerSection = new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText))
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(avatarURL));
  container.addSectionComponents(headerSection);

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `-# Join a voice channel and \`/play\` a song.\n-# YouTube, Playlist, and Spotify links are all supported.`
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );

  const categoryLines = categories
    .map((cat) => `**${cat}**`)
    .join("\n");

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(categoryLines)
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `-# Tip: Use \`/play <song>\` to start listening right away.`
    )
  );

  return container;
}

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

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("help-select-category")
      .setPlaceholder("Choose a category…")
      .addOptions(
        categories.map((cat) => ({
          label: cat,
          value: cat,
          emoji: "📁",
        }))
      );

    const hasLink = (val?: string) => typeof val === "string" && val.trim() !== "";

    const buttons: ButtonBuilder[] = [];

    if (hasLink(client.config.bot.SOURCE_CODE_LINK)) {
      buttons.push(
        new ButtonBuilder()
          .setLabel("Source Code")
          .setURL(client.config.bot.SOURCE_CODE_LINK)
          .setStyle(ButtonStyle.Link)
      );
    }

    if (hasLink(client.config.bot.INVITE_LINK)) {
      buttons.push(
        new ButtonBuilder()
          .setLabel("Invite")
          .setStyle(ButtonStyle.Link)
          .setURL(client.config.bot.INVITE_LINK)
      );
    }

    if (hasLink(client.config.bot.SUPPORT_LINK)) {
      buttons.push(
        new ButtonBuilder()
          .setLabel("Support")
          .setStyle(ButtonStyle.Link)
          .setURL(client.config.bot.SUPPORT_LINK)
      );
    }

    if (hasLink(client.config.utilities.DASHBOARD_URL)) {
      const dashboardUrl = client.config.utilities.DASHBOARD_URL!;
      buttons.push(
        new ButtonBuilder()
          .setLabel("Dashboard")
          .setStyle(ButtonStyle.Link)
          .setURL(dashboardUrl.replace(/\/$/, "") + `/guild/${handler.guild?.id ?? ""}`)
      );
    }

    const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
    const helpContainer = buildHelpContainer(client, handler, categories);

    const components: any[] = [helpContainer, menuRow];
    if (buttons.length > 0) {
      components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons));
    }

    await handler.editReply({ flags: CV2_FLAG, components });

    const filter = (i: any) =>
      i.customId === "help-select-category" && i.user.id === handler.user!.id;

    // @ts-ignore
    const collector = handler.channel!.createMessageComponentCollector({ filter, time: 60000 });

    collector.on("collect", async (i: any) => {
      const selectedCategory: string = i.values[0];
      const cmds = client.commands.filter((c) => c.category === selectedCategory);

      const container = new ContainerBuilder();
      try {
        container.setAccentColor(resolveColor(client.color as any));
      } catch {}

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## ${selectedCategory} Commands`
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      if (cmds.size === 0) {
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent("*No commands found in this category.*")
        );
      } else {
        const cmdList = cmds
          .map((cmd) => `\`/${cmd.name.join(" ")}\``)
          .join("  ");
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(cmdList)
        );
      }

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# Showing ${cmds.size} command${cmds.size !== 1 ? "s" : ""} in **${selectedCategory}**`
        )
      );

      await i.update({
        flags: CV2_FLAG,
        components: [container, menuRow, ...(buttons.length > 0 ? [new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)] : [])],
      });
    });

    collector.on("end", (_collected: any, reason: string) => {
      if (reason === "time") {
        handler.editReply({
          flags: CV2_FLAG,
          components: [buildHelpContainer(client, handler, categories)],
        });
      }
    });
  }
}
