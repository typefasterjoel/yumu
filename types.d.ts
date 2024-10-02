interface YumuWindow {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  setAudioDevice: (
    deviceId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  getAudioDevices: () => Promise<{
    success: boolean;
    devices: MediaDeviceInfo[];
  }>;
  toggleDiscordRichPresence: (check: boolean) => Promise<{ success: boolean }>;
  updateSongInfo: (songInfo: SongInfo) => Promise<void>;
  youtubeMusicUpdate: (songInfo: SongInfo) => Promise<void>;
  youtubeMusicPause: (songInfo: SongInfo) => Promise<void>;
  onMediaPlayPause: (callback: () => void) => void;
  onMediaNextTrack: (callback: () => void) => void;
  onMediaPrevTrack: (callback: () => void) => void;
  onSongUpdate: (callback: (songInfo: SongInfo) => void) => void;
  offSongUpdate: (callback: (songInfo: SongInfo) => void) => void;
}

declare interface Window {
  yumuWindow: YumuWindow;
}
