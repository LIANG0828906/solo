import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite 配置：React + TypeScript 构建配置
// 开发模式端口: 5173, 后端代理: /api -> http://localhost:8000
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
