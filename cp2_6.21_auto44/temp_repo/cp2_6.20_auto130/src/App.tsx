import React, { useState, useEffect } from 'react'
import ToolPanel from './components/ToolPanel'
import GameCanvas from './components/GameCanvas'
import ExportPanel from './components/ExportPanel'

function App() {
  const [showPanel, setShowPanel] = useState<'export' | 'import' | null>(null)

  useEffect(() => {
    const handleExport = () => {
      setShowPanel('export')
    }
    const handleImport = () => {
      setShowPanel('import')
    }

    window.addEventListener('export-level', handleExport)
    window.addEventListener('import-level', handleImport)

    return () => {
      window.removeEventListener('export-level', handleExport)
      window.removeEventListener('import-level', handleImport)
    }
  }, [])

  return (
    <div className="app-container">
      <ToolPanel />
      <GameCanvas />
      {showPanel && (
        <ExportPanel mode={showPanel} onClose={() => setShowPanel(null)} />
      )}
    </div>
  )
}

export default App
