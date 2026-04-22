import {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ThumbnailBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  resolveColor,
  ActionRowBuilder,
} from "discord.js";
import type { ColorResolvable } from "discord.js";

export const CV2_FLAG = MessageFlags.IsComponentsV2;

export interface FieldData {
  name: string;
  value: string;
  inline?: boolean;
}

export interface EmbedLikeOptions {
  /** Accent/border color for the container. */
  color?: ColorResolvable;
  /** Bold header line rendered above the description. */
  title?: string;
  /** Author line (rendered as italic text above title). */
  author?: string;
  /** Main body markdown text. */
  description?: string;
  /** Thumbnail image URL shown on the right side of the first section. */
  thumbnail?: string;
  /** Fields rendered as a markdown table-like block below the description. */
  fields?: FieldData[];
  /** Footer text rendered at the bottom. */
  footer?: string;
  /** Timestamp appended to footer. */
  timestamp?: boolean;
  /** Action rows (buttons/selects) to nest inside the container. */
  components?: ActionRowBuilder<any>[];
}

function resolveAccentColor(color?: ColorResolvable): number | undefined {
  if (color === undefined || color === null) return undefined;
  try {
    return resolveColor(color);
  } catch {
    return undefined;
  }
}

export function buildEmbed(options: EmbedLikeOptions): ContainerBuilder {
  const container = new ContainerBuilder();

  const accentColor = resolveAccentColor(options.color);
  if (accentColor !== undefined) container.setAccentColor(accentColor);

  const headerLines: string[] = [];
  if (options.author) headerLines.push(`*${options.author}*`);
  if (options.title) headerLines.push(`**${options.title}**`);
  if (options.description) headerLines.push(options.description);

  if (headerLines.length > 0) {
    if (options.thumbnail) {
      const section = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(headerLines.join("\n"))
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(options.thumbnail)
        );
      container.addSectionComponents(section);
    } else {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(headerLines.join("\n"))
      );
    }
  }

  if (options.fields && options.fields.length > 0) {
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    let inlineBuffer: FieldData[] = [];

    const flushInline = () => {
      if (inlineBuffer.length === 0) return;
      const text = inlineBuffer
        .map((f) => `**${f.name}:** ${f.value}`)
        .join("\n");
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(text));
      inlineBuffer = [];
    };

    for (const field of options.fields) {
      if (field.inline) {
        inlineBuffer.push(field);
        if (inlineBuffer.length === 3) flushInline();
      } else {
        flushInline();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`**${field.name}**\n${field.value}`)
        );
      }
    }
    flushInline();
  }

  if (options.footer || options.timestamp) {
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );
    const footerParts: string[] = [];
    if (options.footer) footerParts.push(options.footer);
    if (options.timestamp) footerParts.push(`<t:${Math.floor(Date.now() / 1000)}:R>`);
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ${footerParts.join(" • ")}`)
    );
  }

  if (options.components && options.components.length > 0) {
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );
    container.addActionRowComponents(...options.components);
  }

  return container;
}

function simple(description: string, color?: ColorResolvable): ContainerBuilder {
  return buildEmbed({ description, color });
}

export const cv2 = {
  build: buildEmbed,
  simple,
};
