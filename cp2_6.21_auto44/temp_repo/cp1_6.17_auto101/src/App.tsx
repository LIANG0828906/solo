import AlchemyCauldron from './AlchemyCauldron'
import MaterialPanel from './MaterialPanel'
import RecipePanel from './RecipePanel'

export default function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">⚱️</span>
            <h1 className="app-title">炼金术模拟器</h1>
            <span className="logo-icon">✨</span>
          </div>
          <p className="app-subtitle">
            探索古代炼金秘术 · 组合神秘材料 · 解锁魔法配方
          </p>
        </div>
      </header>

      <main className="app-main">
        <MaterialPanel />
        <section className="center-area">
          <AlchemyCauldron />
        </section>
        <RecipePanel />
      </main>

      <footer className="app-footer">
        <p>提示：尝试组合 红色水晶 💎 + 纯净水滴 💧 + 绿色草叶 🌿 开始你的第一次炼金</p>
      </footer>
    </div>
  )
}
