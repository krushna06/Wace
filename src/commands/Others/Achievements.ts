import { Command, Accessableby } from "../../structures/Command.js";
import { Manager } from "../../manager.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

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
        flags: CV2_FLAG,
        components: [cv2.simple("You haven't unlocked any achievements yet!", client.color)],
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

    return handler.sendMessage({
      flags: CV2_FLAG,
      components: [cv2.build({
        title: `Achievements - ${user.username}`,
        thumbnail: user.displayAvatarURL(),
        color: client.color,
        fields: [
          {
            name: "Progress",
            value: `**${unlockedCount}/${totalCount}** achievements unlocked\n**${achievements.totalPoints}** points earned`,
          },
          { name: "Unlocked", value: unlockedList || "None yet" },
          { name: "Locked (Next 5)", value: lockedList || "All unlocked!" },
        ],
      })],
    });
  }
}
