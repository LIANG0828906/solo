import type { TrackedTestCase } from '@/assessment/types'

interface TimeBarChartProps {
  testCases: TrackedTestCase[]
}

export default function TimeBarChart({ testCases }: TimeBarChartProps) {
  if (testCases.length === 0) return null

  const finished = testCases.filter(
    (t) => t.status === 'passed' || t.status === 'failed',
  )
  if (finished.length === 0) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-semibold mb-2" style={{ color: '#1a3a5c' }}>
          执行时间分布
        </div>
        <div className="text-xs text-gray-400 py-3 text-center border border-dashed border-gray-200 rounded-lg">
          暂无执行时间数据
        </div>
      </div>
    )
  }

  const maxTime = Math.max(...finished.map((tc) => tc.executionTime), 1)

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold mb-2" style={{ color: '#1a3a5c' }}>
        执行时间分布
      </div>
      {testCases.map((tc, i) => {
        const isFinished = tc.status === 'passed' || tc.status === 'failed'
        const pct = isFinished
          ? Math.max((tc.executionTime / maxTime) * 100, tc.executionTime > 0 ? 3 : 0)
          : 0
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-32 shrink-0 truncate">
              {tc.name}
            </span>
            <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${pct}%`,
                  background:
                    tc.status === 'passed'
                      ? 'linear-gradient(90deg, #1a3a5c, #2d5a8e)'
                      : tc.status === 'failed'
                      ? 'linear-gradient(90deg, #ff7f50, #ff9973)'
                      : tc.status === 'running'
                      ? 'linear-gradient(90deg, #60a5fa, #93c5fd)'
                      : '#e2e8f0',
                  opacity: tc.status === 'pending' ? 0.3 : 1,
                }}
              />
            </div>
            <span className="text-xs text-gray-500 w-16 text-right font-mono tabular-nums">
              {isFinished ? (
                <>
                  {tc.executionTime.toFixed(1)}
                  <span className="text-gray-400">ms</span>
                </>
              ) : tc.status === 'running' ? (
                <span style={{ color: '#2563eb' }}>运行中</span>
              ) : (
                <span className="text-gray-300">--</span>
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}
