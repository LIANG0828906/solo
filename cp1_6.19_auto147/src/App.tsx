import React, { useRef, useState } from 'react'
import StickerLibrary from '@/stickers/StickerLibrary'
import Canvas from '@/canvas/Canvas'
import PropsPanel from '@/propsPanel/PropsPanel'
import { useEditor } from '@/context/EditorContext'
import { motion, AnimatePresence } from 'framer-motion'
import html2canvas from 'html2canvas'
import './styles/app.css'

const App: React.FC = () => {
  const { clearCanvas, stickers } = useEditor()
  const canvasRef = useRef<HTMLDivElement>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const handleExport = async () => {
    if (!canvasRef.current) return
    try {
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      })
      const link = document.createElement('a')
      link.download = `journal-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('导出失败:', err)
      alert('导出失败，请重试')
    }
  }

  const handleClear = () => {
    if (stickers.length === 0) return
    setShowClearConfirm(true)
  }

  const confirmClear = () => {
    clearCanvas()
    setShowClearConfirm(false)
  }

  return (
    <div className="app-container">
      <header className="app-toolbar">
        <div className="app-title">📓 数字拼贴手账</div>
        <div className="toolbar-actions">
          <motion.button
            className="btn btn-export"
            onClick={handleExport}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            导出 PNG
          </motion.button>
          <motion.button
            className="btn btn-clear"
            onClick={handleClear}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            清空画布
          </motion.button>
        </div>
      </header>

      <main className="app-main">
        <aside className="panel-left">
          <StickerLibrary />
        </aside>
        <section className="canvas-wrapper">
          <Canvas ref={canvasRef} />
        </section>
        <aside className="panel-right">
          <PropsPanel />
        </aside>
      </main>

      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>确认清空</h3>
              <p>确定要清空画布上的所有内容吗？此操作不可撤销。</p>
              <div className="modal-actions">
                <motion.button
                  className="btn btn-cancel"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowClearConfirm(false)}
                >
                  取消
                </motion.button>
                <motion.button
                  className="btn btn-clear"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={confirmClear}
                >
                  确认清空
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
