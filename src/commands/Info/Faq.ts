import {
    EmbedBuilder,
    StringSelectMenuBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
  } from "discord.js";
  import { Accessableby, Command } from "../../structures/Command.js";
  import { CommandHandler } from "../../structures/CommandHandler.js";
  import { Manager } from "../../manager.js";
  
  export default class implements Command {
    public name = ["faq"];
    public description = "Displays frequently asked questions.";
    public category = "Info";
    public accessableby = [Accessableby.Member];
    public usage = "/faq";
    public aliases = ["faq"];
    public lavalink = false;
    public usingInteraction = true;
    public playerCheck = false;
    public sameVoiceCheck = false;
    public permissions = [];
    public options = [];
  
    public async execute(client: Manager, handler: CommandHandler) {
      await handler.deferReply();
  
      const faqOptions = [
        { label: "How to use the bot?", value: "how_to_use" },
        { label: "What sources does the bot support?", value: "supported_sources" },
        { label: "How many public versions are there?", value: "public_versions" },
        { label: "Does Wace have premium plans?", value: "premium_plans" },
        { label: "Why doesn't Wace support YouTube playback?", value: "youtube_playback" },
      ];
  
      // Generate the list of options for the initial message
      const faqList = faqOptions.map((option) => `- ${option.label}`).join("\n");
  
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("select-faq")
        .setPlaceholder("Choose a FAQ")
        .addOptions(faqOptions);
  
      const initialEmbed = new EmbedBuilder()
        .setDescription(`Please select a FAQ from the dropdown menu below.\n\n${faqList}`)
        .setColor(client.color);
  
      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
  
      // Adding a button to display sources
      const sourcesButton = new ButtonBuilder()
        .setCustomId("show-sources")
        .setLabel("Sources")
        .setStyle(ButtonStyle.Primary);
  
      const rowWithButton = new ActionRowBuilder<ButtonBuilder>().addComponents(sourcesButton);
  
      const initialMessage = await handler.editReply({
        embeds: [initialEmbed],
        components: [row, rowWithButton],
      });
  
      const filter = (i) => (i.customId === "select-faq" || i.customId === "show-sources") && i.user.id === handler.user.id;
      const collector = handler.channel.createMessageComponentCollector({ filter, time: 60000 });
  
      collector.on("collect", async (i) => {
        if (i.customId === "select-faq" && i.isSelectMenu()) {
          const selectedFaq = i.values[0];
          const embed = this.generateFaqEmbed(client, selectedFaq);
          await i.update({
            embeds: [embed],
            components: [row, rowWithButton],
          });
        } else if (i.customId === "show-sources" && i.isButton()) {
          const embed = this.generateSourcesEmbed(client);
          await i.update({
            embeds: [embed],
            components: [row, rowWithButton],
          });
        }
      });
  
      collector.on("end", (collected) => {
        if (!collected.size) {
          handler.editReply({
            content: "You didn't select any FAQ.",
            components: [],
          });
        }
      });
    }
  
    private generateFaqEmbed(client: Manager, faq: string): EmbedBuilder {
      let title: string;
      let description: string;
  
      switch (faq) {
        case "how_to_use":
          title = "**How to use the bot?**";
          description = "Join a voice channel and use `/play {Song/URL}` command to play a song. Wace supports names, YouTube video links, playlist links, and Spotify links.";
          break;
        case "supported_sources":
          title = "**What sources does the bot support?**";
          description = "Wace currently supports over 10 audio streaming sources, with Spotify being an exception.\n\n" +
            "**Spotify**: Due to Spotify's API limitations regarding audio files, it is primarily utilized for song searching and information gathering. Actual audio playback typically originates from popular sources such as SoundCloud and Deezer in most instances.";
          break;
        case "public_versions":
          title = "**How many public versions are there?**";
          description = "There are only 3 public versions: [Wace](https://discord.com/oauth2/authorize?client_id=1221392528566386768), [Wace 2](https://discord.com/oauth2/authorize?client_id=1252093771764596742), [Wace 3](https://discord.com/oauth2/authorize?client_id=1252095329487290530)";
          break;
        case "premium_plans":
          title = "**Does Wace have premium plans?**";
          description = "Yes, you can visit [Wace Pricing](https://wace.live/#pricing) for more details.";
          break;
        case "youtube_playback":
          title = "**Why doesn't Wace support YouTube playback?**";
          description = "In 2021, popular music bots faced significant challenges when YouTube tightened its restrictions on API access, severely limiting or completely halting their ability to stream audio content from the platform. This development prompted many services to diversify their supported streaming sources to maintain functionality and user satisfaction.\n\n" +
            "Please note: Wace does not support YouTube and will not do so due to YouTube's restrictions on API usage.";
          break;
        default:
          title = "**FAQ**";
          description = "Please select a FAQ from the dropdown menu.";
      }
  
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(client.color);
  
      return embed;
    }
  
    private generateSourcesEmbed(client: Manager): EmbedBuilder {
      const title = "Music Sources Supported by Wace";
      const description = "Here are the music sources supported by Wace:\n\n" +
        "```\n" +
        "| Music Source        | Status |\n" +
        "|---------------------|--------|\n" +
        "| SoundCloud          | ✅     |\n" +
        "| (LS) Spotify        | ✅     |\n" +
        "| HTTP                | ✅     |\n" +
        "| (LS) Deezer         | ✅     |\n" +
        "| Twitch              | ✅     |\n" +
        "| Bandcamp            | ✅     |\n" +
        "| Nicovideo           | ⚠️     |\n" +
        "| (LS) Apple Music    | ✅     |\n" +
        "| (LS) Yandex Music   | ✅     |\n" +
        "| (LS) Flowery TTS    | ✅     |\n" +
        "| (DB) Mixcloud       | ✅     |\n" +
        "| (DB) OC ReMix       | ✅     |\n" +
        "| (DB) Clyp.it        | ✅     |\n" +
        "| (DB) Reddit         | ✅     |\n" +
        "| (DB) GetYarn        | ✅     |\n" +
        "| (DB) Text to Speech | ✅     |\n" +
        "| (DB) TikTok (BETA)  | ✅     |\n" +
        "| (DB) Soundgasm      | ✅     |\n" +
        "```";
  
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(client.color);
  
      return embed;
    }
  }
  