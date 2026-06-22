import FanCanvas from './FanCanvas';
import PalettePanel from './PalettePanel';
import HistoryPanel from './HistoryPanel';
import './index.css';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">古风团扇配色设计</h1>
        <p className="app-subtitle">匠心独运 · 妙笔生花</p>
      </header>

      <main className="main-content">
        <div className="canvas-section">
          <FanCanvas />
          <HistoryPanel />
        </div>
        <div className="palette-section">
          <PalettePanel />
        </div>
      </main>

      <footer className="app-footer">
        <span>点击纹样可修改颜色 · 拖拽梅花和蝴蝶调整位置</span>
      </footer>
    </div>
  );
}

export default App;
