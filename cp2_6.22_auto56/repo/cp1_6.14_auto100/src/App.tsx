import { useEffect } from 'react';
import BattleField from './modules/ui/components/BattleField';
import ControlPanel from './modules/ui/components/ControlPanel';
import InfoPanel from './modules/ui/components/InfoPanel';
import TerrainContextMenu from './modules/ui/components/TerrainContextMenu';
import { useBattleStore } from './store/battleStore';

export default function App() {
  const initializeDemoUnits = useBattleStore((state) => state.initializeDemoUnits);

  useEffect(() => {
    initializeDemoUnits();
  }, [initializeDemoUnits]);

  return (
    <div className="app-container">
      <div className="app-header">
        <h1 className="app-title">
          <span className="title-icon">⚔️</span>
          战术RPG战斗原型系统
        </h1>
        <p className="app-subtitle">Tactical RPG Battle Prototype</p>
      </div>

      <div className="main-layout">
        <div className="left-panel">
          <ControlPanel />
        </div>

        <div className="center-panel">
          <BattleField />
        </div>

        <div className="right-panel">
          <InfoPanel />
        </div>
      </div>

      <TerrainContextMenu />

      <div className="app-footer">
        <span>左键点击选择/移动 · 右键修改地形 · 滚轮缩放</span>
      </div>
    </div>
  );
}
