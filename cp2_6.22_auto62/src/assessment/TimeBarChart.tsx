import type { TestCaseResult } from '@/assessment/types'

interface TimeBarChartProps {
  testCases: TestCaseResult[]
}

export default function TimeBarChart({ testCases }: TimeBarChartProps) {
  if (testCases.length === 0) return null

  const maxTime = Math.max(...testCases.map((tc) => tc.executionTime), 1)

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700 mb-2">执行时间</div>
      {testCases.map((tc, i) => {
        const pct = (tc.executionTime / maxTime) * 100
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-28 shrink-0 truncate">
              {tc.name}
            </span>
            <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${pct}%`,
                  background: tc.passed ? '#1a3a5c' : '#ff7f50',
                }}
              />
            </div>
            <span className="text-xs text-gray-500 w-14 text-right">
              {tc.executionTime.toFixed(1)}ms
            </span>
          </div>
        )
      })}
    </div>
  )
}
