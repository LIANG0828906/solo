import React, { useEffect } from 'react'
import StationMap from './components/StationMap'
import DispatchPanel from './components/DispatchPanel'
import Dashboard from './components/Dashboard'
import { useStationStore } from './store/useStationStore'

const App: React.FC = () => {
  const { setShowDispatchPanel, showDispatchPanel, addLog } = useStationStore()

  useEffect(() => {
    addLog({
      type: 'log',
      message: '唐代凉州长城驿管理系统已启动，驿丞大人请开始今日值守。',
      level: 'info'
    })
  }, [addLog])

  return (
    <div className="app-container">
      <div className="main-content">
        <div className="header">
          <h1>🏯 唐代凉州长城驿</h1>
          <p>大唐边塞驿站管理系统 - 驼队核验 · 马匹更换 · 烽燧报警 · 旅人食宿</p>
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button
            className="toggle-btn"
            onClick={() => setShowDispatchPanel(!showDispatchPanel)}
          >
            📋 打开驿丞署
          </button>
          <span style={{ color: 'var(--smoke-gray)', fontSize: '0.9rem' }}>
            提示：每30-60秒有驼队抵达，点击烽燧可施放信号
          </span>
        </div>

        <StationMap />
      </div>

      <Dashboard />
      <DispatchPanel />
    </div>
  )
}

export default App
