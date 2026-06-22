import React from 'react'
import { useApp } from './context/AppContext'
import './App.css'

const FittingEngine = React.lazy(() => import('./modules/fitting/FittingEngine'))
const ResultDisplay = React.lazy(() => import('./modules/result/ResultDisplay'))
const SizeChartManager = React.lazy(() => import('./modules/sizeChart/SizeChartManager'))

const navItems: { key: 'fitting' | 'result' | 'sizecharts'; label: string }[] = [
  { key: 'fitting', label: '尺码推算' },
  { key: 'result', label: '结果记录' },
  { key: 'sizecharts', label: '尺码对照表管理' },
]

export default function App() {
  const { activeTab, setActiveTab, toastMessage, batchItems } = useApp()

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">尺码助手</h2>
          {batchItems.length > 0 && (
            <span className="batch-badge">{batchItems.length}</span>
          )}
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${activeTab === item.key ? 'nav-item--active' : ''}`}
              onClick={() => setActiveTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <React.Suspense fallback={<div className="loading-spinner" />}>
          {activeTab === 'fitting' && <FittingEngine />}
          {activeTab === 'result' && <ResultDisplay />}
          {activeTab === 'sizecharts' && <SizeChartManager />}
        </React.Suspense>
      </main>

      {toastMessage && (
        <div className="toast">{toastMessage}</div>
      )}
    </div>
  )
}
