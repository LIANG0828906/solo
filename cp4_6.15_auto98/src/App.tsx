import { Canvas } from '@react-three/fiber';
import EarthScene from './components/EarthScene';
import ControlPanel from './components/ControlPanel';
import InfoPanel from './components/InfoPanel';
import './App.css';

export default function App() {
  return (
    <div className="app-container">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#0a0e1a' }}
      >
        <EarthScene />
      </Canvas>

      <ControlPanel />
      <InfoPanel />

      <div className="app-title">
        <h1>地球磁场可视化</h1>
        <p>GeoMagnetic Field Visualizer</p>
      </div>

      <div className="app-instructions">
        <p>拖拽旋转 · 滚轮缩放 · 点击查看磁场数据</p>
      </div>
    </div>
  );
}
