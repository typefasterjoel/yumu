import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@ipc': resolve('src/ipc')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          preload: resolve(__dirname, 'src/preload/index.ts'),
          youtube: resolve(__dirname, 'src/preload/youtube.ts')
        }
      }
    },
    resolve: {
      alias: {
        '@ipc': resolve('src/ipc')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@ipc': resolve('src/ipc')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
