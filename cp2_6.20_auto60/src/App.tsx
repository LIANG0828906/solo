import React, { useState } from 'react'
import { GemCollection } from './modules/gem/GemCollection'
import { ForgeWorkshop } from './modules/gem/ForgeWorkshop'
import { BattleArena } from './modules/battle/BattleArena'
import './App.css'

type TabType = 'collection' | 'forge' | 'battle'

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('collection')

  const tabs: Array<{ key: TabType; label: string; icon: string }> = [
    { key: 'collection', label: '符石图鉴', icon: '💎' },
    { key: 'forge', label: '合成台', icon: '🔥' },
    { key: 'battle', label: '战斗模拟', icon: '⚔️' },
  ]

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">
          <span className="title-icon">⚡</span>
          符石符文合成与战斗模拟
          <span className="title-icon">⚡</span>
        </h1>
        <nav className="app-nav">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'collection' && <GemCollection />}
        {activeTab === 'forge' && <ForgeWorkshop />}
        {activeTab === 'battle' && <BattleArena />}
      </main>

      <footer className="app-footer">
        <p>收集符石 · 合成符文 · 征战四方</p>
      </footer>
    </div>
  )
}

export default App
