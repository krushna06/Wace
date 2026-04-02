import { Command, Accessableby } from "../../structures/Command.js";
import { Manager } from "../../manager.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { EmbedBuilder } from "discord.js";

export default class AchievementsCommand extends Command {
  constructor() {
    super();
    this.name = ["achievements"];
    this.description = "View your achievements and progress";
    this.category = "Others";
    this.accessableby = [Accessableby.Member];
    this.usingInteraction = true;
  }

  async execute(client: Manager, handler: CommandHandler): Promise<any> {
    const { guild, user } = handler;
    if (!guild || !user) return;

    const key = `${user.id}-${guild.id}`;
    const achievements = await client.db.achievement.get(key);

    if (!achievements) {
      return handler.sendMessage({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription("You haven't unlocked any achievements yet!"),
        ],
      });
    }

    const allAchievements = client.achievementManager.getAllAchievements();
    const unlockedCount = Object.keys(achievements.achievements).length;
    const totalCount = allAchievements.length;

    const unlockedList = allAchievements
      .filter((a) => achievements.achievements[a.id])
      .map((a) => {
        const unlocked = achievements.achievements[a.id];
        return `${a.icon} **${a.name}** - ${a.description}\n*Unlocked: ${new Date(unlocked.unlockedAt).toLocaleDateString()}*`;
      })
      .join("\n\n");

    const lockedList = allAchievements
      .filter((a) => !achievements.achievements[a.id])
      .map((a) => `${a.icon} **${a.name}** - ${a.description}`)
      .slice(0, 5)
      .join("\n\n");

    const embed = new EmbedBuilder()
      .setColor(client.color)
      .setTitle(`Achievements - ${user.username}`)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        {
          name: "Progress",
          value: `**${unlockedCount}/${totalCount}** achievements unlocked\n**${achievements.totalPoints}** points earned`,
          inline: false,
        },
        {
          name: "Unlocked",
          value: unlockedList || "None yet",
          inline: false,
        },
        {
          name: "Locked (Next 5)",
          value: lockedList || "All unlocked!",
          inline: false,
        }
      );

    return handler.sendMessage({ embeds: [embed] });
  }
}
