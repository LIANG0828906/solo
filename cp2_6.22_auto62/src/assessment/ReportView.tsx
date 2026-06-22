import { useEffect, useRef } from 'react'
import { useEvaluationStore } from '@/assessment/store'
import StatusIndicator from '@/assessment/StatusIndicator'
import TestCaseCard from '@/assessment/TestCaseCard'
import ScoreCircle from '@/assessment/ScoreCircle'
import TimeBarChart from '@/assessment/TimeBarChart'
import DiffView from '@/assessment/DiffView'
import { Clock, Cpu, CheckCircle2, Loader } from 'lucide-react'

export default function ReportView() {
  const { status, trackedCases, summary, diff, setCaseStatus } = useEvaluationStore()
  const lastRunIdxRef = useRef<number>(-1)

  useEffect(() => {
    if (status !== 'running') {
      lastRunIdxRef.current = -1
      return
    }
    const completedCount = trackedCases.filter(
      (t) => t.status === 'passed' || t.status === 'failed',
    ).length
    const nextIdx = completedCount
    if (
      nextIdx < trackedCases.length &&
      trackedCases[nextIdx]?.status === 'pending' &&
      lastRunIdxRef.current !== nextIdx
    ) {
      lastRunIdxRef.current = nextIdx
      setCaseStatus(nextIdx, 'running')
    }
  }, [trackedCases, status, setCaseStatus])

  const completed = trackedCases.filter(
    (t) => t.status === 'passed' || t.status === 'failed',
  )
  const passedCount = trackedCases.filter((t) => t.status === 'passed').length

  const progressPct =
    trackedCases.length > 0 ? Math.round((completed.length / trackedCases.length) * 100) : 0

  const showCaseList = trackedCases.length > 0

  return (
    <div className="h-full overflow-y-auto p-5 space-y-5">
      <StatusIndicator status={status} />

      {showCaseList && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold" style={{ color: '#1a3a5c' }}>
                测试用例执行
              </h3>
              <span
                className="text-[11px] font-mono px-2 py-0.5 rounded-full"
                style={{ background: '#eef2f7', color: '#1a3a5c' }}
              >
                {passedCount}/{trackedCases.length} 通过
              </span>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              {status === 'running' ? (
                <>
                  <Loader className="h-3 w-3 animate-spin" style={{ color: '#2563eb' }} />
                  <span style={{ color: '#2563eb' }}>执行中 {progressPct}%</span>
                </>
              ) : status === 'completed' ? (
                <>
                  <CheckCircle2 className="h-3 w-3" style={{ color: '#16a34a' }} />
                  <span style={{ color: '#16a34a' }}>全部完成</span>
                </>
              ) : (
                <span>排队中...</span>
              )}
            </div>
          </div>

          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progressPct}%`,
                background:
                  status === 'completed'
                    ? 'linear-gradient(90deg, #16a34a, #22c55e)'
                    : 'linear-gradient(90deg, #2563eb, #3b82f6)',
              }}
            />
          </div>

          <div className="space-y-2">
            {trackedCases.map((tc, i) => (
              <TestCaseCard key={tc.name + i} tc={tc} index={i} />
            ))}
          </div>
        </div>
      )}

      {status === 'completed' && summary && (
        <div className="space-y-5 animate-slide-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#1a3a5c' }}>
              评分摘要
            </h3>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ScoreCircle
                score={summary.score}
                passed={summary.passed}
                total={summary.total}
              />
              <div className="flex flex-col gap-3 flex-1 w-full sm:w-auto">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" style={{ color: '#1a3a5c' }} />
                  <span className="text-gray-500 w-16 shrink-0">执行耗时</span>
                  <span
                    className="font-mono font-semibold px-2 py-0.5 rounded"
                    style={{ background: '#eef2f7', color: '#1a3a5c' }}
                  >
                    {summary.executionTime.toFixed(1)} ms
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Cpu className="h-4 w-4" style={{ color: '#1a3a5c' }} />
                  <span className="text-gray-500 w-16 shrink-0">内存占用</span>
                  <span
                    className="font-mono font-semibold px-2 py-0.5 rounded"
                    style={{ background: '#eef2f7', color: '#1a3a5c' }}
                  >
                    {summary.maxMemory} KB
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <TimeBarChart testCases={trackedCases} />
          </div>

          {diff.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <DiffView diff={diff} />
            </div>
          )}
        </div>
      )}

      {status === 'idle' && trackedCases.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <svg
            className="w-20 h-20 mb-5 opacity-30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-sm">提交代码以开始评测</span>
          <span className="text-xs mt-1 text-gray-300">在左侧编辑器中编写代码并点击提交</span>
        </div>
      )}
    </div>
  )
}
