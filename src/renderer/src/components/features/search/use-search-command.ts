import { create } from "zustand"

type SearchCommandState = {
  open: boolean
  setOpen: (open: boolean) => void
}

export const useSearchCommand = create<SearchCommandState>()((set) => ({
  open: false,
  setOpen: (open) => set({ open })
}))
