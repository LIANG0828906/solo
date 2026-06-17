import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { X, Copy, Check, FileCode } from 'lucide-react'
import { useLayoutStore } from '../store'
import { generateFullCss } from '../layoutEngine'

const KEYWORDS = ['@media', 'grid', 'flex', 'repeat', 'minmax', 'auto', 'min-width', 'max-width']
const PROPS = [
  'display',
  'grid-template-columns',
  'gap',
  'padding',
  'margin',
  'flex',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'background',
  'border-radius',
  'box-shadow',
  'overflow',
  'transition',
  'transform',
  'min-width',
  'max-width',
  'width',
  'height',
  'opacity',
  'cursor',
  'position',
]

function highlightCss(code: string): React.ReactNode[] {
  const lines = code.split('\n')
  return lines.map((line, i) => {
    const tokens: React.ReactNode[] = []
    let remaining = line
    let key = 0

    const pushPlain = (text: string) => {
      if (text) tokens.push(<React.Fragment key={key++}>{text}</React.Fragment>)
    }

    if (remaining.trim().startsWith('/*') || remaining.trim().startsWith('*')) {
      tokens.push(
        <span key={key++} className="code-comment">
          {remaining}
        </span>
      )
      return (
        <React.Fragment key={i}>
          {tokens}
          {'\n'}
        </React.Fragment>
      )
    }

    while (remaining.length > 0) {
      let matched: { text: string; cls: string; len: number } | null = null

      const commentMatch = remaining.match(/^\/\*[\s\S]*?\*\//)
      if (commentMatch) {
        matched = { text: commentMatch[0], cls: 'code-comment', len: commentMatch[0].length }
      }

      if (!matched) {
        for (const kw of KEYWORDS) {
          if (remaining.startsWith(kw)) {
            matched = { text: kw, cls: 'code-keyword', len: kw.length }
            break
          }
        }
      }

      if (!matched) {
        const numMatch = remaining.match(/^-?\d+(\.\d+)?(px|fr|em|rem|%|s|ms)?/)
        if (numMatch && numMatch.index === 0 && !/[A-Za-z#]/.test(remaining[numMatch[0].length] ?? '')) {
          const prev = line.slice(0, line.length - remaining.length)
          const before = prev.slice(-1)
          if (!/[a-zA-Z-]/.test(before)) {
            matched = { text: numMatch[0], cls: 'code-number', len: numMatch[0].length }
          }
        }
      }

      if (!matched) {
        const strMatch = remaining.match(/^"[^"]*"/)
        if (strMatch) {
          matched = { text: strMatch[0], cls: 'code-string', len: strMatch[0].length }
        }
      }

      if (!matched) {
        for (const prop of PROPS) {
          if (remaining.startsWith(prop) && remaining[prop.length] === ':') {
            matched = { text: prop, cls: 'code-prop', len: prop.length }
            break
          }
        }
      }

      if (!matched) {
        const punctMatch = remaining.match(/^[:;{}()[\],]/)
        if (punctMatch) {
          matched = { text: punctMatch[0], cls: 'code-punct', len: 1 }
        }
      }

      if (matched) {
        tokens.push(
          <span key={key++} className={matched.cls}>
            {matched.text}
          </span>
        )
        remaining = remaining.slice(matched.len)
      } else {
        pushPlain(remaining[0])
        remaining = remaining.slice(1)
      }
    }

    return (
      <React.Fragment key={i}>
        {tokens}
        {'\n'}
      </React.Fragment>
    )
  })
}

export const ExportModal = memo(function ExportModal() {
  const open = useLayoutStore((s) => s.exportModalOpen)
  const close = useLayoutStore((s) => s.closeExportModal)
  const breakpoints = useLayoutStore((s) => s.breakpoints)
  const grid = useLayoutStore((s) => s.grid)
  const flex = useLayoutStore((s) => s.flex)

  const [copied, setCopied] = useState(false)

  const css = useMemo(
    () => generateFullCss({ breakpoints, grid, flex }),
    [breakpoints, grid, flex]
  )

  const highlighted = useMemo(() => highlightCss(css), [css])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(css)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = css
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1800)
      } finally {
        document.body.removeChild(ta)
      }
    }
  }, [css])

  useEffect(() => {
    if (!open) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [open, close])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FileCode size={18} color="#3B82F6" />
            <span>导出响应式布局 CSS</span>
          </div>
          <button type="button" className="modal-close" onClick={close} title="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <pre className="code-block" aria-label="Generated CSS code">
            <code>{highlighted}</code>
          </pre>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={close}>
            关闭
          </button>
          <button
            type="button"
            className={`btn-copy ${copied ? 'success' : ''}`}
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check size={14} /> 已复制!
              </>
            ) : (
              <>
                <Copy size={14} /> 复制到剪贴板
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
})
