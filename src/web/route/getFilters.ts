import { FastifyRequest, FastifyReply } from "fastify";
import { Manager } from "../../manager.js";
import { WacelinkFilterData } from "../../wacelink/Interface/Constants.js";

export const getFilters = (client: Manager) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const filters = Object.keys(WacelinkFilterData).map(filterName => ({
        name: filterName,
        description: filterName === "clear" 
          ? "Reset all filters to default" 
          : `${filterName.charAt(0).toUpperCase() + filterName.slice(1)} filter for better audio experience`,
        data: WacelinkFilterData[filterName as keyof typeof WacelinkFilterData]
      }));

      reply.send({
        success: true,
        data: {
          filters,
          total: filters.length
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