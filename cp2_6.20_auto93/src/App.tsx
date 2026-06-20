import React, { useState, useRef } from 'react'
import Toolbar, { ToolMode as ToolbarMode } from './ui/Toolbar'
import StatusBar, { ToolMode as StatusMode } from './ui/StatusBar'
import DoodleCanvas, { DoodleCanvasHandle, ToolMode as CanvasMode } from './canvas/DoodleCanvas'
import { canvasToPNG, canvasToSVG } from './utils/exportUtils'

const App: React.FC = () => {
  const [mode, setMode] = useState<CanvasMode>('brush')
  const [brushColor, setBrushColor] = useState('#2c3e50')
  const [brushThickness, setBrushThickness] = useState(4)
  const [selectedCount, setSelectedCount] = useState(0)
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const [zoom, setZoom] = useState(1)

  const canvasRef = useRef<DoodleCanvasHandle>(null)

  const handleGridAlign = () => {
    canvasRef.current?.alignToGrid()
  }

  const handleExport = (format: 'png' | 'svg') => {
    const strokes = canvasRef.current?.exportStrokes() || []
    const bounds = canvasRef.current?.getExportBounds() || { width: 1200, height: 800 }

    if (format === 'png') {
      canvasToPNG(strokes, bounds.width, bounds.height)
    } else {
      canvasToSVG(strokes, bounds.width, bounds.height)
    }
  }

  const statusMode: StatusMode = mode === 'brush' ? 'brush' : mode === 'select' ? 'select' : 'grid'

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <DoodleCanvas
        ref={canvasRef}
        mode={mode}
        brushColor={brushColor}
        brushThickness={brushThickness}
        onSelectionChange={setSelectedCount}
        onMouseMove={(x, y) => {
          setMouseX(x)
          setMouseY(y)
        }}
        onZoomChange={setZoom}
      />

      <Toolbar
        mode={mode as ToolbarMode}
        onModeChange={setMode}
        brushColor={brushColor}
        onBrushColorChange={setBrushColor}
        brushThickness={brushThickness}
        onBrushThicknessChange={setBrushThickness}
        onGridAlign={handleGridAlign}
        onExport={handleExport}
      />

      <StatusBar
        mode={statusMode}
        selectedCount={selectedCount}
        mouseX={mouseX}
        mouseY={mouseY}
        zoom={zoom}
      />
    </div>
  )
}

export default App
