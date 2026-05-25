import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    allowedHosts: true // 👈 මේක true කරපු ගමන් ඕනෑම ලින්ක් එකකින් සයිට් එක බ්ලොක් නොවී ලෝඩ් වෙනවා!
  }
})