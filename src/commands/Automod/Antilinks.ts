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
    public name = ["antilink"];
    public description = "Enable or disable anti-link system";
    public category = "Moderation";
    public accessableby = [Accessableby.Manager];
    public usage = "<enable> or <disable>";
    public aliases = ["antilink"];
    public lavalink = false;
    public playerCheck = false;
    public usingInteraction = true;
    public sameVoiceCheck = false;
    public permissions = [];
  
    options = [
      {
        name: "type",
        description: "Enable or disable the anti-link system",
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
        description: "Roles to exempt from the anti-link system",
        type: ApplicationCommandOptionType.Role,
        required: false,
      },
      {
        name: "exempt-channels",
        description: "Channels to exempt from the anti-link system",
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
        description: "Channel to log blocked links",
        type: ApplicationCommandOptionType.Channel,
        required: false,
      },
    ];
  
    public async execute(client: Manager, handler: CommandHandler) {
      await handler.deferReply();
  
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
              .setDescription("Please specify either **enable** or **disable**.")
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
                "❌ You can only have 6 keyword rules enabled at once. Please disable one of the existing keyword rules before enabling this one."
              )
              .setColor(client.color),
          ],
        });
      }
  
      const ruleName = "Disallow links [Wace]";
      const existingRule = existingRules.find((rule) => rule.name === ruleName);
  
      if (type === "enable") {
        if (existingRule && existingRule.enabled) {
          return handler.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription("❌ The anti-link system is already enabled.")
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
                "(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?",
              ],
            },
            actions: [
              {
                type: AutoModerationActionType.BlockMessage,
                metadata: {
                  customMessage:
                    "Message blocked due to containing a link. Rule added by Wace",
                },
              },
            ],
            reason: `Requested by ${handler.member.user.username}`,
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
                    .setDescription(`❌ I don't have permission to view <#${logChannel.id}> channel`)
                    .setColor(client.color),
                ],
              });
            }
  
            if (!logChannelPermissions.has(PermissionsBitField.Flags.SendMessages)) {
              return handler.editReply({
                embeds: [
                  new EmbedBuilder()
                    .setDescription(
                      `❌ I don't have permission to send messages in <#${logChannel.id}> channel`
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
                      `❌ You don't have permission to view <#${logChannel.id}> channel`
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
                      `❌ You don't have permission to send messages in <#${logChannel.id}> channel`
                    )
                    .setColor(client.color),
                ],
              });
            }
  
            ruleToCreate.actions.push({
              type: AutoModerationActionType.SendAlertMessage,
              metadata: {
                channelId: logChannel.id,
                customMessage:
                  "Message blocked due to containing a link. Rule added by Wace",
              },
            });
          }
  
          await handler.guild.autoModerationRules.create(ruleToCreate);
        }
  
        const embed = new EmbedBuilder()
          .setColor(client.color)
          .setTimestamp()
          .setTitle("✅ Successfully enabled the anti-link system")
          .setDescription(
            "The anti-link system has been enabled. All links will now be blocked."
          )
          .addFields([
            { name: "🔒 Rule name", value: "`Disallow links`", inline: true },
            { name: "📨 Rule event", value: "`Message send`", inline: true },
            {
              name: `📛 Rule action${timeout || logChannel ? "s" : ""}`,
              value: `\`Block message\`${timeout ? `, Timeout for \`${timeout}\` seconds` : ""}${logChannel ? `, Send alert message in <#${logChannel.id}>` : ""}`,
              inline: true,
            },
            {
              name: "⏱️ Rule timeout",
              value: timeout ? `\`${timeout} seconds\`` : "`None`",
              inline: true,
            },
            {
              name: "📝 Rule log channel",
              value: logChannel ? `<#${logChannel.id}>` : "`None`",
              inline: true,
            },
            { name: "🔑 Rule trigger", value: codeBlock("All links"), inline: false },
            {
              name: "🔗 Rule exempt channels",
              value: exemptChannels
                ? exemptChannels.type === ChannelType.GuildCategory
                  ? `\`${exemptChannels.name}\``
                  : `<#${exemptChannels.id}>`
                : "`None`",
              inline: true,
            },
            {
              name: "🔗 Rule exempt roles",
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
                .setDescription("❌ The anti-link system is already disabled.")
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
          .setTitle("✅ Successfully disabled the anti-link system")
          .setDescription(
            "The anti-link system has been disabled. All links will now be allowed."
          );
  
        return handler.editReply({ embeds: [embed] });
      }
    }
  }
  