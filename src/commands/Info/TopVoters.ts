import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  resolveColor,
} from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class implements Command {
  public name = ["topvoters"];
  public description = "Shows the top 10 voters on top.gg";
  public category = "Info";
  public accessableby = [Accessableby.Member];
  public usage = "/topvoters";
  public aliases = ["voters"];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const topggConfig = client.config.utilities.TOPGG;
    if (!topggConfig?.token && !client.config.utilities.TOPGG_TOKEN) {
      return handler.editReply({
        flags: CV2_FLAG,
        components: [this.container(client, "## Top Voters", "*top.gg integration is not configured.*")],
      });
    }

    const all = await client.db.voteStats.all();
    if (!all || all.length === 0) {
      return handler.editReply({
        flags: CV2_FLAG,
        components: [this.container(client, "## Top Voters", "*No votes recorded yet.*")],
      });
    }

    const sorted = all
      .sort((a, b) => b.value.totalVotes - a.value.totalVotes)
      .slice(0, 10);

    const lines = await Promise.all(
      sorted.map(async (entry, index) => {
        const { userId, totalVotes, lastVotedAt } = entry.value;
        let name = `\`${userId}\``;
        try {
          const user = await client.users.fetch(userId).catch(() => null);
          if (user) name = `**${user.username}**`;
        } catch {}
        const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `\`#${index + 1}\``;
        const lastVoted = `<t:${Math.floor(lastVotedAt / 1000)}:R>`;
        return `${medal} ${name} — **${totalVotes}** vote${totalVotes !== 1 ? "s" : ""} · last voted ${lastVoted}`;
      })
    );

    return handler.editReply({
      flags: CV2_FLAG,
      components: [this.container(client, `## Top Voters`, lines.join("\n"))],
    });
  }

  private container(client: Manager, title: string, body: string): ContainerBuilder {
    const c = new ContainerBuilder();
    try { c.setAccentColor(resolveColor(client.color as any)); } catch {}
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(title));
    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(body));
    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# Vote at [top.gg](https://top.gg/bot/${client.user?.id})`)
    );
    return c;
  }
}
