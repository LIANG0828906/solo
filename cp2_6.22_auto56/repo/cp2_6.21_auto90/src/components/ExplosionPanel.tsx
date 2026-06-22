import { BRONZE_DING_PARTS, EXPLODE_OFFSET_MIN, EXPLODE_OFFSET_MAX } from '@/utils/modelData';
import { useExplosionStore } from '@/store/explosionStore';
import '@/styles/ExplosionPanel.css';

/**
 * 拆解控制面板组件
 *
 * 职责：
 *   - 渲染标题「青铜鼎拆解工具」与自动旋转开关
 *   - 遍历 BRONZE_DING_PARTS 渲染每个部件的滑动条（带颜色指示条和偏移值显示）
 *   - 渲染「一键分解」「一键复原」两个渐变按钮
 *   - 响应式：桌面端右侧300px，移动端折叠为底部抽屉
 *
 * 数据流向：
 *   读取：
 *     useExplosionStore { partOffsets, autoRotate, isAnimating }
 *       → 渲染滑动条值、开关状态、按钮禁用态
 *   写入：
 *     slider onChange → setPartOffset(partId, value) → store 更新
 *     switch onClick → toggleAutoRotate() → store.autoRotate 取反
 *     一键分解 onClick → explodeAll() → store 启动 2 秒动画
 *     一键复原 onClick → resetAll() → store 启动 1.5 秒动画
 *
 * 调用方：App 组件根据响应式断点渲染本组件
 */

interface ExplosionPanelProps {
  isOpen?: boolean;
}

export function ExplosionPanel({ isOpen = true }: ExplosionPanelProps) {
  const partOffsets = useExplosionStore((s) => s.partOffsets);
  const autoRotate = useExplosionStore((s) => s.autoRotate);
  const isAnimating = useExplosionStore((s) => s.isAnimating);
  const setPartOffset = useExplosionStore((s) => s.setPartOffset);
  const toggleAutoRotate = useExplosionStore((s) => s.toggleAutoRotate);
  const explodeAll = useExplosionStore((s) => s.explodeAll);
  const resetAll = useExplosionStore((s) => s.resetAll);

  return (
    <aside className={`explosion-panel ${isOpen ? 'open' : ''}`}>
      <div className="panel-header">
        <h2 className="panel-title">青铜鼎拆解工具</h2>
        <button
          className={`auto-rotate-switch ${autoRotate ? 'active' : ''}`}
          onClick={toggleAutoRotate}
          aria-label="自动旋转开关"
          title={autoRotate ? '关闭自动旋转' : '开启自动旋转'}
        />
      </div>

      <div className="parts-list">
        {BRONZE_DING_PARTS.map((part) => (
          <div key={part.id} className="part-item">
            <div className="part-header">
              <span
                className="part-color-indicator"
                style={{ backgroundColor: part.color }}
              />
              <span className="part-name">{part.name}</span>
            </div>
            <div className="part-slider-container">
              <input
                type="range"
                className="part-slider"
                min={EXPLODE_OFFSET_MIN}
                max={EXPLODE_OFFSET_MAX}
                step={0.1}
                value={partOffsets[part.id] ?? 0}
                onChange={(e) => setPartOffset(part.id, parseFloat(e.target.value))}
                style={{ ['--part-color' as any]: part.color }}
                disabled={isAnimating}
              />
            </div>
            <div className="part-offset-value">
              {(partOffsets[part.id] ?? 0).toFixed(1)}
            </div>
          </div>
        ))}
      </div>

      <div className="panel-actions">
        <button
          className="action-btn"
          onClick={explodeAll}
          disabled={isAnimating}
        >
          一键分解
        </button>
        <button
          className="action-btn"
          onClick={resetAll}
          disabled={isAnimating}
        >
          一键复原
        </button>
      </div>
    </aside>
  );
}
