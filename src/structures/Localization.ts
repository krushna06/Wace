import { I18n, I18nArgs, I18nOptions } from "@hammerhq/localization";
import { Config } from "../@types/Config.js";

export class Localization extends I18n {
  private config?: Config;
  private clientId?: string;

  constructor(options: I18nOptions, config?: Config, clientId?: string) {
    super(options);
    this.config = config;
    this.clientId = clientId;
  }

  public get(locale: string, section: string, key: string, args?: I18nArgs | undefined) {
    let currentString = super.get(locale, section, key, args);
    const locateErr = `Locale '${locale}' not found.`;
    const sectionErr = `Section '${section}' not found in locale '${locale}'`;
    const keyErr = `Key '${key}' not found in section ${section} in locale '${locale}'`;

    if (currentString == locateErr || currentString == sectionErr || currentString == keyErr) {
      currentString = super.get("en", section, key, args);
    }


    if (this.config) {
      currentString = currentString.replace(/{botName}/g, this.config.bot.BOT_NAME);
      currentString = currentString.replace(/{supportLink}/g, this.config.bot.INVITE_LINK);
      if (this.clientId) {
        currentString = currentString.replace(/{clientId}/g, this.clientId);
      }
    }

    return currentString;
  }
}