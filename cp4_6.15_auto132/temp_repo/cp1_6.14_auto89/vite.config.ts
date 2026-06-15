// ============================================================
// Vite 构建配置
// 数据流向：浏览器请求 → Vite 开发服务器 → proxy → Express 后端服务器
// 调用关系：被 vite cli 加载，配置开发服务器和构建选项
// API 代理数据流：
//   /api/*     → http://localhost:3002/api/*   （Express 后端 API）
//   /uploads/* → http://localhost:3002/uploads/* （上传图片静态资源）
// ============================================================

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

// 代理日志配置
const proxyLogger = {
  configure: (proxy: any, _options: any) => {
    proxy.on('error', (err: any, _req: any, _res: any) => {
      console.log('proxy error', err);
    });
    proxy.on('proxyReq', (proxyReq: any, req: any, _res: any) => {
      console.log('Sending Request to the Target:', req.method, req.url);
    });
    proxy.on('proxyRes', (proxyRes: any, req: any, _res: any) => {
      console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
    });
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    }), 
    tsconfigPaths(),
  ],
  server: {
    proxy: {
      // API 请求代理到 Express 后端
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
        ...proxyLogger,
      },
      // 上传图片静态资源代理
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    }
  }
})
