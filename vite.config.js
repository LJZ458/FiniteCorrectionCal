// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Replace 'your-username' and 'your-repo-name' accordingly
export default defineConfig({
  base: '/FiniteCorrectionCal/',
  plugins: [react()],
})
