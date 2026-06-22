import Battlefield from './ui/Battlefield';
import ControlPanel from './ui/ControlPanel';
import { useGameStore } from './store/gameStore';

function App() {
  const { phase } = useGameStore();

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          <span className="title-icon">⚔️</span>
          六边形战术
        </h1>
        <p className="app-subtitle">回合制策略战斗模拟器</p>
      </header>

      <main className="main-content">
        <div className="battlefield-wrapper">
          <Battlefield />
        </div>
        <div className="control-panel-wrapper">
          <ControlPanel />
        </div>
      </main>

      <footer className="app-footer">
        <p>💡 提示：点击单位选中，绿色格子可移动，红色闪烁的敌人可攻击</p>
      </footer>

      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
          background: #0D1117;
          color: #C9D1D9;
          min-height: 100vh;
        }
        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .app-header {
          text-align: center;
          margin-bottom: 20px;
        }
        .app-title {
          font-size: 28px;
          font-weight: 700;
          color: #58A6FF;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .title-icon {
          font-size: 24px;
        }
        .app-subtitle {
          font-size: 14px;
          color: #8B949E;
        }
        .main-content {
          display: flex;
          gap: 20px;
          flex: 1;
          justify-content: center;
          align-items: flex-start;
        }
        .battlefield-wrapper {
          flex-shrink: 0;
        }
        .control-panel-wrapper {
          flex-shrink: 0;
        }
        .app-footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #21262D;
        }
        .app-footer p {
          font-size: 13px;
          color: #6E7681;
        }
        @media (max-width: 1024px) {
          .main-content {
            flex-direction: column;
            align-items: center;
          }
          .battlefield-wrapper,
          .control-panel-wrapper {
            width: 100%;
            max-width: 600px;
          }
          .control-panel-wrapper {
            display: flex;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
