import React, { useEffect, useState } from 'react'
import { FiX, FiDownload, FiCheck, FiCopy } from 'react-icons/fi'
import { useApp } from './AppContext'

import './ExportModal.css'

interface ExportModalProps {
  onClose: () => void
}

const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
  const { exportProgress, exportUrl, exportWav, clearExport, tracks } = useApp()
  const [shareLink, setShareLink] = useState<string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    exportWav()
  }, [exportWav])

  useEffect(() => {
    if (exportUrl) {
      const shareId = Math.random().toString(36).substring(2, 10)
      setShareLink(`https://melodymix.app/share/${shareId}`)
    }
  }, [exportUrl])

  const handleDownload = () => {
    if (!exportUrl) return
    const a = document.createElement('a')
    a.href = exportUrl
    a.download = `melody-mix-${Date.now()}.wav`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleCopyLink = async () => {
    if (!shareLink) return
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Failed to copy:', e)
    }
  }

  const handleClose = () => {
    clearExport()
    onClose()
  }

  const isComplete = exportProgress >= 100

  return (
    <div className="export-modal-overlay" onClick={handleClose}>
      <div className="export-modal" onClick={e => e.stopPropagation()}>
        <div className="export-header">
          <h3>导出混音</h3>
          <button className="close-btn" onClick={handleClose}>
            <FiX />
          </button>
        </div>

        <div className="export-body">
          <div className="export-progress-section">
            <div className="progress-label">
              <span>
                {isComplete ? '导出完成！' : '正在导出...'}
              </span>
              <span className="progress-percent">{Math.round(exportProgress)}%</span>
            </div>
            <div className="progress-bar-wrapper">
              <div 
                className="progress-bar-fill"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <p className="track-info">
              包含 {tracks.length} 条音轨 · WAV格式 · 44.1kHz
            </p>
          </div>

          {isComplete && (
            <div className="export-actions">
              <button className="export-btn download-btn" onClick={handleDownload}>
                <FiDownload />
                下载 WAV
              </button>

              <div className="share-section">
                <label className="share-label">分享链接</label>
                <div className="share-input-wrapper">
                  <input 
                    type="text" 
                    value={shareLink}
                    readOnly
                    className="share-input"
                  />
                  <button 
                    className={`copy-btn ${copied ? 'copied' : ''}`}
                    onClick={handleCopyLink}
                  >
                    {copied ? <FiCheck /> : <FiCopy />}
                  </button>
                </div>
                <p className="share-hint">复制链接分享给好友</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExportModal
