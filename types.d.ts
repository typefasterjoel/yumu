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
}

declare interface Window {
  yumuWindow: YumuWindow;
}
