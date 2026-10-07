import "./global.css"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      // Refetching because the window regained focus would just re-hit YouTube Music.
      refetchOnWindowFocus: false
    }
  }
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)
