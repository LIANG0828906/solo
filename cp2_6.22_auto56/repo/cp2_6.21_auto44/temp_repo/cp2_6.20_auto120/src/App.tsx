import { useSceneStore } from '@/store/sceneStore';
import Scene from '@/components/Scene';
import Panel from '@/components/Panel';
import '@/index.css';

function App() {
  const { params, isPlaying, progress, activePathId, paths } = useSceneStore();
  const activePath = paths.find((p) => p.id === activePathId);

  return (
    <div className="app-container">
      <div className="scene-wrapper">
        <Scene />
        {isPlaying && activePath && (
          <div className="hud-overlay">
            <div className="hud-item">
              <span className="hud-label">速度</span>
              <span className="hud-value">{activePath.speed.toFixed(2)} 单位/秒</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">进度</span>
              <span className="hud-value">{(progress * 100).toFixed(1)}%</span>
            </div>
            <div className="hud-progress">
              <div
                className="hud-progress-bar"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        )}
        <div className="scene-tip">
          {useSceneStore.getState().pendingStartPoint
            ? '点击细胞核附近添加终点'
            : '点击细胞膜上的位置添加起点'}
        </div>
      </div>
      <Panel
        params={params}
        isPlaying={isPlaying}
        progress={progress}
      />
    </div>
  );
}

export default App;
