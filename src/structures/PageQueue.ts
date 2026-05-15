import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CommandInteraction,
  ContainerBuilder,
  Message,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
} from "discord.js";
import { Manager } from "../manager.js";
import { CV2_FLAG } from "../utilities/ComponentsV2.js";

export class PageQueue {
  client: Manager;
  pages: ContainerBuilder[];
  timeout: number;
  queueLength: number;
  language: string;

  constructor(
    client: Manager,
    pages: ContainerBuilder[],
    timeout: number,
    queueLength: number,
    language: string
  ) {
    this.client = client;
    this.pages = pages;
    this.timeout = timeout;
    this.queueLength = queueLength;
    this.language = language;
  }

  /** Clones a page container and appends a footer text display. */
  private withFooter(page: ContainerBuilder, footerText: string): ContainerBuilder {
    // We can't mutate the original, so we send the page as-is and append footer inline.
    // Since ContainerBuilder doesn't support cloning, we add a separator + text to the same container.
    page.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    page.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${footerText}`));
    return page;
  }

  private footerText(page: number, queueDuration: string): string {
    return this.client.i18n.get(this.language, "command.music", "queue_footer", {
      page: String(page + 1),
      pages: String(this.pages.length),
      queue_lang: String(this.queueLength),
      duration: String(queueDuration),
    });
  }

  private playlistFooterText(page: number): string {
    return this.client.i18n.get(this.language, "command.playlist", "view_embed_footer", {
      page: String(page + 1),
      pages: String(this.pages.length),
      songs: String(this.queueLength),
    });
  }

  async slashPage(interaction: CommandInteraction, queueDuration: string) {
    if (!interaction?.channel) throw new Error("Channel is inaccessible.");
    if (!this.pages) throw new Error("Pages are not given.");

    const row1 = new ButtonBuilder().setCustomId("back").setEmoji(this.client.icons.GLOBAL.arrow_previous).setStyle(ButtonStyle.Secondary);
    const row2 = new ButtonBuilder().setCustomId("next").setEmoji(this.client.icons.GLOBAL.arrow_next).setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(row1, row2);

    let page = 0;
    const curPage = await interaction.editReply({
      flags: CV2_FLAG,
      content: "",
      components: [this.withFooter(this.pages[page], this.footerText(page, queueDuration)), row],
      allowedMentions: { repliedUser: false },
    });
    if (this.pages.length == 0) return;

    const collector = curPage.createMessageComponentCollector({
      filter: (m) => m.user.id === interaction.user.id,
      time: this.timeout,
    });

    collector.on("collect", async (i) => {
      try { if (!i.deferred) await i.deferUpdate(); } catch { return; }
      if (i.customId === "back") page = page > 0 ? --page : this.pages.length - 1;
      else if (i.customId === "next") page = page + 1 < this.pages.length ? ++page : 0;
      curPage.edit({ flags: CV2_FLAG, content: "", components: [this.withFooter(this.pages[page], this.footerText(page, queueDuration)), row] }).catch(() => null);
    });

    collector.on("end", () => {
      const disabled = new ActionRowBuilder<ButtonBuilder>().addComponents(row1.setDisabled(true), row2.setDisabled(true));
      curPage.edit({ flags: CV2_FLAG, content: "", components: [this.withFooter(this.pages[page], this.footerText(page, queueDuration)), disabled] }).catch(() => null);
      // @ts-ignore
      collector.removeAllListeners();
    });

    return curPage;
  }

  async slashPlaylistPage(interaction: CommandInteraction) {
    if (!interaction?.channel) throw new Error("Channel is inaccessible.");
    if (!this.pages) throw new Error("Pages are not given.");

    const row1 = new ButtonBuilder().setCustomId("back").setEmoji(this.client.icons.GLOBAL.arrow_previous).setStyle(ButtonStyle.Secondary);
    const row2 = new ButtonBuilder().setCustomId("next").setEmoji(this.client.icons.GLOBAL.arrow_next).setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(row1, row2);

    let page = 0;
    const curPage = await interaction.editReply({
      flags: CV2_FLAG,
      content: "",
      components: [this.withFooter(this.pages[page], this.playlistFooterText(page)), row],
      allowedMentions: { repliedUser: false },
    });
    if (this.pages.length == 0) return;

    const collector = curPage.createMessageComponentCollector({
      filter: (m) => m.user.id === interaction.user.id,
      time: this.timeout,
    });

    collector.on("collect", async (i) => {
      try { if (!i.deferred) await i.deferUpdate(); } catch { return; }
      if (i.customId === "back") page = page > 0 ? --page : this.pages.length - 1;
      else if (i.customId === "next") page = page + 1 < this.pages.length ? ++page : 0;
      curPage.edit({ flags: CV2_FLAG, content: "", components: [this.withFooter(this.pages[page], this.playlistFooterText(page)), row] }).catch(() => null);
    });

    collector.on("end", () => {
      const disabled = new ActionRowBuilder<ButtonBuilder>().addComponents(row1.setDisabled(true), row2.setDisabled(true));
      curPage.edit({ flags: CV2_FLAG, content: "", components: [this.withFooter(this.pages[page], this.playlistFooterText(page)), disabled] }).catch(() => null);
      // @ts-ignore
      collector.removeAllListeners();
    });

    return curPage;
  }

  async prefixPage(message: Message, queueDuration: string) {
    if (!message?.channel) throw new Error("Channel is inaccessible.");
    if (!this.pages) throw new Error("Pages are not given.");

    const row1 = new ButtonBuilder().setCustomId("back").setEmoji(this.client.icons.GLOBAL.arrow_previous).setStyle(ButtonStyle.Secondary);
    const row2 = new ButtonBuilder().setCustomId("next").setEmoji(this.client.icons.GLOBAL.arrow_next).setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(row1, row2);

    let page = 0;
    const curPage = await message.reply({
      flags: CV2_FLAG,
      content: "",
      components: [this.withFooter(this.pages[page], this.footerText(page, queueDuration)), row],
      allowedMentions: { repliedUser: false },
    });
    if (this.pages.length == 0) return;

    const collector = curPage.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: this.timeout,
    });

    collector.on("collect", async (i) => {
      try { if (!i.deferred) await i.deferUpdate(); } catch { return; }
      if (i.customId === "back") page = page > 0 ? --page : this.pages.length - 1;
      else if (i.customId === "next") page = page + 1 < this.pages.length ? ++page : 0;
      curPage.edit({ flags: CV2_FLAG, content: "", components: [this.withFooter(this.pages[page], this.footerText(page, queueDuration)), row] }).catch(() => null);
    });

    collector.on("end", () => {
      const disabled = new ActionRowBuilder<ButtonBuilder>().addComponents(row1.setDisabled(true), row2.setDisabled(true));
      curPage.edit({ flags: CV2_FLAG, content: "", components: [this.withFooter(this.pages[page], this.footerText(page, queueDuration)), disabled] }).catch(() => null);
      // @ts-ignore
      collector.removeAllListeners();
    });

    return curPage;
  }

  async prefixPlaylistPage(message: Message) {
    if (!message?.channel) throw new Error("Channel is inaccessible.");
    if (!this.pages) throw new Error("Pages are not given.");

    const row1 = new ButtonBuilder().setCustomId("back").setEmoji(this.client.icons.GLOBAL.arrow_previous).setStyle(ButtonStyle.Secondary);
    const row2 = new ButtonBuilder().setCustomId("next").setEmoji(this.client.icons.GLOBAL.arrow_next).setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(row1, row2);

    let page = 0;
    const curPage = await message.reply({
      flags: CV2_FLAG,
      content: "",
      components: [this.withFooter(this.pages[page], this.playlistFooterText(page)), row],
      allowedMentions: { repliedUser: false },
    });
    if (this.pages.length == 0) return;

    const collector = curPage.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: this.timeout,
    });

    collector.on("collect", async (i) => {
      try { if (!i.deferred) await i.deferUpdate(); } catch { return; }
      if (i.customId === "back") page = page > 0 ? --page : this.pages.length - 1;
      else if (i.customId === "next") page = page + 1 < this.pages.length ? ++page : 0;
      curPage.edit({ flags: CV2_FLAG, content: "", components: [this.withFooter(this.pages[page], this.playlistFooterText(page)), row] }).catch(() => null);
    });

    collector.on("end", () => {
      const disabled = new ActionRowBuilder<ButtonBuilder>().addComponents(row1.setDisabled(true), row2.setDisabled(true));
      curPage.edit({ flags: CV2_FLAG, content: "", components: [this.withFooter(this.pages[page], this.playlistFooterText(page)), disabled] }).catch(() => null);
      // @ts-ignore
      collector.removeAllListeners();
    });

    return curPage;
  }

  async buttonPage(interaction: ButtonInteraction, queueDuration: string) {
    if (!interaction?.channel) throw new Error("Channel is inaccessible.");
    if (!this.pages) throw new Error("Pages are not given.");

    const row1 = new ButtonBuilder().setCustomId("back").setEmoji(this.client.icons.GLOBAL.arrow_previous).setStyle(ButtonStyle.Secondary);
    const row2 = new ButtonBuilder().setCustomId("next").setEmoji(this.client.icons.GLOBAL.arrow_next).setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(row1, row2);

    let page = 0;
    const curPage = await interaction.reply({
      flags: CV2_FLAG,
      content: "",
      components: [this.withFooter(this.pages[page], this.footerText(page, queueDuration)), row],
      allowedMentions: { repliedUser: false },
      ephemeral: true,
    });
    if (this.pages.length == 0) return;

    const collector = curPage.createMessageComponentCollector({
      filter: (m) => m.user.id === interaction.user.id,
      time: this.timeout,
    });

    collector.on("collect", async (i) => {
      try { if (!i.deferred) await i.deferUpdate(); } catch { return; }
      if (i.customId === "back") page = page > 0 ? --page : this.pages.length - 1;
      else if (i.customId === "next") page = page + 1 < this.pages.length ? ++page : 0;
      i.editReply({ flags: CV2_FLAG, content: "", components: [this.withFooter(this.pages[page], this.footerText(page, queueDuration)), row] });
    });

    collector.on("end", () => {
      const disabled = new ActionRowBuilder<ButtonBuilder>().addComponents(row1.setDisabled(true), row2.setDisabled(true));
      interaction.editReply({ flags: CV2_FLAG, content: "", components: [this.withFooter(this.pages[page], this.footerText(page, queueDuration)), disabled] });
      // @ts-ignore
      collector.removeAllListeners();
    });

    return curPage;
  }
}
