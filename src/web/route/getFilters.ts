import { FastifyRequest, FastifyReply } from "fastify";
import { Manager } from "../../manager.js";
import { WacelinkFilterData } from "../../wacelink/Interface/Constants.js";

export const getFilters = (client: Manager) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const filterCommands = client.commands.filter(cmd => 
        cmd.category === "Filter" && cmd.name.some(name => name.startsWith("filter"))
      );

      const filters = filterCommands.map(cmd => {
        const filterName = cmd.name.find(name => name !== "filter" && name !== "filter2") || cmd.name[0];
        const isInWacelink = WacelinkFilterData[filterName as keyof typeof WacelinkFilterData];
        
        return {
          name: filterName,
          commandNames: cmd.name,
          description: cmd.description,
          category: cmd.category,
          hasWacelinkData: !!isInWacelink,
          wacelinkData: isInWacelink || null,
          usage: cmd.usage,
          aliases: cmd.aliases
        };
      });

      const wacelinkFilters = Object.keys(WacelinkFilterData).map(filterName => ({
        name: filterName,
        type: "wacelink",
        description: filterName === "clear" 
          ? "Reset all filters to default" 
          : `${filterName.charAt(0).toUpperCase() + filterName.slice(1)} filter for better audio experience`,
        data: WacelinkFilterData[filterName as keyof typeof WacelinkFilterData]
      }));

      reply.send({
        success: true,
        data: {
          commandFilters: filters,
          wacelinkFilters: wacelinkFilters,
          totalCommandFilters: filters.length,
          totalWacelinkFilters: wacelinkFilters.length
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