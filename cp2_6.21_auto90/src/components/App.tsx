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
 * ============================================================
 * 详细数据流向图
 * ============================================================
 *
 * 【数据定义层】（纯静态，无副作用）
 *
 *   modelData.ts
 *     └── BRONZE_DING_PARTS: PartData[]
 *         ├── 5 个部件定义：鼎身 / 双耳 / 三足 / 纹饰层 / 铭文层
 *         └── 每个部件含 subMeshes[]（双耳2个，三足3个）
 *             └── 子网格：geometryType + position + rotation
 *
 *   geometryFactory.ts
 *     └── createGeometry(type: GeometryType) → THREE.BufferGeometry
 *         └── 为每个子网格生成独立的 BufferGeometry 实例
 *
 *   easing.ts
 *     ├── EasingFunction 类型
 *     ├── createEaseOutExpo(exponent) → 可配置指数衰减缓动
 *     └── easeOutExpo（默认指数衰减，用于拆解动画）
 *
 * ============================================================
 * 【状态层】（Zustand Store）
 *
 *   useExplosionStore (explosionStore.ts)
 *     │
 *     ├── State: {
 *     │     partOffsets: Record<string, number>,   // 每个部件当前偏移量
 *     │     selectedParts: string[],              // 已选中的部件 ID
 *     │     selectedCount: number,                // 选中数量（最多 2）
 *     │     autoRotate: boolean,                  // 场景是否自动旋转
 *     │     isAnimating: boolean,                 // 拆解/复原动画是否进行中
 *     │   }
 *     │
 *     ├── Actions (供 UI / 3D 层调用):
 *     │     ├── setPartOffset(partId, value)      // 滑动条更新偏移
 *     │     ├── togglePartSelection(partId)       // 点击部件选中/取消
 *     │     ├── toggleAutoRotate()                // 自动旋转开关
 *     │     ├── explodeAll()                       // 一键分解（2s easeOutExpo）
 *     │     └── resetAll()                         // 一键复原（1.5s easeOutExpo）
 *     │
 *     └── 内部逻辑：
 *           togglePartSelection 中通过 selectedParts.length 判断：
 *           - 已存在 → filter 移除
 *           - 不存在但已满（≥2）→ return state 忽略
 *           - 不存在且未满 → push 添加
 *           同时同步更新 selectedCount = next.length
 *
 * ============================================================
 * 【UI 层 → Store 写入】
 *
 *   ExplosionPanel.tsx
 *     │
 *     ├── 读取 store（订阅）:
 *     │     ├── partOffsets → 渲染滑动条当前值
 *     │     ├── autoRotate  → 开关状态
 *     │     ├── isAnimating → 按钮禁用态
 *     │     └── selectedCount → 可显示选中数量提示（可选）
 *     │
 *     └── 调用 Actions:
 *           ├── 滑动条 onChange → setPartOffset(partId, parseFloat(e.target.value))
 *           ├── 开关 onClick → toggleAutoRotate()
 *           ├── 「一键分解」 onClick → explodeAll()
 *           └── 「一键复原」 onClick → resetAll()
 *
 * ============================================================
 * 【3D 层 → Store 订阅】
 *
 *   Scene.tsx
 *     │
 *     ├── 读取 store（订阅变化，触发重渲染）:
 *     │     ├── partOffsets → 传递给每个 PartMesh 的 offset prop
 *     │     ├── selectedParts → 传递 isSelected={includes(part.id)}
 *     │     └── autoRotate → 传递给 OrbitControls.autoRotate
 *     │
 *     └── 遍历 BRONZE_DING_PARTS → 渲染 N 个 PartMesh
 *           └── 每个 PartMesh 接收 part / offset / isSelected
 *
 *   PartMesh.tsx
 *     │
 *     ├── 调用 Actions:
 *     │     └── 子网格 onClick → togglePartSelection(part.id)
 *     │
 *     ├── 子网格拆分逻辑（关键修复）:
 *     │     ├── 遍历 part.subMeshes → 为每个子网格创建独立 SubMesh 组件
 *     │     ├── 每个子网格拥有独立 geometry + position + rotation
 *     │     ├── 所有子网格共享：同一 material、同一 hovered 状态、同一拆解偏移
 *     │     └── 悬停任一子网格 → 所有子网格显示 Edges 高亮（表示整个部件）
 *     │
 *     ├── 选中自转逻辑：
 *     │     └── isSelected 为 true 时，useFrame 更新外层 group.rotation.y
 *     │
 *     └── 传递给 PartLabel:
 *           └── worldPosition（部件中心的世界坐标）
 *
 *   PartLabel.tsx
 *     └── useFrame 中实时计算 camera.position 与 worldPosition 的距离
 *         → scale = clamp(distance * factor, 0.9, 1.4)
 *         → 更新 sprite.scale
 *
 * ============================================================
 * 【完整数据流示例】
 *
 *   用户拖拽「双耳」滑动条 → value = 1.5
 *     ↓ ExplosionPanel.onChange
 *   setPartOffset('ears', 1.5)
 *     ↓ Zustand 更新
 *   store.partOffsets.ears = 1.5
 *     ↓ Scene 订阅到变化
 *   PartMesh(part='ears', offset=1.5) 重渲染
 *     ↓ 计算拆解位置
 *   左耳 mesh.position = default + explodeAxis * 1.5
 *   右耳 mesh.position = default + explodeAxis * 1.5
 *     ↓ R3F 渲染更新
 *   Canvas 重绘 → 双耳向上移动 1.5 单位
 *
 * ============================================================
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
