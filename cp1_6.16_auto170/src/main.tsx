// 导入 React 和 ReactDOM
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// 导入 App 组件
import App from './App'
// 导入全局样式
import './index.css'

// 使用 React.StrictMode 包裹 App 并渲染到 #root
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
