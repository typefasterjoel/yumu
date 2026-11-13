import { create } from "zustand"

// Whether the search palette is open. It's a store so the sidebar can open it and the palette can
// close itself without passing props through the layout.
type SearchCommandState = {
  open: boolean
  setOpen: (open: boolean) => void
}

export const useSearchCommand = create<SearchCommandState>()((set) => ({
  open: false,
  setOpen: (open) => set({ open })
}))
