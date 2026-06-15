// ============================================================
// React 应用入口文件
// 数据流向：BrowserRouter → 全局状态 Provider → App 路由组件 → DOM 渲染
// 调用关系：被 index.html 中的 script 标签加载，挂载到 #root 节点
// ============================================================

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

/**
 * 应用根节点挂载
 *
 * 挂载结构：
 * 1. StrictMode - React 严格模式，用于检测潜在问题
 * 2. BrowserRouter - React Router 路由上下文 Provider
 *    数据流向：URL 变化 → Router 监听 → Routes 匹配 → 对应 Page 组件渲染
 * 3. App - 应用根组件，包含路由配置和页面布局
 *
 * 全局状态 Provider：
 * - Zustand store 通过 useStore hook 在各组件中直接调用，
 *   不需要额外的 Context Provider 包裹，因此此处无需显式挂载。
 *   数据流向：组件 dispatch action → Zustand store 更新 → 订阅组件重新渲染
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* BrowserRouter 提供路由上下文，使整个应用可以使用 useNavigate、useParams 等 hook */}
    <BrowserRouter>
      {/* App 组件包含路由配置和整体页面布局 */}
      <App />
    </BrowserRouter>
  </StrictMode>,
);
