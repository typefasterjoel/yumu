import { SongInfo } from "@/ipc/window/types";
import { Client } from "@xhayper/discord-rpc";

const clientID = "1286520235893198899";
let discordClient: Client | null = null;
let initialized = false;

export async function initializeDiscordRP() {
  if (initialized) return;

  try {
    discordClient = new Client({ clientId: clientID });
    discordClient.on("ready", () => {
      initialized = true;
    });
    await discordClient.login();
    console.log("Discord Client initialized");
  } catch (error) {
    console.error("Failed to initialize Discord RPC:", error);
  }
}

export async function updateDiscordPresence(
  songInfo: SongInfo,
  playState: string,
) {
  if (!initialized) {
    console.warn("Discord Client not initialized");
    return;
  }
  try {
    console.log("Updating Discord presence");

    const activity = {
      type: 2,
      details: songInfo.title,
      state: `by ${songInfo.artist}`,
      startTimestamp: Date.now() - songInfo.currentTime * 1000,
      endTimestamp:
        Date.now() + (songInfo.duration - songInfo.currentTime) * 1000,
      largeImageKey: songInfo.albumArt,
      largeImageText: songInfo.album,
      instance: false,
    };

    if (playState === "paused") {
      activity.startTimestamp = undefined;
      activity.endTimestamp = undefined;
    }

    await discordClient.user?.setActivity(activity);
    console.log("Discord presence updated");
  } catch (error) {
    console.error("Failed to update Discord presence:", error);
  }
}

export async function pauseDiscordPresence() {
  if (!initialized) {
    console.warn("Discord Client not initialized");
    return;
  }

  await discordClient.user?.clearActivity();
  console.log("Discord presence paused");
}

export async function clearDiscordPresence() {
  if (!initialized) {
    console.warn("Discord Client not initialized");
    return;
  }

  await discordClient.user?.clearActivity();
  await discordClient.destroy();
  initialized = false;
}
