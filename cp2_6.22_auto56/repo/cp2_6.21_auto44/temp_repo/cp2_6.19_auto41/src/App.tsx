import CardEditor from './components/CardEditor';
import BattleSimulator from './components/BattleSimulator';

export default function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <h1 className="app-title">
          <span className="title-glyph">⚔</span>
          卡牌编辑器 · 对战模拟器
          <span className="title-glyph">⚔</span>
        </h1>
        <p className="app-subtitle">自定义属性 · 选择技能 · 实时模拟对战</p>
      </header>
      <main className="app-main">
        <section className="panel editor-panel">
          <div className="panel-header">
            <h2 className="panel-title">卡牌编辑区</h2>
            <span className="panel-badge">EDITOR</span>
          </div>
          <CardEditor />
        </section>
        <div className="divider-vertical" aria-hidden="true" />
        <section className="panel battle-panel">
          <div className="panel-header">
            <h2 className="panel-title">对战模拟区</h2>
            <span className="panel-badge">SIMULATOR</span>
          </div>
          <BattleSimulator />
        </section>
      </main>
      <footer className="app-footer">
        <span>Card Battle Editor · 纯前端实时模拟</span>
      </footer>
    </div>
  );
}
