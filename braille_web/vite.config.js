import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
  },
  resolve: {
    alias: {
      '@pages' : path.resolve(__dirname, "./src/pages"),
      '@css' : path.resolve(__dirname, "./src"),
      '@firebase' : path.resolve(__dirname, "./src/firebase"),
      '@context' : path.resolve(__dirname, "./src/context"),
    }
  }
})
