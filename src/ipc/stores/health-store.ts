import { create } from "zustand"
import type { HealthReport } from "@ipc/youtube/bridge"

type HealthState = {
  report: HealthReport | null
  setReport: (report: HealthReport) => void
}

export const useHealthStore = create<HealthState>()((set) => ({
  report: null,
  setReport: (report) => set({ report })
}))
