import { resolve } from "path"
import { defineConfig } from "electron-vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  main: {
    build: {
      lib: {
        entry: resolve(__dirname, "src/main/index.ts")
      }
    },
    resolve: {
      alias: {
        "@ipc": resolve("src/ipc")
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          preload: resolve(__dirname, "src/preload/index.ts"),
          youtube: resolve(__dirname, "src/preload/youtube.ts")
        }
      }
    },
    resolve: {
      alias: {
        "@ipc": resolve("src/ipc")
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@ipc": resolve("src/ipc")
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
