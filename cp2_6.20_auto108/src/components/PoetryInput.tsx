import { useState, useRef, useCallback, useEffect } from 'react'

interface HistoryItem {
  id: string
  title: string
  content: string
}

interface PoetryInputProps {
  className?: string
  onGenerate: (text: string) => void
  history: HistoryItem[]
  onHistoryClick: (item: HistoryItem) => void
  defaultText?: string
}

function PoetryInput({
  className = '',
  onGenerate,
  history,
  onHistoryClick,
  defaultText = '',
}: PoetryInputProps) {
  const [text, setText] = useState(defaultText)
  const [isGenerating, setIsGenerating] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setText(defaultText)
  }, [defaultText])

  const createRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current
    if (!button) return

    const circle = document.createElement('span')
    const diameter = Math.max(button.clientWidth, button.clientHeight)
    const radius = diameter / 2

    const rect = button.getBoundingClientRect()
    circle.style.width = circle.style.height = `${diameter}px`
    circle.style.left = `${e.clientX - rect.left - radius}px`
    circle.style.top = `${e.clientY - rect.top - radius}px`
    circle.classList.add('ripple')

    const existingRipple = button.querySelector('.ripple')
    if (existingRipple) {
      existingRipple.remove()
    }

    button.appendChild(circle)

    setTimeout(() => {
      if (circle.parentNode) {
        circle.remove()
      }
    }, 600)
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!text.trim() || isGenerating) return

      setIsGenerating(true)
      if ((e as React.MouseEvent<HTMLButtonElement>).clientX !== undefined) {
        createRipple(e as React.MouseEvent<HTMLButtonElement>)
      }

      requestAnimationFrame(() => {
        onGenerate(text.trim())
        setIsGenerating(false)
      })
    },
    [text, isGenerating, onGenerate, createRipple],
  )

  return (
    <div className={className}>
      <div className="panel-header">
        <h1 className="panel-title">诗画意境</h1>
        <p className="panel-subtitle">— 水墨丹青，诗意盎然 —</p>
      </div>

      <div className="panel-body">
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">
              <i className="fa-solid fa-feather"></i> 输入诗词
            </label>
            <textarea
              className="poetry-textarea"
              placeholder="请输入一首诗词"
              value={text}
              onChange={e => setText(e.target.value)}
              rows={6}
            />
          </div>

          <button
            ref={buttonRef}
            type="submit"
            className="generate-btn"
            disabled={!text.trim() || isGenerating}
            style={{ marginTop: '16px' }}
          >
            <i className="fa-solid fa-paintbrush"></i> 生成意境画作
          </button>
        </form>

        <div className="history-section">
          <div className="history-title">
            <i className="fa-solid fa-clock-rotate-left"></i> 最近生成
          </div>
          <div className="history-list">
            {history.map(item => (
              <div
                key={item.id}
                className="history-tag"
                onClick={() => onHistoryClick(item)}
                title={item.content}
              >
                {item.title}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PoetryInput
