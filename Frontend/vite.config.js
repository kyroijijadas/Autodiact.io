import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const { VITE_API_PROXY_TARGET = 'http://localhost:3000' } = loadEnv(mode, '.', '')
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': VITE_API_PROXY_TARGET,
      },
    },
  }
})
