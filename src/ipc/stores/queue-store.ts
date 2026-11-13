import { create } from "zustand"
import type { QueueSnapshot } from "@ipc/youtube/bridge"

type QueueState = {
  queue: QueueSnapshot | null
  setQueue: (queue: QueueSnapshot) => void
}

export const useQueueStore = create<QueueState>()((set) => ({
  queue: null,
  setQueue: (queue) => set({ queue })
}))
