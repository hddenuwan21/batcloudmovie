import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  // 🚀 Render එකේදී 'process' Object එක නැති වුණොත් Error එකක් එන එක වළක්වා ගැනීමට ආරක්ෂිත ක්‍රමයක් යෙදීම
  const disableHmr = typeof process !== 'undefined' && process.env.DISABLE_HMR === 'true';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // 💡 දැන් මේක ඕනෑම සර්වර් එකක Crash වෙන්නේ නැතුව ලස්සනට වැඩ කරනවා
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
