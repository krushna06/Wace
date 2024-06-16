import { Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import {
  EmbedBuilder,
  CommandInteraction,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ComponentType,
  CommandInteractionOptionResolver,
} from "discord.js";
import fetch from 'node-fetch';
import { getAccessToken } from "../../services/SpotifySearchService.js";

export default class implements Command {
  public name = ["spotify", "artist"];
  public description = "Searches for a Spotify artist";
  public category = "Spotify";
  public accessableby = [];
  public usage = "";
  public aliases = [];
  public lavalink = false;
  public options = [
    {
      name: "query",
      type: 3, // String type
      description: "The artist you want to search for",
      required: true,
    },
  ];
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const interaction = handler.interaction as CommandInteraction;
    const query = (interaction.options as CommandInteractionOptionResolver).getString("query");

    if (!query) {
      await handler.editReply({ content: "Please provide a valid artist name." });
      return;
    }

    try {
      const accessToken = await getAccessToken();
      const artist = await searchArtist(query, accessToken);

      if (!artist) {
        await handler.editReply({ content: "No artist found with that name." });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(artist.name)
        .setColor(client.color)
        .setThumbnail(artist.image)
        .setTimestamp();

      await handler.editReply({ embeds: [embed] });

    } catch (error) {
      console.error("Error searching Spotify artist:", error);
      await handler.editReply({ content: "An error occurred while searching for the artist." });
    }
  }
}

async function searchArtist(query: string, accessToken: string): Promise<any | null> {
  const searchEndpoint = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=1`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  try {
    const response = await fetch(searchEndpoint, { headers });
    if (!response.ok) {
      throw new Error("Failed to fetch artist data from Spotify.");
    }

    const data = await response.json() as { artists: { items: any[] } };
    if (data.artists.items.length === 0) {
      return null;
    }

    const artist = data.artists.items[0];
    const image = artist.images.length > 0 ? artist.images[0].url : null;

    return {
      name: artist.name,
      image: image
    };

  } catch (error) {
    console.error("Error searching Spotify artist:", error);
    return null; // Return null in case of error
  }
}
