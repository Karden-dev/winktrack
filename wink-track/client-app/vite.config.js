import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  // ✅ CHANGE CECI : Utilise '/' (absolu) et non './' (relatif)
  // C'est ce qui permet aux sous-pages (/admin, /rider) de trouver le JS
  base: '/', 
  
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})