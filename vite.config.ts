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
          '/arba': {
            target: 'https://dfe.test.arba.gov.ar/ARBANet.Retenciones/v1',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/arba/, ''),
          },
          '/auth': {
            target: 'https://login.test.arba.gov.ar/Auth/v1/Token',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/auth/, ''),
            onProxyReq(proxyReq, req, res) {
              console.log('--> PROXYING AUTH REQUEST:', req.method, req.url);
            },
            onProxyRes(proxyRes, req, res) {
              console.log('<-- PROXY AUTH RESPONSE:', proxyRes.statusCode, proxyRes.statusMessage);
            },
          },
        },
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
      }
    };
});
