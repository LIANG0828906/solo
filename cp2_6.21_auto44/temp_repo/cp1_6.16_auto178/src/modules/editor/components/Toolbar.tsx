import React from 'react'
import {
  Plus,
  Undo2,
  Redo2,
  Download,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useMindmapStore } from '../store/useMindmapStore'

const Toolbar: React.FC = () => {
  const {
    addNode,
    undo,
    redo,
    canUndo,
    canRedo,
    setZoom,
    zoom,
    exportPNG,
    panX,
    panY,
  } = useMindmapStore()

  const handleAddRootNode = () => {
    const centerX = -panX / zoom + window.innerWidth / 2 / zoom - 100
    const centerY = -panY / zoom + (window.innerHeight - 56) / 2 / zoom - 20
    addNode('新节点', centerX, centerY)
  }

  const handleZoomIn = () => setZoom(zoom + 0.25)
  const handleZoomOut = () => setZoom(zoom - 0.25)

  const undoDisabled = !canUndo()
  const redoDisabled = !canRedo()

  const buttonClass = (disabled = false) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-out ${
      disabled
        ? 'opacity-50 cursor-not-allowed text-gray-400'
        : 'text-gray-700 hover:bg-[#E3F2FD] active:bg-[#BBDEFB]'
    }`

  return (
    <div
      className="h-14 bg-white flex items-center px-4 gap-2"
      style={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <button className={buttonClass()} onClick={handleAddRootNode}>
        <Plus size={18} />
        <span>添加根节点</span>
      </button>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      <button
        className={buttonClass(undoDisabled)}
        onClick={undo}
        disabled={undoDisabled}
      >
        <Undo2 size={18} />
        <span>撤销</span>
      </button>

      <button
        className={buttonClass(redoDisabled)}
        onClick={redo}
        disabled={redoDisabled}
      >
        <Redo2 size={18} />
        <span>重做</span>
      </button>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      <button className={buttonClass()} onClick={exportPNG}>
        <Download size={18} />
        <span>导出PNG</span>
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <button className={buttonClass(zoom <= 0.25)} onClick={handleZoomOut} disabled={zoom <= 0.25}>
          <ZoomOut size={18} />
        </button>
        <span className="text-sm text-gray-600 w-14 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button className={buttonClass(zoom >= 2)} onClick={handleZoomIn} disabled={zoom >= 2}>
          <ZoomIn size={18} />
        </button>
      </div>
    </div>
  )
}

export default Toolbar
