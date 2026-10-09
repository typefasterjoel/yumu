import { createMemoryHistory, createRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"

// Memory history: the app is loaded from file:// in production and has no address bar, so the
// URL is only an internal way to describe where the user is. It resets on every launch.
export const router = createRouter({
  routeTree,
  history: createMemoryHistory({ initialEntries: ["/"] })
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
