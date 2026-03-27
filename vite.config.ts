import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@/cosmograph/style.module.css': fileURLToPath(
        new URL('./node_modules/@cosmograph/cosmograph/cosmograph/style.module.css.js', import.meta.url),
      ),
    },
  },
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'data/*',
          dest: 'data',
        },
      ],
    }),
  ],
})
