import {
  ActionRowBuilder,
  ButtonBuilder,
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

export class Page {
  client: Manager;
  pages: ContainerBuilder[];
  timeout: number;
  language: string;

  constructor(client: Manager, pages: ContainerBuilder[], timeout: number, language: string) {
    this.client = client;
    this.pages = pages;
    this.timeout = timeout;
    this.language = language;
  }

  private withFooter(page: ContainerBuilder, footerText: string): ContainerBuilder {
    page.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    page.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${footerText}`));
    return page;
  }

  async slashPage(interaction: CommandInteraction) {
    if (!interaction?.channel) throw new Error("Channel is inaccessible.");
    if (!this.pages) throw new Error("Pages are not given.");

    const row1 = new ButtonBuilder().setCustomId("back").setEmoji(this.client.icons.GLOBAL.arrow_previous).setStyle(ButtonStyle.Secondary);
    const row2 = new ButtonBuilder().setCustomId("next").setEmoji(this.client.icons.GLOBAL.arrow_next).setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(row1, row2);

    let page = 0;
    const footer = () => `${String(page + 1)}/${String(this.pages.length)}`;

    const curPage = await interaction.editReply({
      flags: CV2_FLAG,
      content: "",
      components: [this.withFooter(this.pages[page], footer()), row],
      allowedMentions: { repliedUser: false },
    });
    if (this.pages.length == 0) return;

    const collector = curPage.createMessageComponentCollector({
      filter: (m) => m.user.id === interaction.user.id,
      time: this.timeout,
    });

    collector.on("collect", async (i) => {
      if (!i.deferred) await i.deferUpdate();
      if (i.customId === "back") page = page > 0 ? --page : this.pages.length - 1;
      else if (i.customId === "next") page = page + 1 < this.pages.length ? ++page : 0;
      curPage.edit({ flags: CV2_FLAG, content: "", components: [this.withFooter(this.pages[page], footer()), row] }).catch(() => null);
    });

    collector.on("end", () => {
      const disabled = new ActionRowBuilder<ButtonBuilder>().addComponents(row1.setDisabled(true), row2.setDisabled(true));
      curPage.edit({ flags: CV2_FLAG, content: "", components: [this.withFooter(this.pages[page], footer()), disabled] }).catch(() => null);
      // @ts-ignore
      collector.removeAllListeners();
    });

    return curPage;
  }

  async prefixPage(message: Message) {
    if (!message?.channel) throw new Error("Channel is inaccessible.");
    if (!this.pages) throw new Error("Pages are not given.");

    const row1 = new ButtonBuilder().setCustomId("back").setEmoji(this.client.icons.GLOBAL.arrow_previous).setStyle(ButtonStyle.Secondary);
    const row2 = new ButtonBuilder().setCustomId("next").setEmoji(this.client.icons.GLOBAL.arrow_next).setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(row1, row2);

    let page = 0;
    const footer = () => `${String(page + 1)}/${String(this.pages.length)}`;

    const curPage = await message.reply({
      flags: CV2_FLAG,
      content: "",
      components: [this.withFooter(this.pages[page], footer()), row],
      allowedMentions: { repliedUser: false },
    });
    if (this.pages.length == 0) return;

    const collector = curPage.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: this.timeout,
    });

    collector.on("collect", async (i) => {
      if (!i.deferred) await i.deferUpdate();
      if (i.customId === "back") page = page > 0 ? --page : this.pages.length - 1;
      else if (i.customId === "next") page = page + 1 < this.pages.length ? ++page : 0;
      curPage.edit({ flags: CV2_FLAG, content: "", components: [this.withFooter(this.pages[page], footer()), row] }).catch(() => null);
    });

    collector.on("end", () => {
      const disabled = new ActionRowBuilder<ButtonBuilder>().addComponents(row1.setDisabled(true), row2.setDisabled(true));
      curPage.edit({ flags: CV2_FLAG, content: "", components: [this.withFooter(this.pages[page], footer()), disabled] }).catch(() => null);
      // @ts-ignore
      collector.removeAllListeners();
    });

    return curPage;
  }
}
