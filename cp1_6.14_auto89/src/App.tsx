// ============================================================
// 应用根组件 - 路由配置与全局布局
// 数据流向：BrowserRouter URL → Routes 路由匹配 → 对应页面组件 → 子组件树渲染
// 调用关系：被 main.tsx 挂载，使用 src/pages/* 页面组件和 src/components/* 组件
// API 数据流方向：
//   GET    /api/clothes    → ClosetPage  useEffect 拉取 → Zustand store → 组件渲染
//   POST   /api/clothes    → ClosetPage  上传表单 → API层 → 后端 → lowdb
//   PUT    /api/clothes/:id → ClosetPage 编辑操作 → API层 → 后端 → lowdb
//   DELETE /api/clothes/:id → ClosetPage 删除操作 → API层 → 后端 → lowdb
//   GET    /api/outfits    → OutfitsPage useEffect 拉取 → Zustand store → 组件渲染
//   POST   /api/outfits    → OutfitsPage 创建搭配 → API层 → 后端风格生成 → lowdb
// ============================================================

import { Routes, Route, Navigate } from 'react-router-dom';
import ClosetPage from '@/pages/ClosetPage';
import OutfitsPage from '@/pages/OutfitsPage';
import Navbar from '@/components/Navbar';

/**
 * 应用根组件
 *
 * 布局结构：
 * ┌─────────────────────────────────────────────┐
 * │  Navbar (导航栏)                             │
 * │  桌面端：左侧 220px 固定侧栏                 │
 * │  移动端：顶部汉堡菜单                        │
 * ├─────────────────────────────────────────────┤
 * │                                             │
 * │           Routes (主内容区域)               │
 * │  /closet     → ClosetPage  我的衣橱         │
 * │  /outfits    → OutfitsPage 搭配广场         │
 * │  /           → 重定向 /closet               │
 * │                                             │
 * └─────────────────────────────────────────────┘
 *
 * 路由数据流说明：
 * 1. ClosetPage - 我的衣橱页面
 *    - 挂载时 useEffect → GET /api/clothes → 获取衣物列表 → store.clothes
 *    - 上传衣物   → POST /api/clothes (含图片) → 返回新衣物 → store.addCloth
 *    - 编辑衣物   → PUT /api/clothes/:id → 更新衣物 → store.updateCloth
 *    - 删除衣物   → DELETE /api/clothes/:id → 删除衣物 → store.removeCloth
 *    - 拖拽排序   → PATCH /api/clothes/reorder → 更新排序
 *
 * 2. OutfitsPage - 搭配广场页面
 *    - 挂载时 useEffect → GET /api/outfits → 获取搭配列表 → store.outfits
 *    - 创建搭配   → POST /api/outfits → 后端自动生成 styleTags → store.addOutfit
 *    - 删除搭配   → DELETE /api/outfits/:id → store.removeOutfit
 */
export default function App() {
  return (
    // 最外层容器 - 桌面端两栏布局，移动端单栏
    <div className="flex min-h-screen bg-cream animate-fade-in">
      {/* 导航栏 - 左侧固定侧栏（桌面端）/ 顶部菜单（移动端） */}
      <Navbar />

      {/* 主内容区域 */}
      <main className="flex-1 md:ml-[220px]">
        {/* 路由配置 */}
        <Routes>
          {/* 默认首页重定向到我的衣橱 */}
          <Route path="/" element={<Navigate to="/closet" replace />} />

          {/* 我的衣橱页面 - 展示衣物网格、上传新衣物、拖拽排序 */}
          <Route path="/closet" element={<ClosetPage />} />

          {/* 搭配广场页面 - 创建和浏览搭配组合 */}
          <Route path="/outfits" element={<OutfitsPage />} />

          {/* 404 未匹配路由 - 重定向到衣橱 */}
          <Route path="*" element={<Navigate to="/closet" replace />} />
        </Routes>
      </main>
    </div>
  );
}
