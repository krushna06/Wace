import { Manager } from "../manager.js";
import { LavalinkDataType } from "../@types/Lavalink.js";
import chalk from "chalk";
export class AutoFixLavalink {
  client: Manager;
  lavalinkName: string;
  constructor(client: Manager, lavalinkName: string) {
    this.client = client;
    this.lavalinkName = lavalinkName;
    this.execute();
  }
  async execute() {
    this.client.logger.info(AutoFixLavalink.name, "----- Starting autofix lavalink... -----");
    let hasOnlineNodes = false;
    this.client.shoukaku.nodes.forEach((node) => {
      if (node.state === 2) {
        hasOnlineNodes = true;
      }
    });
    if (hasOnlineNodes) {
      this.client.logger.info(
        AutoFixLavalink.name,
        `Found online node(s), skipping autofix.`
      );
      this.client.logger.info(AutoFixLavalink.name, "----- Terminated autofix lavalink. -----");
      return;
    }
    this.checkLavalink();
    await this.removeCurrentLavalink();
    if (this.client.lavalinkList.filter((i) => i.online).length == 0) {
      const autofixError = chalk.hex("#e12885");
      const autofixErrorMess = autofixError("Error: ");
      this.client.logger.info(
        AutoFixLavalink.name,
        autofixErrorMess + "No lavalink online or avalible for this bot."
      );
      this.client.logger.info(
        AutoFixLavalink.name,
        autofixErrorMess +
          "Please shutdown the bot, enter the valid lavalink server (v4) and reboot the bot"
      );
      this.client.logger.info(AutoFixLavalink.name, "----- Terminated autofix lavalink. -----");
      return;
    }
    await this.applyNewLavalink();
    this.client.logger.info(
      AutoFixLavalink.name,
      "Now used new lavalink, please wait 1 second to make it connect."
    );
    this.client.logger.info(AutoFixLavalink.name, "----- Terminated autofix lavalink. -----");
  }
  checkLavalink() {
    if (this.client.shoukaku.nodes.size !== 0 && this.client.lavalinkUsing.length == 0) {
      this.client.shoukaku.nodes.forEach((data, index) => {
        const configNode = this.client.config.player.NODES.find(n => n.name === index);
        if (configNode) {
          this.client.lavalinkUsing.push({
            host: configNode.host,
            port: configNode.port,
            pass: configNode.auth,
            secure: configNode.secure || false,
            name: index,
          });
        }
      });
    }
  }
  async removeCurrentLavalink() {
    const lavalinkIndex = this.client.lavalinkUsing.findIndex(
      (data) => data.name == this.lavalinkName
    );
    if (lavalinkIndex === -1) {
      return;
    }
    const targetLavalink = this.client.lavalinkUsing[lavalinkIndex];
    if (this.client.shoukaku.nodes.size == 0 && this.client.lavalinkUsing.length != 0) {
      this.client.lavalinkUsing.splice(lavalinkIndex, 1);
    } else if (this.client.shoukaku.nodes.size !== 0 && this.client.lavalinkUsing.length !== 0) {
      const isLavalinkExist = this.client.shoukaku.nodes.get(targetLavalink.name);
      if (isLavalinkExist) this.client.shoukaku.removeNode(targetLavalink.name);
      this.client.lavalinkUsing.splice(lavalinkIndex, 1);
    }
  }
  async applyNewLavalink() {
    const onlineList: LavalinkDataType[] = [];
    this.client.lavalinkList.filter(async (data) => {
      if (data.online == true) return onlineList.push(data);
    });
    const nodeInfo = onlineList[Math.floor(Math.random() * onlineList.length)];
    this.client.shoukaku.addNode({
      name: nodeInfo.name,
      url: `${nodeInfo.host}:${nodeInfo.port}`,
      auth: nodeInfo.pass,
      secure: nodeInfo.secure,
    });
    return nodeInfo;
  }
}