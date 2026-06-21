import { useEffect, useState } from 'react';
import { Scene } from './Scene';
import { ExplosionPanel } from './ExplosionPanel';
import '@/styles/App.css';

/**
 * 应用根组件
 *
 * 职责：
 *   - 整体布局：左侧 3D 场景（flex:1）+ 右侧控制面板（300px）
 *   - 响应式断点检测（< 768px）：移动端时控制面板折叠为底部抽屉
 *   - 集成 Scene（3D 渲染）与 ExplosionPanel（UI 控制面板）
 *
 * 全局数据流向总览：
 *
 *   ┌─────────────────────┐     拖拽滑动条/点击按钮      ┌──────────────────────┐
 *   │  ExplosionPanel     │ ──────────────────────────→ │ useExplosionStore    │
 *   │  (UI 控制面板)      │                              │  (zustand store)     │
 *   └─────────────────────┘                              └──────────┬───────────┘
 *                                                                   │ 订阅
 *                                                                   ▼
 *   ┌─────────────────────┐     渲染部件网格           ┌──────────────────────┐
 *   │  Scene              │ ←────────────────────────── │  partOffsets         │
 *   │  (Canvas + 光照     │                              │  selectedParts       │
 *   │   + OrbitControls)  │                              │  autoRotate          │
 *   └──────────┬──────────┘                              └──────────┬───────────┘
 *              │ 遍历 BRONZE_DING_PARTS                            │ 点击部件
 *              ▼                                                    │
 *   ┌─────────────────────┐     子网格渲染                         │
 *   │  PartMesh × N       │ ←──────────────────────────────────────┘
 *   │  (拆解位置计算      │
 *   │   悬停高亮          │
 *   │   选中自转)         │───→ PartLabel (Sprite 标签，距离自适应)
 *   └─────────────────────┘
 *
 * 数据定义层：
 *   modelData.ts       → 5 个部件 + 子网格结构（鼎身、双耳、三足、纹饰层、铭文层）
 *   geometryFactory.ts → 每种几何体类型的 BufferGeometry 工厂函数
 *   easing.ts          → 缓动函数供 store 动画使用
 */

export function App() {
  const [isMobile, setIsMobile] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div className="app-container">
      <div className="scene-container">
        <Scene />
      </div>

      {!isMobile ? (
        <ExplosionPanel isOpen />
      ) : (
        <>
          <button
            className="panel-toggle-btn"
            onClick={() => setPanelOpen((v) => !v)}
          >
            {panelOpen ? '收起面板' : '展开面板'}
          </button>
          <ExplosionPanel isOpen={panelOpen} />
        </>
      )}
    </div>
  );
}
