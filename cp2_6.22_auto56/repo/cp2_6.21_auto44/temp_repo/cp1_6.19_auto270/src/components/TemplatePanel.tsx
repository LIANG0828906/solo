import { useCallback, useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useEditorStore } from '@/store/editorStore'
import type { TemplateId, SignatureFont } from '@/store/editorStore'

interface TemplateConfig {
  id: TemplateId
  name: string
  bgColor: string
  borderColor: string | null
  borderWidth: number
  accentColor: string
}

const TEMPLATES: TemplateConfig[] = [
  { id: 'kraft', name: '牛皮纸信封', bgColor: '#C19A6B', borderColor: null, borderWidth: 0, accentColor: '#8B6914' },
  { id: 'parchment', name: '复古羊皮纸', bgColor: '#EFE4C6', borderColor: null, borderWidth: 0, accentColor: '#8B7355' },
  { id: 'modern', name: '现代简约白', bgColor: '#FFFFFF', borderColor: '#CCCCCC', borderWidth: 2, accentColor: '#666666' },
  { id: 'business', name: '极黑商务', bgColor: '#1A1A1A', borderColor: '#C9A96E', borderWidth: 2, accentColor: '#C9A96E' },
]

const FONT_OPTIONS: { value: SignatureFont; label: string }[] = [
  { value: 'kaiti', label: '楷体' },
  { value: 'songti', label: '宋体' },
  { value: 'handwriting', label: '手写体' },
]

