import { FastifyRequest, FastifyReply } from "fastify";
import { Manager } from "../../manager.js";
import { FilterPresets } from "../../structures/Filters.js";

export const getFilters = (client: Manager) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const filterCommands = client.commands.filter(cmd =>
        cmd.category === "Filter" && cmd.name.some(name => name.startsWith("filter"))
      );

      const filters = filterCommands.map(cmd => {
        const filterName = cmd.name.find(name => name !== "filter" && name !== "filter2") || cmd.name[0];
        const isInPresets = FilterPresets[filterName as keyof typeof FilterPresets];

        return {
          name: filterName,
          commandNames: cmd.name,
          description: cmd.description,
          category: cmd.category,
          hasFilterData: !!isInPresets,
          filterData: isInPresets || null,
          usage: cmd.usage,
          aliases: cmd.aliases
        };
      });

      const availableFilters = Object.keys(FilterPresets).map(filterName => ({
        name: filterName,
        type: "shoukaku",
        description: filterName === "clear"
          ? "Reset all filters to default"
          : `${filterName.charAt(0).toUpperCase() + filterName.slice(1)} filter for better audio experience`,
        data: FilterPresets[filterName as keyof typeof FilterPresets]
      }));

      reply.send({
        success: true,
        data: {
          commandFilters: filters,
          availableFilters: availableFilters,
          totalCommandFilters: filters.length,
          totalAvailableFilters: availableFilters.length
        }
      });
    } catch (error) {
      client.logger.error("getFilters", error);
      reply.code(500).send({
        success: false,
        error: "Internal server error"
      });
    }
  };
};