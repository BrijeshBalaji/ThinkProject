import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/lyzr': {
            target: 'https://agent-prod.studio.lyzr.ai',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/lyzr/, '/v3/inference/chat/'),
            headers: {
              'x-api-key': 'sk-default-dnznvkXvx9zrt9859ZTv4xOVBFiN4IGW'
            }
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        target: 'esnext'
      }
    };
});
