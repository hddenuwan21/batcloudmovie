import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

// 🚀 ESM පරිසරයක __dirname ආරක්ෂිතව නිපදවා ගැනීම (TypeScript Errors සම්පූර්ණයෙන්ම නැති කරයි)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  // Render එකේදී 'process' Object එක නැති වුණොත් Error එකක් එන එක වළක්වා ගැනීමට ආරක්ෂිත ක්‍රමයක් යෙදීම
  const disableHmr = typeof process !== 'undefined' && process.env.DISABLE_HMR === 'true';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        // 💡 දැන් මේක කිසිම TypeScript Error එකක් නැතුව ලස්සනට වැඩ කරනවා
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: !disableHmr,
      watch: disableHmr ? null : {},
    },
    // 🌐 Production Build එක dist ෆෝල්ඩරයට නිවැරදිව ලැබීමට සකස් කිරීම
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    }
  };
});
