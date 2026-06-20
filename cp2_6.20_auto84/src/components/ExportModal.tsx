import { useState, useEffect } from 'react'
import { X, FileImage, FileText, Loader2, Check } from 'lucide-react'
import { useEditorStore } from '../store/editorStore'
import { exportPNG, exportPDF, estimateFileSize, playCompleteSound } from '../utils/exportUtils'
import './ExportModal.css'

interface ExportModalProps {
  onClose: () => void
}

type ExportFormat = 'png' | 'pdf'

interface Particle {
  id: number
  x: number
  y: number
  tx: number
  ty: number
  color: string
  size: number
}

function ExportModal({ onClose }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('png')
  const [estimatedSize, setEstimatedSize] = useState<string>('计算中...')
  const [isExporting, setIsExporting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])

  const elements = useEditorStore((s) => s.elements)
  const background = useEditorStore((s) => s.background)

  useEffect(() => {
    estimateFileSize(elements, background, format).then(setEstimatedSize)
  }, [format, elements, background])

  useEffect(() => {
    const colors = ['#6c5ce7', '#a29bfe', '#fd79a8', '#00b894', '#fdcb6e']
    const newParticles: Particle[] = []
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        id: i,
        x: 0,
        y: 0,
        tx: (Math.random() - 0.5) * 200,
        ty: (Math.random() - 0.5) * 200,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 3,
      })
    }
    setParticles(newParticles)
  }, [])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      if (format === 'png') {
        await exportPNG(elements, background, true)
      } else {
        await exportPDF(elements, background)
      }
      setIsComplete(true)
      playCompleteSound()
      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (error) {
      console.error('Export failed:', error)
      setIsExporting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isExporting) {
      onClose()
    }
  }

  return (
    <div className="export-modal-backdrop" onClick={handleBackdropClick}>
      <div className="export-modal">
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              '--tx': `${p.tx}px`,
              '--ty': `${p.ty}px`,
              backgroundColor: p.color,
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: '50%',
              top: '50%',
              animationDelay: `${Math.random() * 0.3}s`,
            } as React.CSSProperties}
          />
        ))}

        <button className="modal-close" onClick={onClose} disabled={isExporting}>
          <X size={20} />
        </button>

        <h2 className="modal-title">导出贺卡</h2>
        <p className="modal-subtitle">选择导出格式，预计文件大小：{estimatedSize}</p>

        <div className="format-options">
          <button
            className={`format-option ${format === 'png' ? 'selected' : ''}`}
            onClick={() => setFormat('png')}
            disabled={isExporting}
          >
            <FileImage size={36} />
            <div className="format-info">
              <span className="format-name">PNG 图片</span>
              <span className="format-desc">高清透明背景</span>
            </div>
            {format === 'png' && <div className="format-check" />}
          </button>

          <button
            className={`format-option ${format === 'pdf' ? 'selected' : ''}`}
            onClick={() => setFormat('pdf')}
            disabled={isExporting}
          >
            <FileText size={36} />
            <div className="format-info">
              <span className="format-name">PDF 文档</span>
              <span className="format-desc">A4 300dpi 打印</span>
            </div>
            {format === 'pdf' && <div className="format-check" />}
          </button>
        </div>

        <button
          className="export-btn"
          onClick={handleExport}
          disabled={isExporting || isComplete}
        >
          {isExporting ? (
            <>
              <Loader2 size={20} className="spinning" />
              <span>导出中...</span>
            </>
          ) : isComplete ? (
            <>
              <Check size={20} />
              <span>导出完成！</span>
            </>
          ) : (
            <span>确认导出</span>
          )}
        </button>
      </div>
    </div>
  )
}

export default ExportModal
