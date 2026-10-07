import { create } from "zustand"
import { LOCAL_YUMU_UI_SETTING } from "@ipc/types"

type UiState = {
  customUiEnabled: boolean
  setCustomUiEnabled: (enabled: boolean) => void
}

export const useUiStore = create<UiState>()((set) => ({
  customUiEnabled: localStorage.getItem(LOCAL_YUMU_UI_SETTING) === "true",

  setCustomUiEnabled: (enabled) => {
    localStorage.setItem(LOCAL_YUMU_UI_SETTING, String(enabled))
    set({ customUiEnabled: enabled })
  }
}))
