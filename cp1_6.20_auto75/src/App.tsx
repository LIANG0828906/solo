import DragonEditor from './modules/editor/DragonEditor';
import BattleSimulator from './modules/battle/BattleSimulator';
import './App.css';

export default function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">
          <span className="title-icon">🐉</span>
          驯龙竞技场
          <span className="title-subtitle">阵容策略模拟器</span>
        </h1>
      </header>

      <main className="app-main">
        <aside className="editor-panel">
          <DragonEditor />
        </aside>

        <section className="battle-panel">
          <BattleSimulator />
        </section>
      </main>
    </div>
  );
}
