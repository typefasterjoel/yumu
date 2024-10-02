import { ipcMain } from "electron";
import { SONG_PAUSED, SONG_PLAYING, type SongInfo } from "./types";
import {
  pauseDiscordPresence,
  updateDiscordPresence,
} from "../helpers/discord";

export function youtubeListeners() {
  ipcMain.handle(SONG_PLAYING, async (_, song: SongInfo) => {
    await updateDiscordPresence(song, "playing");
  });

  ipcMain.handle(SONG_PAUSED, async (_, song: SongInfo) => {
    // pauseDiscordPresence();
    await updateDiscordPresence(song, "paused");
  });
}
