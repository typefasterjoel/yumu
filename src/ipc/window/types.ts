// Window
export const MIN_WINDOW = "window:minimize";
export const MAX_WINDOW = "window:maximize";
export const CLOSE_WINDOW = "window:close";

// Audio
export const SET_AUDIO_DEVICE = "audio:set-device";
export const GET_AUDIO_DEVICES = "audio:get-devices";

// Discord
export const TOGGLE_DISCORD_RP = "discord:toggle-rp";
export const UPDATE_SONG_INFO = "discord:update-song-info";

// YouTube
export const SONG_PLAYING = "youtube:playing";
export const SONG_PAUSED = "youtube:paused";

// Media
export const MEDIA_PLAY_PAUSE = "media:play-pause";
export const MEDIA_NEXT_TRACK = "media:next-track";
export const MEDIA_PREV_TRACK = "media:prev-track";

// Local Storage Key
export const LOCAL_AUDIO_DEVICE_KEY = "audioDeviceId";
export const LOCAL_DISCORD_RP_ENABLED_KEY = "discordRpEnabled";

// Interfaces
export type SongInfo = {
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  currentTime: number;
};
