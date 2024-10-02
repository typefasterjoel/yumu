import { ipcMain } from "electron";
import { type SongInfo, TOGGLE_DISCORD_RP, UPDATE_SONG_INFO } from "./types";
import {
  updateDiscordPresence,
  clearDiscordPresence,
  initializeDiscordRP,
} from "../helpers/discord";

export function discordListeners() {
  ipcMain.handle(TOGGLE_DISCORD_RP, async (_, enabled: boolean) => {
    if (enabled) {
      await initializeDiscordRP();
    } else {
      clearDiscordPresence();
    }
  });

  ipcMain.handle(
    UPDATE_SONG_INFO,
    async (_, songInfo: SongInfo, playState: string) => {
      updateDiscordPresence(songInfo, playState);
    },
  );
}
