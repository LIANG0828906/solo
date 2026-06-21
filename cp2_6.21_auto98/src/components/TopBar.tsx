import { Mountain } from 'lucide-react'
import './TopBar.css'

export default function TopBar() {
  return (
    <div className="top-bar">
      <div className="top-bar-content">
        <div className="logo-section">
          <div className="logo-icon">
            <Mountain size={22} />
          </div>
          <div className="logo-text">
            <h1>地形侵蚀模拟器</h1>
            <span>3D地质演化可视化</span>
          </div>
        </div>
        
        <div className="top-bar-actions">
          <span className="hint-text">点击地形两点可测量剖面</span>
        </div>
      </div>
    </div>
  )
}
