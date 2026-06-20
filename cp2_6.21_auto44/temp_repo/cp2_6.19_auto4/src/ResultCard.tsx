import { useRef, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { toPng } from 'html-to-image'

interface ResultCardProps {
  title: string
  description: string
  gradientColors: string[]
  gradientDirection: number
  onTitleChange: (title: string) => void
  onGradientDirectionChange: (index: number) => void
  onRestart: () => void
}

const GRADIENT_DIRECTIONS = [
  { value: 'to right', label: '左→右' },
  { value: 'to bottom', label: '上→下' },
  { value: 'to bottom right', label: '左上→右下' },
  { value: 'to top right', label: '左下→右上' },
]

export default function ResultCard({
  title,
  description,
  gradientColors,
  gradientDirection,
  onTitleChange,
  onGradientDirectionChange,
  onRestart,
}: ResultCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const gradientStyle = {
    background: `linear-gradient(${GRADIENT_DIRECTIONS[gradientDirection].value}, ${gradientColors[0]}, ${gradientColors[1]})`,
  }

  const handleSave = useCallback(async () => {
    if (!cardRef.current) return
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      })
      const link = document.createElement('a')
      link.download = `性格测试结果-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('保存图片失败:', err)
    }
  }, [])

  return (
    <div className="glass-card card-enter">
      <div ref={cardRef} className="result-card" style={gradientStyle}>
        <h2 className="result-title">{title}</h2>
        <p className="result-description">{description}</p>
        <div className="result-qr">
          <QRCodeSVG
            value={`https://quiz.example.com/result?t=${encodeURIComponent(title)}`}
            size={80}
            bgColor="transparent"
            fgColor="#ffffff"
          />
        </div>
      </div>

      <div className="edit-section">
        <label className="edit-label">编辑标题</label>
        <input
          type="text"
          className="edit-input"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="输入个性标题..."
          maxLength={20}
        />

        <label className="edit-label">渐变方向</label>
        <div className="gradient-picker">
          {GRADIENT_DIRECTIONS.map((dir, idx) => (
            <div
              key={idx}
              className={`gradient-option ${
                gradientDirection === idx ? 'selected' : ''
              }`}
              style={{
                background: `linear-gradient(${dir.value}, ${gradientColors[0]}, ${gradientColors[1]})`,
              }}
              onClick={() => onGradientDirectionChange(idx)}
            >
              <span className="gradient-option-label">{dir.label}</span>
            </div>
          ))}
        </div>

        <div className="action-buttons">
          <button className="btn-primary" onClick={handleSave}>
            保存为PNG图片
          </button>
          <button className="btn-secondary" onClick={onRestart}>
            重新测试
          </button>
        </div>
      </div>
    </div>
  )
}
