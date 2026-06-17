import { Canvas } from '@react-three/fiber'
import SceneManager from './SceneManager'
import ControlPanel from './ControlPanel'
import DataSummary from './DataSummary'
import './styles.css'

export default function App() {
  return (
    <div className="app-container">
      <div className="canvas-wrapper">
        <Canvas
          camera={{ position: [100, 80, 100], fov: 60 }}
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 2]}
        >
          <color attach="background" args={['#0D1117']} />
          <SceneManager />
        </Canvas>
      </div>
      <DataSummary />
      <ControlPanel />
      <div className="app-title">
        <h1>城市地下管网3D模拟系统</h1>
        <p>Underground Pipe Network Simulation</p>
      </div>
      <div className="controls-hint">
        <span>左键旋转</span>
        <span>滚轮缩放</span>
        <span>右键平移</span>
      </div>
    </div>
  )
}
