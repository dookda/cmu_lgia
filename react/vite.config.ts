import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// When running inside Docker the API container is reachable via its service name.
// Locally (npm run dev outside Docker) it falls back to localhost:8000.
export default defineConfig(({ mode }: { mode: string }) => {
  const env = loadEnv(mode, '.', 'VITE_')
  const API_HOST = env.VITE_API_HOST ?? 'http://localhost:8000'

  return {
    plugins: [react()],
    base: '/v3/',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: {
      host: '0.0.0.0', // needed so Vite listens on all interfaces inside Docker
      port: 5173,
      proxy: {
        '/api': API_HOST,
        '/auth': API_HOST,
      },
    },
  }
})
