import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import CodeEditor from '@/components/CodeEditor'
import OutputPanel from '@/components/OutputPanel'
import HistoryList from '@/components/HistoryList'
import HistoryChart from '@/components/HistoryChart'
import type { HistoryRecord, RunResult } from '@/types'

const STORAGE_KEY_USERID = 'code_platform_user_id'

const DEFAULT_CODE = `// 编写你的JavaScript代码
// 可以使用纯函数和console.log输出

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('斐波那契数列前10项:');
for (let i = 0; i < 10; i++) {
  console.log('fib(' + i + ') =', fibonacci(i));
}
`

export default function App() {
  const [userId, setUserId] = useState<string>('')
  const [code, setCode] = useState<string>(DEFAULT_CODE)
  const [result, setResult] = useState<RunResult | null>(null)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [history, setHistory] = useState<HistoryRecord[]>([])

  useEffect(() => {
    let uid = localStorage.getItem(STORAGE_KEY_USERID)
    if (!uid) {
      uid = uuidv4()
      localStorage.setItem(STORAGE_KEY_USERID, uid)
    }
    setUserId(uid)
  }, [])

  useEffect(() => {
    if (!userId) return
    fetch(`/api/history/${userId}`)
      .then((res) => res.json())
      .then((data: { records?: HistoryRecord[] }) => {
        if (data.records) {
          setHistory(data.records)
        }
      })
      .catch(() => {})
  }, [userId])

  const handleRun = async () => {
    if (isRunning) return
    setIsRunning(true)

    try {
      const runRes = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const runResult: RunResult = await runRes.json()
      setResult(runResult)

      const histRes = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          code,
          status: runResult.status,
          output: runResult.output,
          error: runResult.error,
        }),
      })
      const histResp: { id: string; timestamp: number } = await histRes.json()

      const newRecord: HistoryRecord = {
        id: histResp.id,
        userId,
        timestamp: histResp.timestamp,
        code,
        status: runResult.status,
        output: runResult.output,
        error: runResult.error,
      }
      setHistory((prev) => [newRecord, ...prev])
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setResult({
        status: 'error',
        output: '',
        error: `请求失败: ${message}`,
        executionTime: 0,
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        background: 'var(--bg-primary)',
      }}
    >
      <style>{`
        .app-container { display: flex; width: 100%; height: 100vh; }
        @media (max-width: 768px) { .app-container { flex-direction: column; } }
        .app-container {
          flex-direction: row;
        }
        @media (max-width: 768px) {
          .app-container { flex-direction: column; }
          .pane-left { width: 100% !important; height: 55% !important; }
          .pane-right { width: 100% !important; height: 45% !important; border-left: none !important; border-top: 1px solid var(--accent) !important; }
        }
        .pane-left {
          width: 70%;
          height: 100%;
          padding: 20px;
          gap: 20px;
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 0;
        }
        .pane-right {
          width: 30%;
          height: 100%;
          padding: 20px;
          border-left: 1px solid var(--accent);
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 0;
          gap: 16px;
        }
      `}</style>
      <div className="app-container">
        <div className="pane-left">
          <div style={{ flex: 1, minHeight: 0 }}>
            <CodeEditor
              code={code}
              onChange={setCode}
              onRun={handleRun}
              isRunning={isRunning}
            />
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <OutputPanel result={result} />
          </div>
        </div>

        <div className="pane-right">
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              在线代码评测
            </h2>
            <span
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                opacity: 0.6,
                fontFamily: "'Courier New', monospace",
              }}
            >
              UID: {userId.slice(0, 8)}
            </span>
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>
            <HistoryList records={history} />
          </div>

          <HistoryChart userId={userId} />
        </div>
      </div>
    </div>
  )
}
