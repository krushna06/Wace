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
    public category = "Moderation";
    public accessableby = [Accessableby.Manager];
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
              .setDescription("Please specify either **enable** or **disable**.")
              .setColor(client.color),
          ],
        });
      }
  
      if (type === "enable" && !profanity && !sexualContent && !slurs) {
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription("❌ You need to enable at least one filter!")
              .setColor(client.color),
          ],
        });
      }
  
      const existingRules = await handler.guild.autoModerationRules.fetch({ cache: false });
      const conflictingRule = existingRules.filter(
        (rule) => rule.triggerType === AutoModerationRuleTriggerType.KeywordPreset
      ).first();
  
      if (type === "enable") {
        if (conflictingRule && conflictingRule.enabled) {
          return handler.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription("❌ The anti-bad-words system is already enabled.")
                .setColor(client.color),
            ],
          });
        }
  
        if (conflictingRule) {
          await conflictingRule.delete("New anti-bad-words rule created");
        }
  
        const ruleToCreate: any = {
          name: "Anti bad words [Wace]",
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
                customMessage: "Message blocked due to containing a bad word. Rule added by Wace",
              },
            },
          ],
          reason: `Requested by ${handler.member.user.username}`,
        };
  
        if (profanity) ruleToCreate.triggerMetadata.presets.push(AutoModerationRuleKeywordPresetType.Profanity);
        if (sexualContent) ruleToCreate.triggerMetadata.presets.push(AutoModerationRuleKeywordPresetType.SexualContent);
        if (slurs) ruleToCreate.triggerMetadata.presets.push(AutoModerationRuleKeywordPresetType.Slurs);
  
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
                  .setDescription(`❌ I don't have permission to send messages in <#${logChannel.id}> channel`)
                  .setColor(client.color),
              ],
            });
          }
  
          const memberPermissions = logChannel.permissionsFor(handler.member);
          if (!memberPermissions.has(PermissionsBitField.Flags.ViewChannel)) {
            return handler.editReply({
              embeds: [
                new EmbedBuilder()
                  .setDescription(`❌ You don't have permission to view <#${logChannel.id}> channel`)
                  .setColor(client.color),
              ],
            });
          }
  
          if (!memberPermissions.has(PermissionsBitField.Flags.SendMessages)) {
            return handler.editReply({
              embeds: [
                new EmbedBuilder()
                  .setDescription(`❌ You don't have permission to send messages in <#${logChannel.id}> channel`)
                  .setColor(client.color),
              ],
            });
          }
  
          ruleToCreate.actions.push({
            type: AutoModerationActionType.SendAlertMessage,
            metadata: {
              channelId: logChannel.id,
              customMessage: "Message blocked due to containing a bad word. Rule added by Wace",
            },
          });
        }
  
        await handler.guild.autoModerationRules.create(ruleToCreate);
  
        const embed = new EmbedBuilder()
          .setColor(client.color)
          .setTimestamp()
          .setTitle("✅ Successfully enabled the anti-bad-words system")
          .setDescription(
            "The anti-bad-words system has been enabled. Common bad words will now be blocked."
          )
          .addFields([
            { name: "🔒 Rule name", value: "`Anti bad words`", inline: true },
            { name: "📨 Rule event", value: "`Message send`", inline: true },
            {
              name: `📛 Rule action${logChannel ? "s" : ""}`,
              value: `\`Block message\`${logChannel ? `, Send alert message in <#${logChannel.id}>` : ""}`,
              inline: true,
            },
            {
              name: "📝 Rule log channel",
              value: logChannel ? `<#${logChannel.id}>` : "`None`",
              inline: true,
            },
            { name: "🔑 Rule trigger", value: codeBlock("Common bad words"), inline: false },
            {
              name: "🔗 Rule exempt channels",
              value: exemptChannels
                ? exemptChannels.type === ChannelType.GuildCategory
                  ? `All channels in the category \`${exemptChannels.name}\``
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
        if (!conflictingRule || !conflictingRule.enabled) {
          return handler.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription("❌ The anti-bad-words system is already disabled.")
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
          .setTitle("✅ Successfully disabled the anti-bad-words system")
          .setDescription("The anti-bad-words system has been disabled. Common bad words will no longer be blocked.")
          .setFooter({
            text: `Requested by ${handler.member.user.username}`,
            iconURL: handler.member.user.displayAvatarURL({ size: 256 }),
          })
          .setThumbnail(handler.guild.iconURL({ size: 256 }));
  
        return handler.editReply({ embeds: [embed] });
      }
    }
  }
  