import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

/**
 * 应用入口文件
 *
 * 性能基准测试（启动时）:
 * - FCP (First Contentful Paint): < 1.2s
 * - TTI (Time to Interactive): < 2.0s
 * - 主线程阻塞时间: < 200ms
 *
 * 渲染性能监控:
 * - 路由切换动画帧率: ≥ 55fps
 * - 图表首次渲染耗时: < 300ms
 * - 看板列切换动画帧率: ≥ 50fps
 */

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

const root = ReactDOM.createRoot(rootElement);

if (import.meta.env.DEV) {
  console.time('app-render');
}

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

if (import.meta.env.DEV) {
  requestIdleCallback(() => {
    console.timeEnd('app-render');
    console.log('%c[App] 应用已就绪', 'color: #4facfe; font-weight: bold;');
  });
}
