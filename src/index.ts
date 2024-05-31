import { Manager } from "./manager.js";
import { ConfigDataService } from "./services/ConfigDataService.js";
const configData = new ConfigDataService().data;
configData.bot.TOKEN.forEach((token, index) => {
  const wace = new Manager(configData, index, configData.utilities.MESSAGE_CONTENT.enable);
  // Anti crash handling
  process
    .on("unhandledRejection", (error) => wace.logger.unhandled("AntiCrash", error))
    .on("uncaughtException", (error) => wace.logger.unhandled("AntiCrash", error))
    .on("uncaughtExceptionMonitor", (error) => wace.logger.unhandled("AntiCrash", error))
    .on("exit", () => wace.logger.info("ClientManager", `Successfully Powered Off Wace, Good Bye!`))
    .on("SIGINT", () => {
      wace.logger.info("ClientManager", `Powering Down Wace...`);
      process.exit(0);
    });
  wace.start();
  wace.login(token);
});
