import { CommandInteraction, AutocompleteInteraction } from "discord.js";
import { Manager } from "../manager.js";
import { AutocompleteInteractionChoices, GlobalInteraction } from "../@types/Interaction.js";

export async function getPlaylistAutocomplete(
  client: Manager,
  interaction: GlobalInteraction,
  focusedValue: string = ""
): Promise<AutocompleteInteractionChoices[]> {
  let choice: AutocompleteInteractionChoices[] = [];

  try {
    const fullList = await client.db.playlist.all();

    if (fullList && Array.isArray(fullList)) {
      const userId = (interaction as CommandInteraction).user.id;
      const userPlaylists = fullList
        .filter((data: any) => {
          return data && data.value && data.value.owner === userId;
        })
        .map((data: any) => data.value)
        .filter((playlist: any) => {
          if (!playlist || !playlist.name || !playlist.id) return false;
          const searchValue = focusedValue.toLowerCase();
          return (
            playlist.name.toLowerCase().includes(searchValue) ||
            playlist.id.toLowerCase().includes(searchValue)
          );
        })
        .slice(0, 25);

      for (const playlist of userPlaylists) {
        choice.push({
          name: playlist.name,
          value: playlist.id,
        });
      }
    }
  } catch (error) {
    client.logger.error("Autocomplete playlist error:", error);
  }

  return choice;
}
