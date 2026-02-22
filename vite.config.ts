import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
    },
    server: {
      port: 3000,
      strictPort: true,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${env.AMS_SERVER_PORT || '8787'}`,
          changeOrigin: true,
        },
      },
    }
  };
});
