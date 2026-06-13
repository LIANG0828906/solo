/**
 * 【文件职责】应用入口文件，使用 BrowserRouter 包裹根组件 App，挂载到 DOM #root 节点
 * 【被调用方】由 Vite 构建系统自动加载执行
 * 【数据流向】index.html script 标签 → main.tsx → createRoot 渲染 → BrowserRouter 包裹 App → 初始化 React 应用
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
