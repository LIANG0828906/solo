import React, { useState } from 'react'
import { Check } from 'lucide-react'
import type { DesignTokens } from '../../context/DesignTokensContext'

interface ExportModalProps {
  tokens: DesignTokens
  onClose: () => void
}

const ExportModal: React.FC<ExportModalProps> = ({ tokens, onClose }) => {
  const [copied, setCopied] = useState(false)
  const jsonStr = JSON.stringify(tokens, null, 2)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonStr)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed', err)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">导出设计令牌</div>
        <div className="modal-json">{jsonStr}</div>
        <div className="modal-actions">
          <button
            className="modal-btn modal-btn-copy"
            onClick={handleCopy}
          >
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

export default ExportModal