export default function TemplatePanel() {
  const {
    currentTemplateId,
    signatureText,
    signatureFont,
    signatureSize,
    processedImageDataUrl,
    setTemplateId,
    setSignatureText,
    setSignatureFont,
    setSignatureSize,
  } = useEditorStore()

  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const [activePreview, setActivePreview] = useState<TemplateId | null>(null)

  const drawTemplatePreview = useCallback(
    (template: TemplateConfig, canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const w = 120
      const h = 160
      canvas.width = w
      canvas.height = h

      ctx.fillStyle = template.bgColor
      ctx.fillRect(0, 0, w, h)

      if (template.id === 'kraft') {
        for (let i = 0; i < 300; i++) {
          const tx = Math.random() * w
          const ty = Math.random() * h
          ctx.fillStyle = `rgba(139,105,20,${Math.random() * 0.1})`
          ctx.fillRect(tx, ty, Math.random() * 2, Math.random() * 1)
        }
      }

      if (template.id === 'parchment') {
        const cs = 12
        ctx.strokeStyle = '#8B7355'
        ctx.lineWidth = 1
        const drawCorner = (cx: number, cy: number, sx: number, sy: number) => {
          ctx.beginPath()
          ctx.moveTo(cx, cy + cs * sy)
          ctx.quadraticCurveTo(cx, cy, cx + cs * sx, cy)
          ctx.stroke()
        }
        drawCorner(2, 2, 1, 1)
        drawCorner(w - 2, 2, -1, 1)
        drawCorner(2, h - 2, 1, -1)
        drawCorner(w - 2, h - 2, -1, -1)
      }

      if (template.borderColor) {
        ctx.strokeStyle = template.borderColor
        ctx.lineWidth = template.borderWidth
        ctx.strokeRect(template.borderWidth / 2, template.borderWidth / 2, w - template.borderWidth, h - template.borderWidth)
      }

      const letterW = 80
      const letterH = 100
      const letterX = (w - letterW) / 2
      const letterY = (h - letterH) / 2 - 8

      ctx.fillStyle = '#FFF8F0'
      ctx.fillRect(letterX, letterY, letterW, letterH)

      ctx.strokeStyle = 'rgba(0,0,0,0.08)'
      ctx.lineWidth = 0.5
      for (let i = 1; i < 6; i++) {
        const ly = letterY + 12 + i * 14
        ctx.beginPath()
        ctx.moveTo(letterX + 6, ly)
        ctx.lineTo(letterX + letterW - 6, ly)
        ctx.stroke()
      }

      ctx.fillStyle = template.id === 'business' ? '#C9A96E' : '#8B7355'
      ctx.font = '8px serif'
      ctx.textAlign = 'center'
      ctx.fillText('—签名', w / 2, h - 8)
    },
    []
  )

  useEffect(() => {
    TEMPLATES.forEach((template) => {
      const canvas = document.getElementById(`template-preview-${template.id}`) as HTMLCanvasElement
      if (canvas) {
        drawTemplatePreview(template, canvas)
      }
    })
  }, [drawTemplatePreview])

  useEffect(() => {
    if (!activePreview || !processedImageDataUrl) return
    const canvas = previewCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const template = TEMPLATES.find((t) => t.id === activePreview)!
    const w = 280
    const h = 380
    canvas.width = w
    canvas.height = h

    ctx.fillStyle = template.bgColor
    ctx.fillRect(0, 0, w, h)

    if (template.id === 'kraft') {
      for (let i = 0; i < 600; i++) {
        const tx = Math.random() * w
        const ty = Math.random() * h
        ctx.fillStyle = `rgba(139,105,20,${Math.random() * 0.08})`
        ctx.fillRect(tx, ty, Math.random() * 3, Math.random() * 1)
      }
    }

    if (template.id === 'parchment') {
      const cs = 30
      ctx.strokeStyle = '#8B7355'
      ctx.lineWidth = 1.5
      const drawCorner = (cx: number, cy: number, sx: number, sy: number) => {
        ctx.beginPath()
        ctx.moveTo(cx, cy + cs * sy)
        ctx.quadraticCurveTo(cx, cy, cx + cs * sx, cy)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(cx + 4 * sx, cy + cs * sy * 0.7)
        ctx.quadraticCurveTo(cx + 4 * sx, cy + 4 * sy, cx + cs * sx * 0.7, cy + 4 * sy)
        ctx.stroke()
      }
      drawCorner(4, 4, 1, 1)
      drawCorner(w - 4, 4, -1, 1)
      drawCorner(4, h - 4, 1, -1)
      drawCorner(w - 4, h - 4, -1, -1)
    }

    if (template.borderColor) {
      ctx.strokeStyle = template.borderColor
      ctx.lineWidth = template.borderWidth
      ctx.strokeRect(template.borderWidth / 2, template.borderWidth / 2, w - template.borderWidth, h - template.borderWidth)
    }

    const img = new Image()
    img.onload = () => {
      const padding = 6
      const maxLetterW = w - padding * 2
      const maxLetterH = h - padding * 2 - 40
      const imgAspect = img.width / img.height
      let drawW = maxLetterW
      let drawH = drawW / imgAspect
      if (drawH > maxLetterH) {
        drawH = maxLetterH
        drawW = drawH * imgAspect
      }
      const drawX = (w - drawW) / 2
      const drawY = padding + (maxLetterH - drawH) / 2
      ctx.drawImage(img, drawX, drawY, drawW, drawH)

      ctx.fillStyle = template.id === 'business' ? '#C9A96E' : '#5C4033'
      ctx.font = `${signatureSize}px ${signatureFont === 'kaiti' ? 'KaiTi, serif' : signatureFont === 'songti' ? 'SimSun, serif' : 'cursive, serif'}`
      ctx.textAlign = 'center'
      ctx.fillText(signatureText, w / 2, h - 10)
    }
    img.src = processedImageDataUrl
  }, [activePreview, processedImageDataUrl, signatureText, signatureFont, signatureSize])

  return (
    <div className="template-panel">
      <h2 className="panel-title">信封模板</h2>

      <div className="template-grid">
        {TEMPLATES.map((template) => (
          <motion.div
            key={template.id}
            className="template-card"
            style={{
              opacity: currentTemplateId === template.id ? 1 : 0.7,
              border: currentTemplateId === template.id ? '2px solid #E67E22' : '2px solid transparent',
            }}
            onClick={() => setTemplateId(template.id)}
            onMouseEnter={() => setActivePreview(template.id)}
            onMouseLeave={() => setActivePreview(null)}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.15 }}
          >
            <canvas
              id={`template-preview-${template.id}`}
              style={{ width: '120px', height: '160px', borderRadius: '6px' }}
            />
            <p className="template-card-name">{template.name}</p>
          </motion.div>
        ))}
      </div>

      {activePreview && processedImageDataUrl && (
        <div className="template-preview-section">
          <h3 className="preview-title">实时预览</h3>
          <canvas
            ref={previewCanvasRef}
            style={{
              width: '280px',
              height: '380px',
              borderRadius: '8px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            }}
          />
        </div>
      )}

      <div className="signature-section">
        <h3 className="signature-title">签名设置</h3>

        <div className="signature-field">
          <label>签名文字</label>
          <input
            type="text"
            value={signatureText}
            onChange={(e) => setSignatureText(e.target.value)}
            className="signature-input"
            placeholder="输入签名"
          />
        </div>

        <div className="signature-field">
          <label>字体</label>
          <select
            value={signatureFont}
            onChange={(e) => setSignatureFont(e.target.value as SignatureFont)}
            className="signature-select"
          >
            {FONT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="signature-field">
          <label>字号: {signatureSize}px</label>
          <input
            type="range"
            min={12}
            max={28}
            step={1}
            value={signatureSize}
            onChange={(e) => setSignatureSize(parseInt(e.target.value))}
            className="custom-range signature-range"
          />
        </div>
      </div>
    </div>
  )
}
