import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Message,
  PermissionFlagsBits,
} from "discord.js";
import { Manager } from "../../manager.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";
import { stripIndents } from "common-tags";
import fs from "fs";
import {
  CheckPermissionResultInterface,
  CheckPermissionServices,
} from "../../services/CheckPermissionService.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Accessableby } from "../../structures/Command.js";
import { RatelimitReplyService } from "../../services/RatelimitReplyService.js";
import { RateLimitManager } from "@sapphire/ratelimits";
import { TopggServiceEnum } from "../../services/TopggService.js";
import { AutoReconnectBuilderService } from "../../services/AutoReconnectBuilderService.js";
import { incrementUserCommand, incrementGuildCommand } from "../../database/handler.js";
const commandRateLimitManager = new RateLimitManager(1000);

export default class {
  async execute(client: Manager, message: Message) {
    if (message.author.bot || message.channel.type == ChannelType.DM) return;

    if (!client.isDatabaseConnected)
      return client.logger.warn(
        "DatabaseService",
        "The database is not yet connected so this event will temporarily not execute. Please try again later!"
      );

    let guildModel = await client.db.language.get(`${message.guild!.id}`);
    if (!guildModel) {
      guildModel = await client.db.language.set(`${message.guild!.id}`, client.config.bot.LANGUAGE);
    }

    const language = guildModel;

    let PREFIX = client.prefix;

    const mention = new RegExp(`^<@!?${client.user!.id}>( |)$`);

    const GuildPrefix = await client.db.prefix.get(`${message.guild!.id}`);
    if (GuildPrefix) PREFIX = GuildPrefix;
    else if (!GuildPrefix)
      PREFIX = String(await client.db.prefix.set(`${message.guild!.id}`, client.prefix));

    if (message.content.match(mention)) {
      const mention_embed = cv2.build({
        author: `${client.i18n.get(language, "event.message", "wel", { bot: message.guild!.members.me!.displayName })}`,
        description: stripIndents`
          ${client.i18n.get(language, "event.message", "intro1", { bot: message.guild!.members.me!.displayName })}
          ${client.i18n.get(language, "event.message", "prefix", { prefix: `\`${PREFIX}\` or \`/\`` })}
          ${client.i18n.get(language, "event.message", "intro3")}
          `,
        color: client.color,
      });
      await message.reply({ flags: CV2_FLAG, components: [mention_embed] });
      return;
    }
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const prefixRegex = new RegExp(`^(<@!?${client.user!.id}>|${escapeRegex(PREFIX)})\\s*`);
    if (!prefixRegex.test(message.content)) return;
    const [matchedPrefix] = message.content.match(prefixRegex) as RegExpMatchArray;
    const args = message.content.slice(matchedPrefix.length).trim().split(/ +/g);
    const cmd = args.shift()!.toLowerCase();

    const command =
      client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd) as string);
    if (!command) return;

    const setup = await client.db.setup.get(String(message.guildId));

    if (setup && setup.channel == message.channelId) return;


    const ratelimit = commandRateLimitManager.acquire(
      `${message.author.id}@${command.name.join("-")}`
    );

    if (ratelimit.limited) {
      new RatelimitReplyService({
        client: client,
        language: language,
        message: message,
        time: Number(((ratelimit.expires - Date.now()) / 1000).toFixed(1)),
      }).reply();
      return;
    }

    ratelimit.consume();


    const permissionChecker = new CheckPermissionServices();


    const defaultPermissions = [
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.ReadMessageHistory,
    ];
    const allCommandPermissions = [PermissionFlagsBits.ManageMessages];
    const musicPermissions = [PermissionFlagsBits.Speak, PermissionFlagsBits.Connect];
    const managePermissions = [PermissionFlagsBits.ManageChannels];

    async function respondError(permissionResult: CheckPermissionResultInterface) {
      const selfErrorString = `${client.i18n.get(language, "error", "user_no_perms", { perm: permissionResult.result })}`;
      const container = cv2.simple(
        permissionResult.channel == "Self"
          ? selfErrorString
          : `${client.i18n.get(language, "error", "no_perms_channel", { perm: permissionResult.result, channel: permissionResult.channel })}`,
        client.color
      );
      const dmChannel = message.author.dmChannel == null ? await message.author.createDM() : message.author.dmChannel;
      dmChannel.send({ flags: CV2_FLAG, components: [container] }).catch(async () => {
        await message.reply({ flags: CV2_FLAG, components: [container] }).catch(() => null);
      });
    }

    const returnData = await permissionChecker.message(message, defaultPermissions);
    if (returnData.result !== "PermissionPass") return respondError(returnData);

    if (command.accessableby.includes(Accessableby.Manager)) {
      const returnData = await permissionChecker.message(message, managePermissions);
      if (returnData.result !== "PermissionPass") return respondError(returnData);
    } else if (command.category == "Music") {
      const returnData = await permissionChecker.message(message, musicPermissions);
      if (returnData.result !== "PermissionPass") return respondError(returnData);
    } else if (command.name.join("-") !== "help") {
      const returnData = await permissionChecker.message(message, allCommandPermissions);
      if (returnData.result !== "PermissionPass") return respondError(returnData);
    } else if (command.permissions.length !== 0) {
      const returnData = await permissionChecker.message(message, command.permissions);
      if (returnData.result !== "PermissionPass") return respondError(returnData);
    }


    if (command.lavalink && client.lavalinkUsing.length == 0) {
      return message.reply({ flags: CV2_FLAG, components: [cv2.simple(`${client.i18n.get(language, "error", "no_node")}`, client.color)] });
    }

    if (command.playerCheck) {
      const player = client.players.get(message.guild!.id);
      const twentyFourBuilder = new AutoReconnectBuilderService(client);
      const is247 = await twentyFourBuilder.get(message.guild!.id);
      if (!player || (is247 && is247.twentyfourseven && player.queue.length == 0 && !player.current))
        return message.reply({ flags: CV2_FLAG, components: [cv2.simple(`${client.i18n.get(language, "error", "no_player")}`, client.color)] });
    }

    if (command.sameVoiceCheck) {
      const { channel } = message.member!.voice;
      if (!channel || message.member!.voice.channel !== message.guild!.members.me!.voice.channel)
        return message.reply({ flags: CV2_FLAG, components: [cv2.simple(`${client.i18n.get(language, "error", "no_voice")}`, client.color)] });
    }

    if (command.accessableby.includes(Accessableby.Manager) && !message.member!.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply({ flags: CV2_FLAG, components: [cv2.simple(`${client.i18n.get(language, "error", "user_no_perms", { perm: "ManageGuild" })}`, client.color)] });


    const premiumUser = await client.db.premium.get(message.author.id);
    const premiumGuild = await client.db.preGuild.get(String(message.guild?.id));
    const isPremium = (premiumUser && premiumUser.isPremium) ?? false;
    const isPremiumGuild = (premiumGuild && premiumGuild.isPremium) ?? false;
    const isOwner = message.author.id === client.owner;
    const isAdmin = client.config.bot.ADMIN?.includes(message.author.id) ?? false;

    const commandOverride = await client.db.commandOverrides.get(command.name.join("-"));
    if (commandOverride !== null && commandOverride !== undefined) {
      if (commandOverride.isPremium && !command.accessableby.includes(Accessableby.Premium)) {
        command.accessableby = [...command.accessableby, Accessableby.Premium];
      } else if (!commandOverride.isPremium) {
        command.accessableby = command.accessableby.filter(
          (a) => a !== Accessableby.Premium && a !== Accessableby.GuildPremium
        );
      }
    }

    const isBothUserAndGuild =
      command.accessableby.includes(Accessableby.GuildPremium) &&
      command.accessableby.includes(Accessableby.Premium);
    let hasDJRole = false;
    let hasPremiumRole = false;

    if (command.accessableby.includes(Accessableby.DJ)) {
      if (setup && setup.djRole) {
        hasDJRole = message.member!.roles.cache.has(setup.djRole);
      } else {
        hasDJRole = message.member!.permissions.has(PermissionFlagsBits.ManageGuild);
      }
    }

    if (setup && setup.premiumRole) {
      hasPremiumRole = message.member!.roles.cache.has(setup.premiumRole);
    }

    const userPerm = {
      owner: isOwner,
      admin: isOwner || isAdmin,
      premium: isOwner || isAdmin || isPremium || hasPremiumRole,
      guildPre: isOwner || isAdmin || isPremium || isPremiumGuild || hasPremiumRole,
      dj: isOwner || isAdmin || hasDJRole,
    };

    if (command.accessableby.includes(Accessableby.Owner) && !userPerm.owner)
      return message.reply({ flags: CV2_FLAG, components: [cv2.simple(`${client.i18n.get(language, "error", "owner_only")}`, client.color)] });

    if (command.accessableby.includes(Accessableby.Admin) && !userPerm.admin)
      return message.reply({ flags: CV2_FLAG, components: [cv2.simple(`${client.i18n.get(language, "error", "user_no_perms", { perm: "wace@admin" })}`, client.color)] });

    if (!isBothUserAndGuild && command.accessableby.includes(Accessableby.Premium) && !userPerm.premium) {
      return message.reply({
        flags: CV2_FLAG,
        components: [cv2.build({
          author: `${client.i18n.get(language, "error", "no_premium_author")}`,
          description: `${client.i18n.get(language, "error", "no_premium_desc")}`,
          color: client.color,
          timestamp: true,
        })],
      });
    }

    if (command.accessableby.includes(Accessableby.GuildPremium) && !userPerm.guildPre) {
      return message.reply({
        flags: CV2_FLAG,
        components: [cv2.build({
          author: `${client.i18n.get(language, "error", "no_premium_author")}`,
          description: `${client.i18n.get(language, "error", "no_guild_premium_desc")}`,
          color: client.color,
          timestamp: true,
        })],
      });
    }

    const isNotPassAll = Object.entries(userPerm)
      .filter(([key]) => key !== 'dj')
      .some(([_, value]) => value === false);

    if (command.accessableby.includes(Accessableby.DJ) && !userPerm.dj) {
      return message.reply({
        flags: CV2_FLAG,
        components: [cv2.simple(hasDJRole ? `${client.i18n.get(language, "error", "dj_role_required")}` : `${client.i18n.get(language, "error", "user_no_perms", { perm: "DJ Role" })}`, client.color)],
      });
    }

    if (!isBothUserAndGuild && command.accessableby.includes(Accessableby.GuildPremium) && !userPerm.guildPre) {
      const voteChecker = await client.topgg.checkVote(message.author.id);
      if (voteChecker == TopggServiceEnum.ERROR) {
        return message.reply({
          flags: CV2_FLAG,
          components: [cv2.build({ author: client.i18n.get(language, "error", "topgg_error_author"), description: client.i18n.get(language, "error", "topgg_error_desc"), color: client.color, timestamp: true })],
        });
      }
      if (voteChecker == TopggServiceEnum.UNVOTED) {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setLabel(client.i18n.get(language, "error", "topgg_vote_button")).setStyle(ButtonStyle.Link).setURL(`https://top.gg/bot/${client.user?.id}/vote`)
        );
        return message.reply({
          flags: CV2_FLAG,
          components: [cv2.build({ author: client.i18n.get(language, "error", "topgg_vote_author"), description: client.i18n.get(language, "error", "topgg_vote_desc"), color: client.color, timestamp: true }), row],
        });
      }
    }


    try {
      const handler = new CommandHandler({
        message: message,
        language: language,
        client: client,
        args: args,
        prefix: PREFIX || client.prefix || "d!",
      });

      if (message.attachments.size !== 0) handler.addAttachment(message.attachments);

      client.logger.info(
        "CommandManager | Message",
        `[${command.name.join("-")}] used by ${message.author.username} from ${message.guild?.name} (${
          message.guild?.id
        })`
      );

      command.execute(client, handler);
      await incrementUserCommand(client.db, message.author.id, message.guild!.id);
      await incrementGuildCommand(client.db, message.guild!.id);
    } catch (error) {
      client.logger.error("CommandManager | Message", error);
      message.reply({
        flags: CV2_FLAG,
        components: [cv2.simple(`${client.i18n.get(language, "error", "unexpected_error")}\n ${error}`, client.color)],
      });
    }
  }
}