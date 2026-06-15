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
    const fallbackCopy = (text: string): boolean => {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.top = '-9999px'
      textArea.style.left = '-9999px'
      textArea.style.width = '1px'
      textArea.style.height = '1px'
      textArea.style.padding = '0'
      textArea.style.border = 'none'
      textArea.style.outline = 'none'
      textArea.style.boxShadow = 'none'
      textArea.style.background = 'transparent'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      let success = false
      try {
        success = document.execCommand('copy')
      } catch (err) {
        console.error('Fallback copy failed', err)
      }
      document.body.removeChild(textArea)
      return success
    }

    let success = false
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(jsonStr)
        success = true
      } else {
        success = fallbackCopy(jsonStr)
      }
    } catch (err) {
      success = fallbackCopy(jsonStr)
    }

    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    if (!success) {
      console.warn('Copy to clipboard may have failed')
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
