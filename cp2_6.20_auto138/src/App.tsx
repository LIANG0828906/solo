import PlantScene from './PlantScene';
import PlantPanel from './PlantPanel';
import ControlPanel from './ControlPanel';

function App() {
  return (
    <div className="app-container">
      <div className="left-panel">
        <PlantPanel />
      </div>

      <div className="center-scene">
        <PlantScene />
        <div className="scene-hint">
          <span>拖拽旋转 · 滚轮缩放 · 双击重置</span>
        </div>
      </div>

      <div className="right-panel">
        <ControlPanel />
      </div>
    </div>
  );
}

export default App;
