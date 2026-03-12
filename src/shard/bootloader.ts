import { Manager } from "../manager.js";
import { ConfigDataService } from "../services/ConfigDataService.js";
const configData = new ConfigDataService().data;
const index = Number(process.env.WACE_CURRENT_INDEX);
const token = String(process.env.WACE_CURRENT_TOKEN);
const wace = new Manager(configData, index, configData.utilities.MESSAGE_CONTENT.enable);

process
  .on("unhandledRejection", (error) => wace.logger.unhandled("AntiCrash", error))
  .on("uncaughtException", (error) => wace.logger.unhandled("AntiCrash", error))
  .on("uncaughtExceptionMonitor", (error) => wace.logger.unhandled("AntiCrash", error))
  .on("exit", () => wace.logger.info("ClientManager", `Successfully Powered Off ${configData.bot.BOT_NAME}, Good Bye!`))
  .on("SIGINT", () => {
    wace.logger.info("ClientManager", `Powering Down ${configData.bot.BOT_NAME}...`);
    process.exit(0);
  });

wace.start();
wace.login(token);