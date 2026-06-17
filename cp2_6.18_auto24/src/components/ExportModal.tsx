import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { X, Copy, Check, FileCode } from 'lucide-react'
import { useLayoutStore } from '../store'
import { generateFullCss } from '../layoutEngine'

const KEYWORDS = ['@media', 'grid', 'flex', 'repeat', 'minmax', 'auto', 'min-width', 'max-width']

const RE_COMMENT = /^\/\*[\s\S]*?\*\//
const RE_STRING = /^"[^"]*"/
const RE_PROP = /^[a-zA-Z][a-zA-Z0-9-]*(?=\s*:)/
const RE_KEYWORD = new RegExp(
  '^(' + KEYWORDS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![a-zA-Z0-9-])'
)
const RE_NUMBER = /^-?\d+(?:\.\d+)?(?:px|fr|em|rem|%|s|ms)?(?![a-zA-Z0-9])/
const RE_PUNCT = /^[:;{}(),]/

function highlightCss(code: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = []
  let remaining = code
  let key = 0
  let plainBuffer = ''

  const flushPlain = () => {
    if (plainBuffer) {
      tokens.push(<React.Fragment key={key++}>{plainBuffer}</React.Fragment>)
      plainBuffer = ''
    }
  }

  while (remaining.length > 0) {
    let matched: { text: string; cls: string } | null = null

    const mComment = remaining.match(RE_COMMENT)
    if (mComment) {
      matched = { text: mComment[0], cls: 'code-comment' }
    }

    if (!matched) {
      const mStr = remaining.match(RE_STRING)
      if (mStr) {
        matched = { text: mStr[0], cls: 'code-string' }
      }
    }

    if (!matched) {
      const mProp = remaining.match(RE_PROP)
      if (mProp) {
        matched = { text: mProp[0], cls: 'code-prop' }
      }
    }

    if (!matched) {
      const mKw = remaining.match(RE_KEYWORD)
      if (mKw) {
        matched = { text: mKw[0], cls: 'code-keyword' }
      }
    }

    if (!matched) {
      const mNum = remaining.match(RE_NUMBER)
      if (mNum && mNum[0].length > 0) {
        matched = { text: mNum[0], cls: 'code-number' }
      }
    }

    if (!matched) {
      const mPunct = remaining.match(RE_PUNCT)
      if (mPunct) {
        matched = { text: mPunct[0], cls: 'code-punct' }
      }
    }

    if (matched) {
      flushPlain()
      tokens.push(
        <span key={key++} className={matched.cls}>
          {matched.text}
        </span>
      )
      remaining = remaining.slice(matched.text.length)
    } else {
      plainBuffer += remaining[0]
      remaining = remaining.slice(1)
    }
  }

  flushPlain()
  return tokens
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
