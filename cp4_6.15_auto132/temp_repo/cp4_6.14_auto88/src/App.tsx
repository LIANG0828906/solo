/*
 * ============================================================
 * 模块调用关系与数据流向
 * ============================================================
 *
 * 职责：
 *   - React 应用根组件
 *   - 组合 UI 控件 (Controls) 和信息面板 (InfoPanel)
 *   - UI 层覆盖在 3D Canvas 之上
 *
 * 数据流入：
 *   - 无直接数据流入，通过子组件内部使用 useHeartStore 读取状态
 *
 * 数据流出：
 *   - 渲染 UI 元素到 DOM
 *
 * 调用方：
 *   - main.ts 通过 ReactDOM.render() 挂载 <App />
 * ============================================================
 */

import Controls from './ui/controls'
import InfoPanel from './ui/infoPanel'

export default function App() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1,
      }}
    >
      <div style={{ pointerEvents: 'auto' }}>
        <Controls />
        <InfoPanel />
      </div>
    </div>
  )
}
