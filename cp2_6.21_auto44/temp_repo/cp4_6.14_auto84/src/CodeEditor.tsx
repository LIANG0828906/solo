import { memo, useRef, useEffect } from 'react'
import { highlightKeywords } from './StepRunner'

export interface CodeEditorProps {
  code: string
  onChange: (code: string) => void
  currentLineNumber?: number
}

function CodeEditorImpl({ code, onChange, currentLineNumber }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLPreElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)

  const lines = code.split('\n')
  const lineNumbers: number[] = []
  for (let i = 1; i <= lines.length; i++) lineNumbers.push(i)

  const handleScroll = () => {
    const ta = textareaRef.current
    const hi = highlightRef.current
    const gu = gutterRef.current
    if (ta && hi) {
      hi.scrollTop = ta.scrollTop
      hi.scrollLeft = ta.scrollLeft
    }
    if (ta && gu) {
      gu.scrollTop = ta.scrollTop
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }, [])

  return (
    <div className="code-editor">
      <div className="code-editor-header">
        <span className="code-editor-title">
          <span className="code-editor-dot" style={{ background: '#ef4444' }} />
          <span className="code-editor-dot" style={{ background: '#f59e0b' }} />
          <span className="code-editor-dot" style={{ background: '#22c55e' }} />
          <span className="code-editor-filename">script.js</span>
        </span>
        <span className="code-editor-status">
          {currentLineNumber ? `行 ${currentLineNumber}` : `${lines.length} 行`}
        </span>
      </div>
      <div className="code-editor-body">
        <div className="code-editor-gutter" ref={gutterRef}>
          {lineNumbers.map(n => (
            <div
              key={n}
              className={`code-gutter-line ${n === currentLineNumber ? 'active-line' : ''}`}
            >
              {n}
            </div>
          ))}
        </div>
        <div className="code-editor-area">
          <pre
            className="code-highlight-layer"
            ref={highlightRef}
            aria-hidden="true"
          >
            <code
              dangerouslySetInnerHTML={{
                __html: highlightKeywords(code) || '\n',
              }}
            />
          </pre>
          <textarea
            ref={textareaRef}
            className="code-textarea"
            value={code}
            onChange={e => onChange(e.target.value)}
            onScroll={handleScroll}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            placeholder="在此输入或粘贴 JavaScript 代码...

示例：
let sum = 0;
for (let i = 1; i <= 10; i++) {
  sum = sum + i;
}
console.log(sum);"
          />
        </div>
      </div>
    </div>
  )
}

export const CodeEditor = memo(CodeEditorImpl)
