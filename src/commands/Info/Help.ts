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

function buildHelpContainer(
  client: Manager,
  handler: CommandHandler,
  categories: string[],
  selectMenu: StringSelectMenuBuilder,
  buttons: ButtonBuilder[],
  showNavButtons: boolean = false
): ContainerBuilder {
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

  const categoryLines = categories
    .map((cat) => `**${cat}**`)
    .join("\n");

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(categoryLines)
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );

  container.addActionRowComponents(
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu)
  );

  if (showNavButtons) {
    const allButtons: ButtonBuilder[] = [
      new ButtonBuilder()
        .setCustomId("help-prev")
        .setLabel("<")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("help-next")
        .setLabel(">")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("help-disable")
        .setLabel("✕")
        .setStyle(ButtonStyle.Secondary),
      ...buttons,
    ];
    container.addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(allButtons)
    );
  } else if (buttons.length > 0) {
    container.addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)
    );
  }

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

    if (hasLink(client.config.bot.INVITE_LINK)) {
      buttons.push(
        new ButtonBuilder()
          .setLabel("Invite")
          .setStyle(ButtonStyle.Link)
          .setURL(client.config.bot.INVITE_LINK)
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

    const helpContainer = buildHelpContainer(client, handler, categories, selectMenu, buttons, true);

    await handler.editReply({ flags: CV2_FLAG, components: [helpContainer] });

    const filter = (i: any) =>
      (i.customId === "help-select-category" || 
       i.customId === "help-prev" || 
       i.customId === "help-next" ||
       i.customId === "help-disable") && 
      i.user.id === handler.user!.id;

    // @ts-ignore
    const collector = handler.channel!.createMessageComponentCollector({ filter, time: 60000 });

    let currentCategory: string | null = null;
    let categoryHistory: string[] = [];

    collector.on("collect", async (i: any) => {
      if (i.customId === "help-select-category") {
        currentCategory = i.values[0];
        categoryHistory.push(currentCategory);
        
        const cmds = client.commands.filter((c) => c.category === currentCategory);

        const container = new ContainerBuilder();
        try {
          container.setAccentColor(resolveColor(client.color as any));
        } catch {}

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## ${currentCategory} Commands`
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
            `-# Showing ${cmds.size} command${cmds.size !== 1 ? "s" : ""} in **${currentCategory}**`
          )
        );

        container.addActionRowComponents(
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu)
        );

        const allButtons: ButtonBuilder[] = [
          new ButtonBuilder()
            .setCustomId("help-prev")
            .setLabel("<")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("help-next")
            .setLabel(">")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("help-disable")
            .setLabel("✕")
            .setStyle(ButtonStyle.Secondary),
          ...buttons,
        ];

        container.addActionRowComponents(
          new ActionRowBuilder<ButtonBuilder>().addComponents(allButtons)
        );

        await i.update({
          flags: CV2_FLAG,
          components: [container],
        });
      } else if (i.customId === "help-disable") {
        await i.message.delete().catch(() => null);
        collector.stop();
      } else if (i.customId === "help-prev") {
        if (categoryHistory.length > 0) {
          categoryHistory.pop();
        }

        if (categoryHistory.length === 0) {
          const container = buildHelpContainer(client, handler, categories, selectMenu, buttons, true);
          currentCategory = null;

          await i.update({
            flags: CV2_FLAG,
            components: [container],
          });
        } else {
          // Go to previous category in history
          currentCategory = categoryHistory[categoryHistory.length - 1];
          const cmds = client.commands.filter((c) => c.category === currentCategory);

          const container = new ContainerBuilder();
          try {
            container.setAccentColor(resolveColor(client.color as any));
          } catch {}

          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `## ${currentCategory} Commands`
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
              `-# Showing ${cmds.size} command${cmds.size !== 1 ? "s" : ""} in **${currentCategory}**`
            )
          );

          container.addActionRowComponents(
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu)
          );

          const allButtons: ButtonBuilder[] = [
            new ButtonBuilder()
              .setCustomId("help-prev")
              .setLabel("<")
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId("help-next")
              .setLabel(">")
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId("help-disable")
              .setLabel("✕")
              .setStyle(ButtonStyle.Secondary),
            ...buttons,
          ];

          container.addActionRowComponents(
            new ActionRowBuilder<ButtonBuilder>().addComponents(allButtons)
          );

          await i.update({
            flags: CV2_FLAG,
            components: [container],
          });
        }
      } else if (i.customId === "help-next") {
        const currentIndex = categories.indexOf(currentCategory || "");
        const nextIndex = (currentIndex + 1) % categories.length;
        const nextCategory = categories[nextIndex];
        
        currentCategory = nextCategory;
        categoryHistory.push(nextCategory);
        
        const cmds = client.commands.filter((c) => c.category === nextCategory);

        const container = new ContainerBuilder();
        try {
          container.setAccentColor(resolveColor(client.color as any));
        } catch {}

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## ${nextCategory} Commands`
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
            `-# Showing ${cmds.size} command${cmds.size !== 1 ? "s" : ""} in **${nextCategory}**`
          )
        );

        container.addActionRowComponents(
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu)
        );

        const allButtons: ButtonBuilder[] = [
          new ButtonBuilder()
            .setCustomId("help-prev")
            .setLabel("<")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("help-next")
            .setLabel(">")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("help-disable")
            .setLabel("✕")
            .setStyle(ButtonStyle.Secondary),
          ...buttons,
        ];

        container.addActionRowComponents(
          new ActionRowBuilder<ButtonBuilder>().addComponents(allButtons)
        );

        await i.update({
          flags: CV2_FLAG,
          components: [container],
        });
      }
    });

    collector.on("end", (_collected: any, reason: string) => {
      if (reason === "time") {
        const container = new ContainerBuilder();
        try {
          container.setAccentColor(resolveColor(client.color as any));
        } catch {}

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent("Help menu has expired.")
        );

        handler.editReply({
          flags: CV2_FLAG,
          components: [container],
        });
      }
    });
  }
}
