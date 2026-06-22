import { useState } from 'react'
import { X, Download, Copy, Check, FileImage, FileCode, Archive } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { generateHandwriting } from '../modules/handwritingGenerator'
import {
  exportAsPng,
  exportAsSvg,
  exportAsSvz,
  copySvgToClipboard,
  getSvgString,
} from '../utils/exporter'

interface ExportModalProps {
  onClose: () => void
  leftCanvas: HTMLCanvasElement | null
}

export default function ExportModal({ onClose, leftCanvas }: ExportModalProps) {
  const { text, style, styleParams, background } = useAppStore()
  const [copied, setCopied] = useState(false)
  const [svgCode] = useState(() => {
    const result = generateHandwriting(text, style, styleParams)
    return getSvgString(result, styleParams, background)
  })

  const handleExportPng = async () => {
    if (!leftCanvas) return
    const result = generateHandwriting(text, style, styleParams)
    await exportAsPng(result, styleParams, background, leftCanvas)
  }

  const handleExportSvg = async () => {
    const result = generateHandwriting(text, style, styleParams)
    await exportAsSvg(result, styleParams, background)
  }

  const handleExportSvz = async () => {
    const result = generateHandwriting(text, style, styleParams)
    await exportAsSvz(result, styleParams, background)
  }

  const handleCopySvg = async () => {
    const result = generateHandwriting(text, style, styleParams)
    const success = await copySvgToClipboard(result, styleParams, background)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>导出手写效果</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="export-options">
            <button className="export-btn" onClick={handleExportPng}>
              <div className="export-icon">
                <FileImage size={28} />
              </div>
              <div className="export-info">
                <span className="export-title">PNG 图片</span>
                <span className="export-desc">高清位图，适合直接使用</span>
              </div>
              <Download size={18} className="export-action" />
            </button>

            <button className="export-btn" onClick={handleExportSvz}>
              <div className="export-icon">
                <Archive size={28} />
              </div>
              <div className="export-info">
                <span className="export-title">SVZ 压缩包</span>
                <span className="export-desc">SVG压缩格式，包含元数据</span>
              </div>
              <Download size={18} className="export-action" />
            </button>

            <button className="export-btn" onClick={handleExportSvg}>
              <div className="export-icon">
                <FileCode size={28} />
              </div>
              <div className="export-info">
                <span className="export-title">SVG 文件</span>
                <span className="export-desc">矢量格式，可无限缩放</span>
              </div>
              <Download size={18} className="export-action" />
            </button>

            <button className="export-btn" onClick={handleCopySvg}>
              <div className="export-icon">
                {copied ? <Check size={28} className="copied" /> : <Copy size={28} />}
              </div>
              <div className="export-info">
                <span className="export-title">
                  {copied ? '已复制！' : '复制 SVG 代码'}
                </span>
                <span className="export-desc">直接粘贴到设计工具中使用</span>
              </div>
            </button>
          </div>

          <div className="svg-preview-section">
            <div className="preview-header">
              <span>SVG 代码预览</span>
            </div>
            <div className="svg-code-preview">
              <pre>{svgCode.slice(0, 500)}...</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
