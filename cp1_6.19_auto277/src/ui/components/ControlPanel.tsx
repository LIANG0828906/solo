import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Download, Upload, Menu, X } from 'lucide-react'
import { useBubbleStore } from '@/bubble/store/bubbleStore'
import { useConnectionStore } from '@/connection/store/connectionStore'
import { useCanvasStore } from '@/canvas/store/canvasStore'
import { exportCanvas, importCanvas } from '@/utils/exportImport'
import type { CanvasExport } from '@/types'

export const ControlPanel: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addBubble = useBubbleStore(s => s.addBubble)
  const setBubbles = useBubbleStore(s => s.setBubbles)
  const setConnections = useConnectionStore(s => s.setConnections)
  const resetView = useCanvasStore(s => s.resetView)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleNewBubble = useCallback(() => {
    const scale = useCanvasStore.getState().scale
    const offsetX = useCanvasStore.getState().offsetX
    const offsetY = useCanvasStore.getState().offsetY
    const centerX = (window.innerWidth / 2 - offsetX) / scale
    const centerY = (window.innerHeight / 2 - offsetY) / scale
    const jitterX = (Math.random() - 0.5) * 100
    const jitterY = (Math.random() - 0.5) * 100
    addBubble(centerX + jitterX, centerY + jitterY)
    setIsMobileOpen(false)
  }, [addBubble])

  const handleExport = useCallback(() => {
    const bubbles = useBubbleStore.getState().bubbles
    const connections = useConnectionStore.getState().connections
    exportCanvas(bubbles, connections)
    setIsMobileOpen(false)
  }, [])

  const handleImportClick = useCallback(() => {
    setImportError(null)
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data: CanvasExport = await importCanvas(file)
      setBubbles(data.bubbles)
      setConnections(data.connections)
      resetView()
      setImportError(null)
      setIsMobileOpen(false)
    } catch (err) {
      setImportError((err as Error).message)
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [setBubbles, setConnections, resetView])

  const panelContent = (
    <>
      <button className="control-btn" onClick={handleNewBubble} title="新建气泡">
        <Plus size={16} />
        <span>新建气泡</span>
      </button>
      <button className="control-btn" onClick={handleExport} title="导出JSON">
        <Download size={16} />
        <span>导出</span>
      </button>
      <button className="control-btn" onClick={handleImportClick} title="导入JSON">
        <Upload size={16} />
        <span>导入</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {importError && (
        <div className="import-error">{importError}</div>
      )}
    </>
  )

  return (
    <>
      {isMobile && (
        <motion.button
          className="mobile-menu-btn"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          initial={false}
          whileTap={{ scale: 0.9 }}
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </motion.button>
      )}

      <AnimatePresence>
        {(!isMobile || isMobileOpen) && (
          isMobile ? (
            <motion.aside
              className="control-panel-mobile"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="panel-header">
                <span className="panel-title">气泡墙</span>
                <button
                  className="close-btn"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
              {panelContent}
              <div className="panel-hint">
                提示：双击画布空白处创建气泡<br />
                从气泡边缘拖拽到另一气泡创建连接<br />
                选中气泡按 Delete 键删除
              </div>
            </motion.aside>
          ) : (
            <motion.div
              className="control-panel"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {panelContent}
            </motion.div>
          )
        )}
      </AnimatePresence>
    </>
  )
}
