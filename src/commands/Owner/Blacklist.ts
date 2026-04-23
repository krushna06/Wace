import { ApplicationCommandOptionType } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["blacklist"];
  public description = "Blacklist or unblacklist a user/guild by ID";
  public category = "Owner";
  public accessableby = [Accessableby.Owner];
  public usage = "<add|remove> <user|guild> <id> [reason]";
  public aliases = ["bl"];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];

  public options = [
    {
      name: "action",
      description: "Add or remove from blacklist",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Add", value: "add" },
        { name: "Remove", value: "remove" },
        { name: "List", value: "list" },
      ],
    },
    {
      name: "type",
      description: "Whether this is a user or guild ID",
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: [
        { name: "User", value: "user" },
        { name: "Guild", value: "guild" },
      ],
    },
    {
      name: "id",
      description: "The user or guild ID to blacklist",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: "reason",
      description: "Reason for blacklisting",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const [action, type, id, ...reasonParts] = handler.args;
    const reason = reasonParts.join(" ") || "No reason provided";

    if (action === "list") {
      const all = await client.db.blacklist.all();
      if (!all || all.length === 0) {
        return handler.editReply({
          flags: CV2_FLAG,
          components: [cv2.simple("Blacklist is empty.", client.color)],
        });
      }
      const lines = all
        .map((entry) => `\`${entry.value.id}\` — **${entry.value.type}** — ${entry.value.reason ?? "No reason"}`)
        .join("\n");
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.build({ description: `**Blacklisted entries:**\n${lines}`, color: client.color })],
      });
    }

    if (!type || !id) {
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple("`⚠️` | Please provide a type (user/guild) and an ID.", client.color)],
      });
    }

    if (type !== "user" && type !== "guild") {
      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple("`⚠️` | Type must be `user` or `guild`.", client.color)],
      });
    }

    if (action === "add") {
      const existing = await client.db.blacklist.get(id);
      if (existing) {
        return handler.editReply({
          flags: CV2_FLAG,
          components: [cv2.simple(`\`⚠️\` | \`${id}\` is already blacklisted.`, client.color)],
        });
      }

      await client.db.blacklist.set(id, {
        id,
        type: type as "user" | "guild",
        reason,
        blacklistedAt: Date.now(),
        blacklistedBy: handler.user!.id,
      });

      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`\`✅\` | **${type}** \`${id}\` has been blacklisted.\n**Reason:** ${reason}`, client.color)],
      });
    }

    if (action === "remove") {
      const existing = await client.db.blacklist.get(id);
      if (!existing) {
        return handler.editReply({
          flags: CV2_FLAG,
          components: [cv2.simple(`\`⚠️\` | \`${id}\` is not in the blacklist.`, client.color)],
        });
      }

      await client.db.blacklist.delete(id);

      return handler.editReply({
        flags: CV2_FLAG,
        components: [cv2.simple(`\`✅\` | \`${id}\` has been removed from the blacklist.`, client.color)],
      });
    }

    return handler.editReply({
      flags: CV2_FLAG,
      components: [cv2.simple("`⚠️` | Invalid action. Use `add`, `remove`, or `list`.", client.color)],
    });
  }
}
