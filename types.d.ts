interface YumuWindow {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  setAudioDevice: (
    deviceId: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

declare interface Window {
  yumuWindow: YumuWindow;
}
