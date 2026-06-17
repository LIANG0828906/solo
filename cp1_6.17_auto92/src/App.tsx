import React, { Suspense, lazy } from 'react'
import { useGameStore } from './store/gameStore'
import { SceneHeader } from './modules/portal/PortalNavigator'

const RunePanel = lazy(() => import('./modules/runes/RunePanel'))
const PortalCore = lazy(() => import('./modules/portal/PortalCore'))
const PortalNavigator = lazy(() => import('./modules/portal/PortalNavigator'))

const App: React.FC = () => {
  const { isInteractionDisabled } = useGameStore()

  return (
    <div className="app-root">
      <Suspense fallback={<div className="app-loading">加载中...</div>}>
        <PortalNavigator />
      </Suspense>

      <div className={`app-overlay ${isInteractionDisabled ? 'active' : ''}`} />

      <div className="app-content">
        <SceneHeader />

        <main className="app-main">
          <Suspense fallback={<div className="module-loading">加载符文模块...</div>}>
            <RunePanel />
          </Suspense>
        </main>
      </div>

      <Suspense fallback={null}>
        <PortalCore />
      </Suspense>
    </div>
  )
}

export default App
