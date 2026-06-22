import { useState, useRef, useCallback, useEffect } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { useEvaluationStore } from '@/assessment/store'
import { Send, Loader2 } from 'lucide-react'

const langExtensions: Record<string, ReturnType<typeof javascript> | ReturnType<typeof python>> = {
  javascript: javascript(),
  python: python(),
}

export default function SubmissionPanel() {
  const { code, language, status, setCode, setLanguage, setStatus, setEvaluationId, addTestCaseResult, setSummary, setDiff, reset } = useEvaluationStore()
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
    setError('')
    return true
  }, [code, language])

  const connectWs = useCallback((evalId: string) => {
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
          addTestCaseResult(data.testCase)
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
  }, [setStatus, addTestCaseResult, setSummary, setDiff])

  const handleSubmit = useCallback(async () => {
    if (!validate()) return

    reset()

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, assignmentId: 'factorial-001' }),
      })

      if (!res.ok) throw new Error('提交失败')

      const data = await res.json()
      setEvaluationId(data.evaluationId)
      setStatus('queued')
      connectWs(data.evaluationId)
    } catch {
      setError('提交失败，请检查网络连接')
    }
  }, [code, language, validate, reset, setEvaluationId, setStatus, connectWs])

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
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-200" style={{ background: '#f8fafc' }}>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'javascript' | 'python')}
          className="text-sm border border-gray-300 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-700"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
        </select>
        <div className="flex-1" />
        <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: '#eef2f7', color: '#1a3a5c' }}>
          factorial-001
        </span>
      </div>

      <div className="flex-1 overflow-hidden">
        <CodeMirror
          value={code}
          onChange={setCode}
          extensions={[langExtensions[language] || javascript()]}
          theme="light"
          height="100%"
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

      <div className="px-4 py-3 border-t border-gray-200" style={{ background: '#f8fafc' }}>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-2.5 rounded-lg text-white font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98]"
          style={{ background: isSubmitting ? '#94a3b8' : '#ff7f50' }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              评测中...
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
