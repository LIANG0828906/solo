import { useEvaluationStore } from '@/assessment/store'
import StatusIndicator from '@/assessment/StatusIndicator'
import TestCaseCard from '@/assessment/TestCaseCard'
import ScoreCircle from '@/assessment/ScoreCircle'
import TimeBarChart from '@/assessment/TimeBarChart'
import DiffView from '@/assessment/DiffView'
import { Clock, Cpu } from 'lucide-react'

export default function ReportView() {
  const { status, testCases, summary, diff } = useEvaluationStore()

  return (
    <div className="h-full overflow-y-auto p-5 space-y-5">
      <StatusIndicator status={status} />

      {testCases.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold" style={{ color: '#1a3a5c' }}>测试用例结果</h3>
          {testCases.map((tc, i) => (
            <TestCaseCard key={tc.name + i} result={tc} index={i} />
          ))}
        </div>
      )}

      {status === 'completed' && summary && (
        <div className="space-y-5 animate-slide-in" style={{ animationDelay: `${testCases.length * 0.15}s`, animationFillMode: 'both' }}>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#1a3a5c' }}>评分摘要</h3>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ScoreCircle
                score={summary.score}
                passed={summary.passed}
                total={summary.total}
              />
              <div className="flex flex-col gap-3 flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" style={{ color: '#1a3a5c' }} />
                  <span className="text-gray-500">执行耗时</span>
                  <span className="font-mono font-semibold" style={{ color: '#1a3a5c' }}>
                    {summary.executionTime.toFixed(1)} ms
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Cpu className="h-4 w-4" style={{ color: '#1a3a5c' }} />
                  <span className="text-gray-500">内存占用</span>
                  <span className="font-mono font-semibold" style={{ color: '#1a3a5c' }}>
                    {summary.maxMemory} KB
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <TimeBarChart testCases={testCases} />
          </div>

          {diff.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <DiffView diff={diff} />
            </div>
          )}
        </div>
      )}

      {status === 'idle' && testCases.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <svg className="w-20 h-20 mb-5 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm">提交代码以开始评测</span>
          <span className="text-xs mt-1 text-gray-300">在左侧编辑器中编写代码并点击提交</span>
        </div>
      )}
    </div>
  )
}
