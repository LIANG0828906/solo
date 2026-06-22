import { useState, useEffect, useMemo } from 'react'
import {
  exportToJsonString,
  downloadJson,
  copyToClipboard,
} from '../utils/exportConfig'
import type { GeometryItemData, LightsConfig } from '../store/sceneStore'

interface ExportModalProps {
  onClose: () => void
  geometries: GeometryItemData[]
  lights: LightsConfig
}

const highlightJson = (json: string): string => {
  return json
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'json-number'
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key'
        } else {
          cls = 'json-string'
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean'
      } else if (/null/.test(match)) {
        cls = 'json-null'
      }
      return `<span class="${cls}">${match}</span>`
    })
}

export const ExportModal = ({
  onClose,
  geometries,
  lights,
}: ExportModalProps) => {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const jsonString = useMemo(() => {
    try {
      return exportToJsonString(geometries, lights)
    } catch (e) {
      setError('生成配置失败')
      return '{}'
    }
  }, [geometries, lights])

  const highlightedHtml = useMemo(() => highlightJson(jsonString), [jsonString])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleCopy = async () => {
    const ok = await copyToClipboard(jsonString)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      downloadJson(jsonString, `sculpture-${timestamp}.json`)
    } catch {
      setError('下载失败')
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container export-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            导出雕塑配置
          </h2>
          <button className="modal-close-btn" onClick={onClose} title="关闭">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="export-stats">
            <div className="stat-item">
              <span className="stat-label">几何体数量</span>
              <span className="stat-value">{geometries.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">文件大小</span>
              <span className="stat-value">{(jsonString.length / 1024).toFixed(2)} KB</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">格式</span>
              <span className="stat-value">JSON</span>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="json-preview-wrapper">
            <div className="json-preview-label">配置预览</div>
            <pre
              className="json-preview"
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn secondary" onClick={onClose}>
            关闭
          </button>
          <button
            className={`modal-btn ${copied ? 'success' : 'secondary'}`}
            onClick={handleCopy}
            disabled={copied}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {copied ? (
                <>
                  <polyline points="20 6 9 17 4 12" />
                </>
              ) : (
                <>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </>
              )}
            </svg>
            {copied ? '已复制!' : '复制到剪贴板'}
          </button>
          <button className="modal-btn primary" onClick={handleDownload}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            下载 .json
          </button>
        </div>
      </div>
    </div>
  )
}
