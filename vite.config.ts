import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages project site: served from /focus-ghost/
export default defineConfig({
  plugins: [react()],
  base: '/focus-ghost/',
})
