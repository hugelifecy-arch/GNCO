import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/GNCO/', // IMPORTANT for GitHub Pages: https://hugelifecy-arch.github.io/GNCO/
  plugins: [react()],
  server: { port: 5173, strictPort: true }
})
