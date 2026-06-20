import StarScene from './scene/StarScene'
import ControlPanel from './ui/ControlPanel'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <div className="scene-container">
        <StarScene />
      </div>
      <ControlPanel />
      <div className="app-title">
        <h1>3D星座星图浏览</h1>
        <p>拖拽旋转 · 滚轮缩放 · 探索星空</p>
      </div>
    </div>
  )
}

export default App
