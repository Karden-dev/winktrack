import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Note: Avec Tailwind v4, c'est souvent ce plugin

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Assure-toi que c'est bien la config v4
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // L'adresse de ton Backend
        changeOrigin: true,
        secure: false,
      }
    }
  }
})