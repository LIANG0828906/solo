import { useState } from 'react'
import EditorArea from './components/EditorArea'
import ToolbarPanel from './components/ToolbarPanel'
import PropertyPanel from './components/PropertyPanel'
import LayerPanel from './components/LayerPanel'
import ExportModal from './components/ExportModal'
import './App.css'

function App() {
  const [showExportModal, setShowExportModal] = useState(false)

  return (
    <div className="app-container">
      <ToolbarPanel onExportClick={() => setShowExportModal(true)} />
      <EditorArea />
      <PropertyPanel />
      <LayerPanel />
      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} />
      )}
    </div>
  )
}

export default App
