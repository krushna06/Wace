import {
  PermissionsBitField,
  VoiceState,
  GuildMember,
  Role,
  TextChannel,
} from "discord.js";
import { Manager } from "../../manager.js";
import { AutoReconnectBuilderService } from "../../services/AutoReconnectBuilderService.js";
import { Player } from "../../structures/Player.js";
import { cv2, CV2_FLAG } from "../../utilities/ComponentsV2.js";

export default class {
  async execute(client: Manager, oldState: VoiceState, newState: VoiceState) {
    if (!client.isDatabaseConnected)
      return client.logger.warn(
        "DatabaseService",
        "The database is not yet connected so this event will temporarily not execute. Please try again later!"
      );

    const player = client.players.get(newState.guild.id);
    if (!player) return;

    const is247 = await client.db.autoreconnect.get(`${newState.guild.id}`);

    // Handle bot being moved to a different voice channel
    if (newState.member?.user.id === client.user?.id) {
      if (newState.channelId == null) {
        // Bot was disconnected
        player.data.set("sudo-destroy", true);
        if (player.shoukaku) {
          player.destroy();
        }
      } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        // Bot was moved to a different channel
        client.logger.info("VoiceStateUpdate", `Bot moved from ${oldState.channelId} to ${newState.channelId} in guild ${newState.guild.id}`);
        
        // Update player's voice channel ID
        player.voiceId = newState.channelId;
        
        // Reconnect the player to the new channel
        try {
          if (player.shoukaku) {
            // Disconnect from old channel and reconnect to new one
            await player.connect();
            
            // Resume playback if there's a current track
            if (player.current && !player.paused) {
              await player.play(player.current);
            }
            
            client.logger.info("VoiceStateUpdate", `Successfully reconnected player to new channel for guild ${newState.guild.id}`);
          }
        } catch (error) {
          client.logger.error("VoiceStateUpdate", `Failed to reconnect player after channel move: ${error}`);
        }
        return;
      }
    }

    if (oldState.member?.user.bot || newState.member?.user.bot) return;

    let data = await new AutoReconnectBuilderService(client).get(newState.guild.id);

    const setup = await client.db.setup.get(newState.guild.id);

    let guildModel = await client.db.language.get(`${newState.guild.id}`);
    if (!guildModel) {
      guildModel = await client.db.language.set(`${newState.guild.id}`, client.config.bot.LANGUAGE);
    }
    const language = guildModel;

    const isLavalinkDisconnected = player.data.get("lavalink-disconnected");
    if (data && data.twentyfourseven && isLavalinkDisconnected) {
      return;
    }

    if (data && data.twentyfourseven) return;

    const isInVoice = await newState.guild.members.fetch(client.user!.id).catch(() => undefined);

    if (!isInVoice || !isInVoice.voice.channelId) {
      player.data.set("sudo-destroy", true);

      if (player.shoukaku) {
        player.destroy();
      }
    }

    if (
      newState.channelId &&
      String(newState.channel!.type) == "GUILD_STAGE_VOICE" &&
      newState.guild.members.me!.voice.suppress &&
      (newState.guild.members.me!.permissions.has(PermissionsBitField.Flags.Connect) ||
        (newState.channel &&
          newState.channel
            .permissionsFor(newState.guild.members.me as GuildMember | Role)
            .has(PermissionsBitField.Flags.Speak)))
    )
      newState.guild.members.me!.voice.setSuppressed(false);

    if (oldState.id === client.user!.id) return;
    const isInOldVoice = await oldState.guild.members.fetch(client.user!.id).catch(() => undefined);
    if (!isInOldVoice || !isInOldVoice.voice.channelId) return;

    const vcRoom = oldState.guild.members.me!.voice.channel!.id;

    const leaveEmbed = (await client.channels
      .fetch(player.textId)
      .catch(() => undefined)) as TextChannel;

    if (
      newState.guild.members.me!.voice?.channel &&
      newState.guild.members.me!.voice.channel.members.filter((m) => !m.user.bot).size !== 0
    ) {
      if (oldState.channelId) return;
      if (oldState.channelId === newState.channelId) return;
      if (newState.guild.members.me!.voice.channel.members.filter((m) => !m.user.bot).size > 2)
        return;


      const leaveTimeout = client.leaveDelay.get(newState.guild.id);
      if (leaveTimeout) {
        clearTimeout(leaveTimeout);
        client.leaveDelay.delete(newState.guild.id);
      }

      const currentPause = player.paused;

      player.paused == false ? true : player.setPause(false);
      if (currentPause !== false && player.current !== null) {
        const msg = leaveEmbed
          ? await leaveEmbed.send({
              flags: CV2_FLAG,
              content: "",
              components: [cv2.simple(`${client.i18n.get(language, "event.player", "leave_resume")}`, client.color)],
            })
          : null;
        setTimeout(
          async () =>
            (!setup || setup == null || setup.channel !== player.textId) && msg
              ? msg.delete().catch(() => null)
              : true,
          client.config.utilities.DELETE_MSG_TIMEOUT
        );
      }
    }

    if (
      isInOldVoice &&
      isInOldVoice.voice.channelId === oldState.channelId &&
      oldState.guild.members.me!.voice?.channel &&
      oldState.guild.members.me!.voice.channel.members.filter((m) => !m.user.bot).size === 0
    ) {

      const currentPause = player.paused;
      player.paused == true ? true : player.setPause(true);

      if (currentPause !== true && player.current !== null && leaveEmbed) {
        const msg = await leaveEmbed.send({
          flags: CV2_FLAG,
          content: "",
          components: [cv2.simple(`${client.i18n.get(language, "event.player", "leave_pause")}`, client.color)],
        });
        setTimeout(async () => {
          const isChannelAvalible = await client.channels
            .fetch(msg.channelId)
            .catch(() => undefined);
          if (!isChannelAvalible) return;
          !setup || setup == null || setup.channel !== player.textId
            ? msg.delete().catch(() => null)
            : true;
        }, client.config.utilities.DELETE_MSG_TIMEOUT);
      }


      let leaveDelayTimeout = setTimeout(async () => {
        const vcMembers = oldState.guild.members.me!.voice.channel?.members.filter(
          (m) => !m.user.bot
        ).size;
        if (!vcMembers || vcMembers === 1) {
          const newPlayer = client.players.get(newState.guild.id);
          player.data.set("sudo-destroy", true);
          if (newPlayer) player.stop(is247 && is247.twentyfourseven ? false : true);
          try {
            if (leaveEmbed) {
              const msg = newPlayer && leaveEmbed
                ? await leaveEmbed.send({
                    flags: CV2_FLAG,
                    content: "",
                    components: [cv2.simple(`${client.i18n.get(language, "event.player", "player_end", { leave: vcRoom })}`, client.color)],
                  })
                : undefined;
              setTimeout(
                async () =>
                  msg && (!setup || setup == null || setup.channel !== player.textId)
                    ? msg.delete().catch(() => null)
                    : undefined,
                client.config.utilities.DELETE_MSG_TIMEOUT
              );
            }
          } catch (error) {
            client.logger.error("VoiceStateUpdateError", error);
          }
        }
        clearTimeout(leaveDelayTimeout);
        client.leaveDelay.delete(newState.guild.id);
      }, client.config.player.LEAVE_TIMEOUT);
      client.leaveDelay.set(newState.guild.id, leaveDelayTimeout);
    }
  }
}