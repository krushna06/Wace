import {
  EmbedBuilder,
  ApplicationCommandOptionType,
  ChannelType,
  PermissionsBitField,
  Role,
  GuildBasedChannel,
  AutoModerationActionType,
  AutoModerationRuleEventType,
  AutoModerationRuleKeywordPresetType,
  AutoModerationRuleTriggerType,
  CommandInteractionOptionResolver,
  codeBlock,
} from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";

export default class implements Command {
  public name = ["antibadwords"];
  public description = "Enable or disable anti-bad-words system";
  public category = "Automod";
  public accessableby = [Accessableby.Member, Accessableby.Manager];
  public usage = "<enable> or <disable>";
  public aliases = ["antibadwords"];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  options = [
    {
      name: "type",
      description: "Enable or disable the anti-bad-words system",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: "Enable",
          value: "enable",
        },
        {
          name: "Disable",
          value: "disable",
        },
      ],
    },
    {
      name: "exempt-roles",
      description: "Roles to exempt from the anti-bad-words system",
      type: ApplicationCommandOptionType.Role,
      required: false,
    },
    {
      name: "exempt-channels",
      description: "Channels to exempt from the anti-bad-words system",
      type: ApplicationCommandOptionType.Channel,
      required: false,
    },
    {
      name: "log-channel",
      description: "Channel to log blocked messages",
      type: ApplicationCommandOptionType.Channel,
      required: false,
    },
    {
      name: "profanity",
      description: "Filter profane words",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
    {
      name: "sexual-content",
      description: "Filter sexual content",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
    {
      name: "slurs",
      description: "Filter slurs",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    // @ts-ignore
    const options = handler.interaction.options as CommandInteractionOptionResolver;
    const type = options.getString("type");
    const exemptRoles = options.getRole("exempt-roles") as Role | null;
    const exemptChannels = options.getChannel("exempt-channels") as GuildBasedChannel | null;
    const logChannel = options.getChannel("log-channel") as GuildBasedChannel | null;
    const profanity = options.getBoolean("profanity") ?? true;
    const sexualContent = options.getBoolean("sexual-content") ?? true;
    const slurs = options.getBoolean("slurs") ?? true;

    if (!type || !["enable", "disable"].includes(type)) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              client.i18n.get(handler.language, "automod.antibadwords", "specify_enable_disable")
            )
            .setColor(client.color),
        ],
      });
    }

    if (type === "enable" && !profanity && !sexualContent && !slurs) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              client.i18n.get(
                handler.language,
                "automod.antibadwords",
                "enable_at_least_one_filter"
              )
            )
            .setColor(client.color),
        ],
      });
    }

    const existingRules = await handler.guild.autoModerationRules.fetch({ cache: false });
    const conflictingRule = existingRules
      .filter((rule) => rule.triggerType === AutoModerationRuleTriggerType.KeywordPreset)
      .first();

    if (type === "enable") {
      if (conflictingRule && conflictingRule.enabled) {
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                client.i18n.get(handler.language, "automod.antibadwords", "system_already_enabled")
              )
              .setColor(client.color),
          ],
        });
      }

      if (conflictingRule) {
        await conflictingRule.delete(
          client.i18n.get(handler.language, "automod.antibadwords", "new_rule_created")
        );
      }

      const ruleToCreate: any = {
        name: client.i18n.get(handler.language, "automod.antibadwords", "rule_name"),
        creatorId: client.user!.id,
        enabled: true,
        eventType: AutoModerationRuleEventType.MessageSend,
        triggerType: AutoModerationRuleTriggerType.KeywordPreset,
        exemptChannels: exemptChannels ? [exemptChannels.id] : [],
        exemptRoles: exemptRoles ? [exemptRoles.id] : [],
        triggerMetadata: {
          presets: [],
        },
        actions: [
          {
            type: AutoModerationActionType.BlockMessage,
            metadata: {
              customMessage: client.i18n.get(
                handler.language,
                "automod.antibadwords",
                "block_message"
              ),
            },
          },
        ],
        reason: client.i18n.get(handler.language, "automod.antibadwords", "requested_by", {
          username: handler.member.user.username,
        }),
      };

      if (profanity)
        ruleToCreate.triggerMetadata.presets.push(AutoModerationRuleKeywordPresetType.Profanity);
      if (sexualContent)
        ruleToCreate.triggerMetadata.presets.push(
          AutoModerationRuleKeywordPresetType.SexualContent
        );
      if (slurs)
        ruleToCreate.triggerMetadata.presets.push(AutoModerationRuleKeywordPresetType.Slurs);

      if (logChannel) {
        const logChannelPermissions = logChannel.permissionsFor(handler.guild.members.me!);
        if (!logChannelPermissions.has(PermissionsBitField.Flags.ViewChannel)) {
          return handler.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  client.i18n.get(handler.language, "automod.antibadwords", "no_view_permission", {
                    channelId: logChannel.id,
                  })
                )
                .setColor(client.color),
            ],
          });
        }

        if (!logChannelPermissions.has(PermissionsBitField.Flags.SendMessages)) {
          return handler.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  client.i18n.get(handler.language, "automod.antibadwords", "no_send_permission", {
                    channelId: logChannel.id,
                  })
                )
                .setColor(client.color),
            ],
          });
        }

        const memberPermissions = logChannel.permissionsFor(handler.member);
        if (!memberPermissions.has(PermissionsBitField.Flags.ViewChannel)) {
          return handler.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  client.i18n.get(
                    handler.language,
                    "automod.antibadwords",
                    "no_member_view_permission",
                    { channelId: logChannel.id }
                  )
                )
                .setColor(client.color),
            ],
          });
        }

        if (!memberPermissions.has(PermissionsBitField.Flags.SendMessages)) {
          return handler.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  client.i18n.get(
                    handler.language,
                    "automod.antibadwords",
                    "no_member_send_permission",
                    { channelId: logChannel.id }
                  )
                )
                .setColor(client.color),
            ],
          });
        }

        ruleToCreate.actions.push({
          type: AutoModerationActionType.SendAlertMessage,
          metadata: {
            channelId: logChannel.id,
            customMessage: client.i18n.get(
              handler.language,
              "automod.antibadwords",
              "block_message"
            ),
          },
        });
      }

      await handler.guild.autoModerationRules.create(ruleToCreate);

      const embed = new EmbedBuilder()
        .setColor(client.color)
        .setTimestamp()
        .setTitle(client.i18n.get(handler.language, "automod.antibadwords", "system_enabled"))
        .setDescription(
          client.i18n.get(handler.language, "automod.antibadwords", "system_enabled_description")
        )
        .addFields([
          {
            name: client.i18n.get(handler.language, "automod.antibadwords", "rule_name_label"),
            value: "`Anti bad words`",
            inline: true,
          },
          {
            name: client.i18n.get(handler.language, "automod.antibadwords", "rule_event"),
            value: "`Message send`",
            inline: true,
          },
          {
            name: client.i18n.get(handler.language, "automod.antibadwords", "rule_actions", {
              s: logChannel ? "s" : "",
            }),
            value: `\`Block message\`${logChannel ? `, Send alert message in <#${logChannel.id}>` : ""}`,
            inline: true,
          },
          {
            name: client.i18n.get(handler.language, "automod.antibadwords", "rule_log_channel"),
            value: logChannel ? `<#${logChannel.id}>` : "`None`",
            inline: true,
          },
          {
            name: client.i18n.get(handler.language, "automod.antibadwords", "rule_trigger"),
            value: codeBlock(
              client.i18n.get(handler.language, "automod.antibadwords", "common_bad_words")
            ),
            inline: false,
          },
          {
            name: client.i18n.get(handler.language, "automod.antibadwords", "rule_exempt_channels"),
            value: exemptChannels
              ? exemptChannels.type === ChannelType.GuildCategory
                ? client.i18n.get(
                    handler.language,
                    "automod.antibadwords",
                    "all_channels_in_category",
                    { category: exemptChannels.name }
                  )
                : `<#${exemptChannels.id}>`
              : "`None`",
            inline: true,
          },
          {
            name: client.i18n.get(handler.language, "automod.antibadwords", "rule_exempt_roles"),
            value: exemptRoles ? `<@&${exemptRoles.id}>` : "`None`",
            inline: true,
          },
        ])
        .setThumbnail(handler.guild.iconURL({ size: 256 }));

      return handler.editReply({ embeds: [embed] });
    } else {
      if (!conflictingRule || !conflictingRule.enabled) {
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                client.i18n.get(handler.language, "automod.antibadwords", "system_already_disabled")
              )
              .setColor(client.color),
          ],
        });
      }

      await handler.guild.autoModerationRules.edit(conflictingRule.id, {
        enabled: false,
      });

      const embed = new EmbedBuilder()
        .setColor(client.color)
        .setTimestamp()
        .setTitle(client.i18n.get(handler.language, "automod.antibadwords", "system_disabled"))
        .setDescription(
          client.i18n.get(handler.language, "automod.antibadwords", "system_disabled")
        )
        .setFooter({
          text: client.i18n.get(handler.language, "automod.antibadwords", "requested_by", {
            username: handler.member.user.username,
          }),
          iconURL: handler.member.user.displayAvatarURL({ size: 256 }),
        })
        .setThumbnail(handler.guild.iconURL({ size: 256 }));

      return handler.editReply({ embeds: [embed] });
    }
  }
}
