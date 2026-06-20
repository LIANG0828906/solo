import { useState, useEffect } from 'react';
import Scene3D from './components/Scene3D';
import TerrainBrush from './components/TerrainBrush';
import InfoPanel from './components/InfoPanel';
import PresetBar from './components/PresetBar';
import { useTerrainStore } from './store';

export default function App() {
  const [mode, setMode] = useState<'brush' | 'water'>('brush');
  const { setWaterStart, water, heightMap } = useTerrainStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'water') return;
  };

  return (
    <div className="app-container">
      <div className="canvas-container">
        <Scene3D mode={mode} />
      </div>

      <div className="mode-switcher">
        <button
          className={`mode-btn ${mode === 'brush' ? 'active' : ''}`}
          onClick={() => setMode('brush')}
        >
          ✏️ 地形编辑
        </button>
        <button
          className={`mode-btn ${mode === 'water' ? 'active' : ''}`}
          onClick={() => setMode('water')}
        >
          💧 水流模拟
        </button>
      </div>

      {!isMobile && (
        <>
          <TerrainBrush />
          <InfoPanel />
        </>
      )}

      <PresetBar />

      {mode === 'water' && (
        <div className="water-hint">
          {water.startPoint
            ? '水流起点已设置，粒子正沿路径流动'
            : '点击地形任意位置设置水流起点'}
        </div>
      )}

      {isMobile && (
        <div className="mobile-bar">
          <button className="mobile-tab">笔刷</button>
          <button className="mobile-tab">信息</button>
        </div>
      )}
    </div>
  );
}
