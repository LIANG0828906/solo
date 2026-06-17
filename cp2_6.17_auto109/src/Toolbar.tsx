import React, { useState, useEffect } from 'react'
import { useBoardStore } from './store'

export const Toolbar: React.FC = () => {
  const undo = useBoardStore(s => s.undo)
  const redo = useBoardStore(s => s.redo)
  const clearAll = useBoardStore(s => s.clearAll)
  const notes = useBoardStore(s => s.present)
  const [showConfirm, setShowConfirm] = useState(false)

  const canUndo = useBoardStore(s => s.past.length > 0)
  const canRedo = useBoardStore(s => s.future.length > 0)
  const canClear = notes.length > 0

  const handleClearClick = () => {
    if (canClear) setShowConfirm(true)
  }

  const handleConfirmClear = () => {
    clearAll()
    setShowConfirm(false)
  }

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-title">ReflectBoard</div>
        <button
          className="toolbar-btn"
          onClick={undo}
          disabled={!canUndo}
          title="撤销 (Ctrl+Z)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.7 3L3 13" />
          </svg>
          撤销
        </button>
        <button
          className="toolbar-btn"
          onClick={redo}
          disabled={!canRedo}
          title="重做 (Ctrl+Shift+Z)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6.7 3L21 13" />
          </svg>
          重做
        </button>
        <button
          className="toolbar-btn danger"
          onClick={handleClearClick}
          disabled={!canClear}
          title="清空画布"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          清空所有
        </button>
      </div>

      {showConfirm && (
        <div className="confirm-modal-backdrop" onClick={() => setShowConfirm(false)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-modal-title">确认清空画布？</div>
            <div className="confirm-modal-text">
              此操作将删除画布上所有的便签及其连接关系，操作不可恢复（但可以撤销）。确定要继续吗？
            </div>
            <div className="confirm-modal-actions">
              <button className="confirm-btn cancel" onClick={() => setShowConfirm(false)}>
                取消
              </button>
              <button className="confirm-btn confirm" onClick={handleConfirmClear}>
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
