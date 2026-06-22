import { useState, useRef, useCallback, useEffect } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { useEvaluationStore } from '@/assessment/store'
import { Send, Loader2, Code2 } from 'lucide-react'

const extensionsMap = {
  javascript: [javascript()],
  python: [python()],
} as const

const languageInfo = {
  javascript: { label: 'JavaScript', ext: '.js', hint: '支持 Node.js 语法' },
  python: { label: 'Python', ext: '.py', hint: '语法高亮预览' },
} as const

export default function SubmissionPanel() {
  const {
    code,
    language,
    status,
    setCode,
    setLanguage,
    setStatus,
    setEvaluationId,
    applyTestCaseResult,
    setSummary,
    setDiff,
    initTrackedCases,
    reset,
  } = useEvaluationStore()
  const [error, setError] = useState('')
  const wsRef = useRef<WebSocket | null>(null)

  const validate = useCallback(() => {
    if (!code.trim()) {
      setError('代码不能为空')
      return false
    }
    if (language === 'javascript' && !code.includes('function')) {
      setError('代码必须包含 function 关键字')
      return false
    }
    if (language === 'python' && !code.includes('def ')) {
      setError('代码必须包含 def 关键字定义函数')
      return false
    }
    setError('')
    return true
  }, [code, language])

  const connectWs = useCallback(
    (evalId: string) => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      const wsUrl = `ws://${window.location.hostname}:3001/ws`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'status') {
            setStatus(data.status)
          } else if (data.type === 'testResult') {
            const idx = typeof data.index === 'number' ? data.index : 0
            applyTestCaseResult(idx, data.testCase)
          } else if (data.type === 'summary') {
            setSummary(data.summary)
            if (data.diff) setDiff(data.diff)
          }
        } catch {
          // ignore
        }
      }

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'subscribe', evaluationId: evalId }))
      }
    },
    [setStatus, applyTestCaseResult, setSummary, setDiff],
  )

  const handleSubmit = useCallback(async () => {
    if (!validate()) return

    reset()
    initTrackedCases()

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          assignmentId: 'factorial-001',
        }),
      })

      if (!res.ok) throw new Error('提交失败')

      const data = await res.json()
      setEvaluationId(data.evaluationId)
      setStatus('queued')
      connectWs(data.evaluationId)
    } catch {
      setError('提交失败，请检查网络连接')
    }
  }, [
    code,
    language,
    validate,
    reset,
    initTrackedCases,
    setEvaluationId,
    setStatus,
    connectWs,
  ])

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [])

  const isSubmitting = status === 'queued' || status === 'running'

  return (
    <div className="flex flex-col h-full bg-white">
      <div
        className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-2.5 border-b border-gray-200"
        style={{ background: '#f8fafc' }}
      >
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4" style={{ color: '#1a3a5c' }} />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'javascript' | 'python')}
            disabled={isSubmitting}
            className="text-sm border border-gray-300 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-700 disabled:opacity-60 font-medium"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
          </select>
          <span className="text-[11px] font-mono text-gray-400 px-1.5 py-0.5 rounded border border-gray-200 bg-white">
            {languageInfo[language].ext}
          </span>
        </div>
        <div className="flex-1 flex items-center justify-between min-w-0">
          <span className="text-[11px] text-gray-400 truncate hidden sm:inline">
            {languageInfo[language].hint}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-mono shrink-0"
            style={{ background: '#eef2f7', color: '#1a3a5c' }}
          >
            factorial-001
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <CodeMirror
          value={code}
          onChange={setCode}
          extensions={extensionsMap[language]}
          theme="light"
          height="100%"
          readOnly={isSubmitting}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            bracketMatching: true,
            closeBrackets: true,
            indentOnInput: true,
          }}
        />
      </div>

      {error && (
        <div className="px-4 py-2 text-sm text-red-600 bg-red-50 border-t border-red-100">
          {error}
        </div>
      )}

      <div
        className="px-4 py-3 border-t border-gray-200 flex items-center gap-3"
        style={{ background: '#f8fafc' }}
      >
        <div className="text-xs text-gray-400 flex-1 min-w-0 truncate">
          {code.length > 0 ? (
            <>
              <span className="font-mono">{code.split('\n').length} 行</span>
              <span className="mx-1.5">·</span>
              <span className="font-mono">{code.length} 字符</span>
            </>
          ) : (
            '请在编辑器中输入代码'
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-lg text-white font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98] shrink-0"
          style={{ background: isSubmitting ? '#94a3b8' : '#ff7f50' }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {status === 'queued' ? '排队中...' : '评测中...'}
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              提交评测
            </>
          )}
        </button>
      </div>
    </div>
  )
}
