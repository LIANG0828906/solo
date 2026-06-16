import { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from '@codemirror/view'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { indentOnInput, bracketMatching, foldGutter } from '@codemirror/language'
import { closeBrackets, closeBracketsKeymap, autocompletion } from '@codemirror/autocomplete'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { Play, Send } from 'lucide-react'
import type { Language, TestStatus } from '@/types'

const darkTheme = EditorView.theme({
  '&': {
    backgroundColor: '#2b2b3d',
    color: '#cdd6f4',
    height: '100%',
  },
  '.cm-content': {
    caretColor: '#89b4fa',
    fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
  },
  '.cm-gutters': {
    backgroundColor: '#2b2b3d',
    borderRight: '1px solid #45475a',
    color: '#6c7086',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#363650',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(137, 180, 250, 0.05)',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(137, 180, 250, 0.2) !important',
  },
  '.cm-cursor': {
    borderLeftColor: '#89b4fa',
  },
}, { dark: true })

interface CodeEditorPanelProps {
  initialCode: string
  language: Language
  onRun: () => void
  onSubmit: () => void
  isRunning: boolean
  isSubmitting: boolean
  output: string
  error: string | null
  testStatus: TestStatus[]
  onLanguageChange: (lang: Language) => void
}

const testStatusColors: Record<TestStatus, string> = {
  pending: '#45475a',
  running: '#89b4fa',
  passed: '#a6e3a1',
  failed: '#f38ba8',
}

export default function CodeEditorPanel({
  initialCode,
  language,
  onRun,
  onSubmit,
  isRunning,
  isSubmitting,
  output,
  error,
  testStatus,
  onLanguageChange,
}: CodeEditorPanelProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    const langExtension = language === 'javascript' ? javascript() : python()

    const state = EditorState.create({
      doc: initialCode,
      extensions: [
        darkTheme,
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        foldGutter(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        highlightSelectionMatches(),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
        ]),
        langExtension,
        EditorView.lineWrapping,
      ],
    })

    const view = new EditorView({
      state,
      parent: editorRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [language, initialCode])

  const getCode = () => viewRef.current?.state.doc.toString() ?? ''

  const hasOutput = output.length > 0 || error !== null

  return (
    <div className="flex h-full flex-col bg-bg-card rounded-content overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#45475a] px-4 py-2">
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as Language)}
          className="rounded-md border border-[#45475a] bg-bg-hover px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
        </select>

        <div className="flex items-center gap-2">
          <button
            onClick={onRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-bg transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            <Play size={14} />
            {isRunning ? '运行中...' : '运行代码'}
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-md bg-success px-3 py-1.5 text-sm font-medium text-bg transition-colors hover:opacity-80 disabled:opacity-50"
          >
            <Send size={14} />
            {isSubmitting ? '提交中...' : '提交'}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden" ref={editorRef} />

      {testStatus.length > 0 && (
        <div className="flex items-center gap-2 border-t border-[#45475a] px-4 py-2">
          <span className="text-xs text-text-secondary">测试用例:</span>
          <div className="flex items-center gap-1.5">
            {testStatus.map((status, i) => (
              <span
                key={i}
                className="inline-block h-3 w-3 rounded-full animate-dot-pulse"
                style={{
                  backgroundColor: testStatusColors[status],
                  animationPlayState: status === 'running' ? 'running' : 'paused',
                  opacity: status === 'pending' ? 0.5 : 1,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {hasOutput && (
        <div className="animate-slide-in border-t border-[#45475a] px-4 py-3 max-h-48 overflow-auto">
          <pre className="font-mono text-sm whitespace-pre-wrap" style={{ fontFamily: "'Fira Code', monospace" }}>
            {error ? (
              <span className="text-error">{error}</span>
            ) : (
              <span className="text-text-primary">{output}</span>
            )}
          </pre>
        </div>
      )}
    </div>
  )
}
