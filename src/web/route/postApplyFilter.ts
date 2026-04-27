import { FastifyRequest, FastifyReply } from "fastify";
import { Manager } from "../../manager.js";
import { FilterPresets, FilterName } from "../../structures/Filters.js";

interface ApplyFilterBody {
  filter: string;
  amount?: number;
}

export const postApplyFilter = (client: Manager) => {
  return async (request: FastifyRequest<{ Params: { guildId: string }, Body: ApplyFilterBody }>, reply: FastifyReply) => {
    try {
      const { guildId } = request.params;
      const { filter, amount } = request.body;

      if (!filter) {
        return reply.code(400).send({
          success: false,
          error: "Filter name is required"
        });
      }

      const player = client.players.get(guildId);
      if (!player) {
        return reply.code(404).send({
          success: false,
          error: "No active player found for this guild"
        });
      }

      const filterCommand = client.commands.find(cmd =>
        cmd.category === "Filter" &&
        cmd.name.some(name => name.toLowerCase() === filter.toLowerCase())
      );

      if (!filterCommand) {
        return reply.code(400).send({
          success: false,
          error: `Filter '${filter}' not found. Use GET /v1/filters to see available filters.`
        });
      }

      const actualFilterName = filterCommand.name[0].toLowerCase();

      if (actualFilterName === "filter" && (filter.toLowerCase() === "clear" || filter.toLowerCase() === "reset")) {
        player.data.delete("filter-mode");
        await player.filters.clear();
        await player.setVolume(100);

        reply.send({
          success: true,
          data: {
            guildId,
            filter: null,
            commandName: filter,
            message: "All filters have been reset"
          }
        });
        return;
      }

      if (!FilterPresets[actualFilterName as FilterName]) {
        return reply.code(400).send({
          success: false,
          error: `Filter '${actualFilterName}' not found in FilterPresets. Use GET /v1/filters to see available filters.`
        });
      }

      if (player.data.get("filter-mode") === actualFilterName && actualFilterName !== "filter") {
        return reply.code(400).send({
          success: false,
          error: `Filter '${actualFilterName}' is already applied`
        });
      }

      if (actualFilterName === "bass" && amount !== undefined) {
        if (isNaN(amount) || amount > 10 || amount < -10) {
          return reply.code(400).send({
            success: false,
            error: "Bass amount must be a number between -10 and 10"
          });
        }

        player.filters.setEqualizer([
          { band: 0, gain: amount / 10 },
          { band: 1, gain: amount / 10 },
          { band: 2, gain: amount / 10 },
          { band: 3, gain: amount / 10 },
          { band: 4, gain: amount / 10 },
          { band: 5, gain: amount / 10 },
          { band: 6, gain: amount / 10 },
          { band: 7, gain: 0 },
          { band: 8, gain: 0 },
          { band: 9, gain: 0 },
          { band: 10, gain: 0 },
          { band: 11, gain: 0 },
          { band: 12, gain: 0 },
          { band: 13, gain: 0 },
        ]);
        player.data.set("filter-mode", actualFilterName);
      } else {
        player.data.set("filter-mode", actualFilterName);
        await player.filters.set(actualFilterName as FilterName);
      }

      reply.send({
        success: true,
        data: {
          guildId,
          filter: actualFilterName,
          commandName: filter,
          message: `Filter '${actualFilterName}' has been applied successfully`
        }
      });
    } catch (error) {
      client.logger.error("postApplyFilter", error);
      reply.code(500).send({
        success: false,
        error: "Internal server error"
      });
    }
  };
};