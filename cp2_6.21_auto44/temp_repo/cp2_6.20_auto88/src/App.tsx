// ============================================================
// 应用主入口 App.tsx
// 职责: 布局编排 - 组合Navbar + CraftingPanel + EquipmentViewer + CraftingHistory
// 布局结构 (桌面端):
//   ┌──────────────────────────────────────────┐
//   │            Navbar (固定顶部)             │
//   ├────────────┬──────────────────┬──────────┤
//   │  材料列表   │  合成控制面板    │ 3D预览区 │
//   │            │                  │          │
//   │ (左)       │ (中-CraftingPanel)│ (右)     │
//   └────────────┴──────────────────┴──────────┘
//   右侧合成历史侧边栏作为浮层覆盖在3D预览区上
// ============================================================

import { Navbar } from './components/Navbar';
import { CraftingPanel } from './components/CraftingPanel';
import { EquipmentViewer } from './components/EquipmentViewer';
import { CraftingHistory } from './components/CraftingHistory';

export default function App() {
  return (
    <div className="app-root">
      <Navbar />

      <main className="app-main">
        {/* 左侧+中间: 材料列表 + 合成面板 */}
        <div className="app-left">
          <CraftingPanel />
        </div>

        {/* 右侧: 3D预览区 + 历史浮层 */}
        <div className="app-right">
          <EquipmentViewer />
          <CraftingHistory />
        </div>
      </main>

      {/* 页脚 */}
      <footer className="app-footer">
        <span>🛠️ 装备合成模拟器 v1.0</span>
        <span className="footer-dot">·</span>
        <span>拖拽材料到槽位 · 实时预览合成结果</span>
      </footer>
    </div>
  );
}
