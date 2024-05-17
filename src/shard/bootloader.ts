import { Manager } from "../manager.js";
import { ConfigDataService } from "../services/ConfigDataService.js";
const configData = new ConfigDataService().data;
const index = Number(process.env.WACE_CURRENT_INDEX);
const token = String(process.env.WACE_CURRENT_TOKEN);
new Manager(configData, index, configData.features.MESSAGE_CONTENT.enable).login(token);
