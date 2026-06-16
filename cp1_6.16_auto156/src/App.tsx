import React, { useEffect } from 'react'
import { ParamPanel } from './components/ParamPanel'
import { PreviewArea } from './components/PreviewArea'
import { fontManager } from './modules/font-manager/FontManager'

const App: React.FC = () => {
  useEffect(() => {
    fontManager.preloadAllGoogleFonts().catch(() => {
      // Font preloading failures are non-critical
    })
  }, [])

  return (
    <div className="app-container">
      <ParamPanel />
      <PreviewArea />
    </div>
  )
}

export default App
