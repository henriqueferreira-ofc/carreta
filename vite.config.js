import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/carreta/',
  define: {
    __BUILD_VERSION__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    outDir: 'docs',
  },
  plugins: [react()],
})
