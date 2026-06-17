import { useEffect, useState } from 'react'
import { useSkillTreeStore } from '@/store/skillTreeStore'
import { SkillTreePanel } from '@/components/SkillTreePanel'
import { StatsPanel } from '@/components/StatsPanel'
import { TaskDetail } from '@/components/TaskDetail'
import { LevelProgress } from '@/components/LevelProgress'
import './App.css'

export default function App() {
  const { initData, loading, initialized } = useSkillTreeStore()
  const [mobileTab, setMobileTab] = useState<'tree' | 'detail' | 'stats'>('detail')

  useEffect(() => {
    if (!initialized) {
      initData()
    }
  }, [initialized, initData])

  if (loading && !initialized) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <div className="loading-text">加载技能树...</div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="app-brand">
            <span className="brand-icon">🌟</span>
            <span className="brand-name">SkillTree Todo</span>
          </div>
          <LevelProgress />
          <div className="header-spacer" />
        </div>
      </header>

      <div className="app-body">
        <div className={`main-layout ${mobileTab === 'tree' ? 'show-tree' : ''} ${mobileTab === 'stats' ? 'show-stats' : ''}`}>
          <SkillTreePanel />
          <TaskDetail />
          <StatsPanel />
        </div>
      </div>

      <nav className="mobile-tabbar">
        <button
          className={`tab-btn ${mobileTab === 'tree' ? 'active' : ''}`}
          onClick={() => setMobileTab('tree')}
        >
          <span className="tab-icon">🌳</span>
          <span className="tab-label">技能树</span>
        </button>
        <button
          className={`tab-btn ${mobileTab === 'detail' ? 'active' : ''}`}
          onClick={() => setMobileTab('detail')}
        >
          <span className="tab-icon">📝</span>
          <span className="tab-label">待办</span>
        </button>
        <button
          className={`tab-btn ${mobileTab === 'stats' ? 'active' : ''}`}
          onClick={() => setMobileTab('stats')}
        >
          <span className="tab-icon">📊</span>
          <span className="tab-label">统计</span>
        </button>
      </nav>
    </div>
  )
}
