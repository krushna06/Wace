import {
  EmbedBuilder,
  ApplicationCommandOptionType,
  ChannelType,
  PermissionsBitField,
  codeBlock,
  Role,
  GuildBasedChannel,
  AutoModerationActionType,
  AutoModerationRuleEventType,
  AutoModerationRuleTriggerType,
  CommandInteractionOptionResolver,
} from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
export default class implements Command {
  public name = ["antiinvite"];
  public description = "Enable or disable anti-invite system";
  public category = "Automod";
  public accessableby = [Accessableby.Member, Accessableby.Manager];
  public usage = "<enable> or <disable>";
  public aliases = ["antiinvite"];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  options = [
    {
      name: "type",
      description: "Enable or disable the anti-invite system",
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
      description: "Roles to exempt from the anti-invite system",
      type: ApplicationCommandOptionType.Role,
      required: false,
    },
    {
      name: "exempt-channels",
      description: "Channels to exempt from the anti-invite system",
      type: ApplicationCommandOptionType.Channel,
      required: false,
    },
    {
      name: "timeout",
      description: "Timeout duration in seconds",
      type: ApplicationCommandOptionType.Integer,
      required: false,
    },
    {
      name: "log-channel",
      description: "Channel to log blocked invites",
      type: ApplicationCommandOptionType.Channel,
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
    const timeout = options.getInteger("timeout");
    const logChannel = options.getChannel("log-channel") as GuildBasedChannel | null;
    if (!type || !["enable", "disable"].includes(type)) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              client.i18n.get(handler.language, "automod.antiinvite", "specify_enable_disable")
            )
            .setColor(client.color),
        ],
      });
    }
    const existingRules = await handler.guild.autoModerationRules.fetch({ cache: false });
    const conflictingRules = existingRules.filter(
      (rule) => rule.triggerType === AutoModerationRuleTriggerType.Keyword
    );
    if (conflictingRules.size === 6 && type === "enable") {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              client.i18n.get(handler.language, "automod.antiinvite", "max_keyword_rules")
            )
            .setColor(client.color),
        ],
      });
    }
    const ruleName = client.i18n.get(handler.language, "automod.antiinvite", "rule_name");
    const existingRule = existingRules.find((rule) => rule.name === ruleName);
    if (type === "enable") {
      if (existingRule && existingRule.enabled) {
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                client.i18n.get(handler.language, "automod.antiinvite", "system_already_enabled")
              )
              .setColor(client.color),
          ],
        });
      }
      if (existingRule) {
        await handler.guild.autoModerationRules.edit(existingRule.id, {
          enabled: true,
        });
      } else {
        const ruleToCreate: any = {
          name: ruleName,
          creatorId: client.user!.id,
          enabled: true,
          eventType: AutoModerationRuleEventType.MessageSend,
          triggerType: AutoModerationRuleTriggerType.Keyword,
          exemptChannels: exemptChannels ? [exemptChannels.id] : [],
          exemptRoles: exemptRoles ? [exemptRoles.id] : [],
          triggerMetadata: {
            regexPatterns: [
              "(?:https?://)?(?:www.|ptb.|canary.)?(?:discord(?:app)?.(?:(?:com|gg)/(?:invite|servers)/[a-z0-9-_]+)|discord.gg/[a-z0-9-_]+)",
            ],
          },
          actions: [
            {
              type: AutoModerationActionType.BlockMessage,
              metadata: {
                customMessage: client.i18n.get(
                  handler.language,
                  "automod.antiinvite",
                  "block_message"
                ),
              },
            },
          ],
          reason: client.i18n.get(handler.language, "automod.antiinvite", "requested_by", {
            username: handler.member.user.username,
          }),
        };
        if (timeout) {
          ruleToCreate.actions.push({
            type: AutoModerationActionType.Timeout,
            metadata: {
              durationSeconds: timeout,
            },
          });
        }
        if (logChannel) {
          const logChannelPermissions = logChannel.permissionsFor(handler.guild.members.me!);
          if (!logChannelPermissions.has(PermissionsBitField.Flags.ViewChannel)) {
            return handler.editReply({
              embeds: [
                new EmbedBuilder()
                  .setDescription(
                    client.i18n.get(handler.language, "automod.antiinvite", "no_view_permission", {
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
                    client.i18n.get(handler.language, "automod.antiinvite", "no_send_permission", {
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
                      "automod.antiinvite",
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
                      "automod.antiinvite",
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
                "automod.antiinvite",
                "block_message"
              ),
            },
          });
        }
        await handler.guild.autoModerationRules.create(ruleToCreate);
      }
      const embed = new EmbedBuilder()
        .setColor(client.color)
        .setTimestamp()
        .setTitle(client.i18n.get(handler.language, "automod.antiinvite", "system_enabled"))
        .setDescription(
          client.i18n.get(handler.language, "automod.antiinvite", "system_enabled_description")
        )
        .addFields([
          {
            name: client.i18n.get(handler.language, "automod.antiinvite", "rule_name_label"),
            value: "`Disallow invites`",
            inline: true,
          },
          {
            name: client.i18n.get(handler.language, "automod.antiinvite", "rule_event"),
            value: "`Message send`",
            inline: true,
          },
          {
            name: client.i18n.get(handler.language, "automod.antiinvite", "rule_actions", {
              s: timeout || logChannel ? "s" : "",
            }),
            value: `\`Block message\`${timeout ? `, ${client.i18n.get(handler.language, "automod.antiinvite", "timeout_for", { timeout: timeout.toString() })}` : ""}${logChannel ? `, ${client.i18n.get(handler.language, "automod.antiinvite", "send_alert_message", { logChannel: `<#${logChannel.id}>` })}` : ""}`,
            inline: true,
          },
          {
            name: client.i18n.get(handler.language, "automod.antiinvite", "rule_timeout"),
            value: timeout ? `\`${timeout} seconds\`` : "`None`",
            inline: true,
          },
          {
            name: client.i18n.get(handler.language, "automod.antiinvite", "rule_log_channel"),
            value: logChannel ? `<#${logChannel.id}>` : "`None`",
            inline: true,
          },
          {
            name: client.i18n.get(handler.language, "automod.antiinvite", "rule_trigger"),
            value: codeBlock(
              client.i18n.get(handler.language, "automod.antiinvite", "discord_invite_links")
            ),
            inline: false,
          },
          {
            name: client.i18n.get(handler.language, "automod.antiinvite", "rule_exempt_channels"),
            value: exemptChannels
              ? exemptChannels.type === ChannelType.GuildCategory
                ? `\`${exemptChannels.name}\``
                : `<#${exemptChannels.id}>`
              : "`None`",
            inline: true,
          },
          {
            name: client.i18n.get(handler.language, "automod.antiinvite", "rule_exempt_roles"),
            value: exemptRoles ? `<@&${exemptRoles.id}>` : "`None`",
            inline: true,
          },
        ])
        .setThumbnail(handler.guild.iconURL({ size: 256 }));
      return handler.editReply({ embeds: [embed] });
    } else {
      if (!existingRule || !existingRule.enabled) {
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                client.i18n.get(handler.language, "automod.antiinvite", "system_already_disabled")
              )
              .setColor(client.color),
          ],
        });
      }
      await handler.guild.autoModerationRules.edit(existingRule.id, {
        enabled: false,
      });
      const embed = new EmbedBuilder()
        .setColor(client.color)
        .setTimestamp()
        .setTitle(client.i18n.get(handler.language, "automod.antiinvite", "system_disabled"))
        .setDescription(
          client.i18n.get(handler.language, "automod.antiinvite", "system_disabled_description")
        )
        .setThumbnail(handler.guild.iconURL({ size: 256 }));
      return handler.editReply({ embeds: [embed] });
    }
  }
}