import { useEffect, useRef, useState } from 'react'

export type InputMode = 'throw' | 'reply'

interface BottleInputProps {
  open: boolean
  mode: InputMode
  targetHint?: string
  onSubmit: (content: string) => void
  onClose: () => void
}

export default function BottleInput({
  open,
  mode,
  targetHint,
  onSubmit,
  onClose,
}: BottleInputProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      setText('')
      const t = setTimeout(() => {
        textareaRef.current?.focus()
      }, 120)
      return () => clearTimeout(t)
    }
  }, [open, mode])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if (text.trim().length > 0) {
          onSubmit(text.trim())
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, text, onSubmit, onClose])

  if (!open) return null

  const title = mode === 'throw' ? '投掷漂流瓶' : '写下你的回信'
  const sub =
    mode === 'throw'
      ? '把你的灵感或感悟写下来，让它漂向远方的有缘人～'
      : targetHint
        ? `回复：${targetHint}`
        : '给这位陌生人送上温暖的回信～'
  const placeholder =
    mode === 'throw'
      ? '在这里写下此刻最想分享的一句话、一段灵感、一个小秘密……'
      : '写下你想说的话，匿名回信将随瓶子一起漂回……'
  const submitLabel = mode === 'throw' ? '投入大海' : '发送回信'

  const canSubmit = text.trim().length > 0

  return (
    <div className="modal-mask" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="input-panel" role="dialog" aria-modal="true" aria-labelledby="input-title">
        <h3 id="input-title" className="input-title">{title}</h3>
        <p className="input-sub">{sub}</p>
        <textarea
          ref={textareaRef}
          className="input-textarea"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 500))}
          placeholder={placeholder}
          maxLength={500}
        />
        <div style={{ marginTop: 8, fontSize: 11, textAlign: 'right', color: 'rgba(240,248,255,0.6)' }}>
          {text.length}/500
        </div>
        <div className="input-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
          >
            取消
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canSubmit}
            onClick={() => canSubmit && onSubmit(text.trim())}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
