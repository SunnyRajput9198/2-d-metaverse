import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path'; // ✅ Needed for `path.resolve`

export default defineConfig({
  plugins: [react(),tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // ✅ Correct way to alias `@` to `src`
       buffer: 'buffer',
      stream: 'stream-browserify',
    },
  },
    define: {
    global: 'window', // ✅ Add this line to fix "global is not defined"
  },
  optimizeDeps: {
    include: ['buffer','stream-browserify', 'process'],
  },
});
 