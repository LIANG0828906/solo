import { useCallback } from 'react';
import SceneView from '@/components/SceneView';
import ParameterPanel from '@/components/ParameterPanel';
import { useTerrainStore } from '@/store/useTerrainStore';
import { Leva } from 'leva';

export default function Home() {
  const setCameraPosition = useTerrainStore((s) => s.setCameraPosition);
  const setCameraTarget = useTerrainStore((s) => s.setCameraTarget);

  const handleCameraUpdate = useCallback(
    (position: [number, number, number], target: [number, number, number]) => {
      setCameraPosition(position);
      setCameraTarget(target);
    },
    [setCameraPosition, setCameraTarget]
  );

  return (
    <div className="app-root">
      <nav className="top-nav">
        <div className="nav-brand">
          <span className="nav-icon">🏔</span>
          <span className="nav-title">Terrain Explorer</span>
        </div>
        <div className="nav-subtitle">3D 地形生成与漫游</div>
      </nav>

      <div className="main-layout">
        <div className="scene-viewport">
          <SceneView onCameraUpdate={handleCameraUpdate} />
        </div>

        <div className="panel-sidebar">
          <div className="panel-header">
            <span className="panel-header-icon">⚙</span>
            <span className="panel-header-text">控制面板</span>
          </div>
          <Leva
            collapsed={false}
            titleBar={false}
            fill
            flat
            theme={{
              colors: {
                accent1: '#533483',
                accent2: '#0f3460',
                accent3: '#533483',
                highlight1: '#533483',
                highlight2: '#7b4bbd',
                highlight3: '#16213e',
              },
              sizes: {
                rootWidth: '100%',
                controlWidth: '64%',
              },
              fonts: {
                mono: "'JetBrains Mono', 'Fira Code', monospace",
              },
            }}
          />
          <ParameterPanel />
        </div>
      </div>
    </div>
  );
}
