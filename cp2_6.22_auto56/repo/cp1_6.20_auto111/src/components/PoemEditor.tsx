import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  setTitle,
  setAuthor,
  selectLine,
  updateLineText,
  addLine,
  deleteLine,
  addParagraph,
} from '@/store/poemStore'
import type { RootState } from '@/store/poemStore'
import type { PoemLine } from '@/types'
import LineStylePanel from './LineStylePanel'
import ThemeSelector from './ThemeSelector'

const PoemEditor: React.FC = () => {
  const dispatch = useDispatch()
  const currentPoem = useSelector((state: RootState) => state.poem.currentPoem)
  const selectedLineId = useSelector((state: RootState) => state.poem.selectedLineId)

  useEffect(() => {
    if (currentPoem && currentPoem.paragraphs.length > 0 && currentPoem.paragraphs[0].lines.length > 0) {
      dispatch(selectLine(currentPoem.paragraphs[0].lines[0].id))
    }
  }, [dispatch])

  const handleLineClick = (lineId: string) => {
    dispatch(selectLine(lineId))
  }

  const handleLineDoubleClick = (lineId: string) => {
    dispatch(selectLine(lineId))
  }

  const handleLineChange = (lineId: string, text: string) => {
    dispatch(updateLineText({ lineId, text }))
  }

  const handleKeyDown = (e: React.KeyboardEvent, lineId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      dispatch(addLine({ afterLineId: lineId }))
    } else if (e.key === 'Backspace') {
      const line = findLineById(lineId)
      if (line && line.text === '' && getLineCount() > 1) {
        e.preventDefault()
        dispatch(deleteLine(lineId))
      }
    }
  }

  const findLineById = (lineId: string): PoemLine | undefined => {
    if (!currentPoem) return undefined
    for (const paragraph of currentPoem.paragraphs) {
      const line = paragraph.lines.find(l => l.id === lineId)
      if (line) return line
    }
    return undefined
  }

  const getLineCount = (): number => {
    if (!currentPoem) return 0
    return currentPoem.paragraphs.reduce((sum, p) => sum + p.lines.length, 0)
  }

  const getSelectedLine = (): PoemLine | undefined => {
    if (!selectedLineId) return undefined
    return findLineById(selectedLineId)
  }

  if (!currentPoem) {
    return (
      <div style={emptyStyle}>
        <p>正在加载...</p>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <input
          type="text"
          value={currentPoem.title}
          onChange={(e) => dispatch(setTitle(e.target.value))}
          placeholder="诗歌标题"
          style={titleInputStyle}
        />
        <input
          type="text"
          value={currentPoem.author}
          onChange={(e) => dispatch(setAuthor(e.target.value))}
          placeholder="作者"
          style={authorInputStyle}
        />
      </div>

      <ThemeSelector />

      <div style={editorContentStyle}>
        {currentPoem.paragraphs.map((paragraph, pIndex) => (
          <div key={paragraph.id} style={paragraphStyle}>
            {paragraph.lines.map((line) => (
              <div
                key={line.id}
                onClick={() => handleLineClick(line.id)}
                onDoubleClick={() => handleLineDoubleClick(line.id)}
                style={{
                  ...lineContainerStyle,
                  borderColor: selectedLineId === line.id ? 'var(--accent)' : 'transparent',
                  backgroundColor: selectedLineId === line.id ? 'rgba(45, 90, 75, 0.05)' : 'transparent',
                }}
              >
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => handleLineChange(line.id, e.currentTarget.textContent || '')}
                  onKeyDown={(e) => handleKeyDown(e, line.id)}
                  style={{
                    ...editableStyle,
                    fontFamily: line.style.fontFamily,
                    fontSize: `${line.style.fontSize}px`,
                    color: line.style.color,
                    lineHeight: line.style.lineHeight,
                    textAlign: line.style.textAlign,
                    background: line.style.background || 'transparent',
                  }}
                >
                  {line.text}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={toolbarStyle}>
        <button
          className="btn btn-secondary"
          onClick={() => dispatch(addParagraph())}
          style={{ fontSize: 13 }}
        >
          + 添加段落
        </button>
        <div style={{ flex: 1 }} />
        <span style={hintStyle}>
          提示：按Enter添加新行，Backspace删除空行，双击编辑样式
        </span>
      </div>

      {getSelectedLine() && (
        <LineStylePanel
          lineId={selectedLineId!}
          currentStyle={getSelectedLine()!.style}
        />
      )}
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: 'var(--bg-secondary)',
}

const headerStyle: React.CSSProperties = {
  padding: '20px 24px 16px',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const titleInputStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 600,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
}

const authorInputStyle: React.CSSProperties = {
  fontSize: 14,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontFamily: 'inherit',
}

const editorContentStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}

const paragraphStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const lineContainerStyle: React.CSSProperties = {
  borderRadius: 8,
  border: '2px solid transparent',
  padding: '4px 8px',
  cursor: 'text',
  transition: 'all 0.2s ease',
}

const editableStyle: React.CSSProperties = {
  minHeight: '1.5em',
  padding: '4px 8px',
  outline: 'none',
  borderRadius: 6,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  transition: 'all 0.2s ease',
}

const toolbarStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderTop: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}

const hintStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-secondary)',
  opacity: 0.7,
}

const emptyStyle: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-secondary)',
}

export default PoemEditor
