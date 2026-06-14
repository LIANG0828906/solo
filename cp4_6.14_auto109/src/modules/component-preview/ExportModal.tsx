import React, { useState, useMemo, useCallback } from 'react'
import { Check } from 'lucide-react'
import type { DesignTokens } from '../../context/DesignTokensContext'

interface ExportModalProps {
  tokens: DesignTokens
  onClose: () => void
}

const ExportModal: React.FC<ExportModalProps> = ({ tokens, onClose }) => {
  const [copied, setCopied] = useState(false)

  const jsonStr = useMemo(() => JSON.stringify(tokens, null, 2), [tokens])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonStr)
      setCopied(true)
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    } catch (err) {
      console.error('Copy failed', err)
    }
  }, [jsonStr])

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose]
  )

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-title">导出设计令牌</div>
        <div className="modal-json">{jsonStr}</div>
        <div className="modal-actions">
          <button className="modal-btn modal-btn-copy" onClick={handleCopy}>
            {copied && <Check size={16} className="check-icon" />}
            {copied ? '已复制' : '复制到剪贴板'}
          </button>
          <button className="modal-btn modal-btn-close" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(ExportModal)
