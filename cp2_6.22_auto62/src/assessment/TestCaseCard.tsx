import { CheckCircle2, XCircle } from 'lucide-react'
import type { TestCaseResult } from '@/assessment/types'

interface TestCaseCardProps {
  result: TestCaseResult
  index: number
  style?: React.CSSProperties
}

export default function TestCaseCard({ result, index, style }: TestCaseCardProps) {
  const failed = !result.passed

  return (
    <div
      className={`animate-slide-in ${failed ? 'animate-shake' : ''}`}
      style={{
        animationDelay: `${index * 0.15}s`,
        animationFillMode: 'both',
        ...style,
      }}
    >
      <div
        className={`rounded-lg border p-3 ${
          failed
            ? 'border-red-200'
            : 'border-gray-200'
        }`}
        style={{
          background: failed
            ? 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)'
            : '#ffffff',
        }}
      >
        <div className="flex items-center gap-2">
          {failed ? (
            <XCircle className="h-5 w-5 text-red-500 shrink-0" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          )}
          <span className="font-medium text-sm text-gray-800 flex-1 truncate">
            {result.name}
          </span>
          <span className="text-xs text-gray-400">{result.executionTime.toFixed(1)}ms</span>
        </div>

        {failed && (
          <div className="mt-3 space-y-1.5 text-xs font-mono border-t border-red-100 pt-2">
            <div className="flex gap-2">
              <span className="text-gray-500 w-16 shrink-0">输入:</span>
              <span className="text-gray-800">{result.input}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-16 shrink-0">期望:</span>
              <span className="text-green-700">{result.expected}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-16 shrink-0">实际:</span>
              <span className="text-red-700">{result.actual}</span>
            </div>
            {result.error && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-16 shrink-0">错误:</span>
                <span className="text-red-600">{result.error}</span>
              </div>
            )}
            {result.stackTrace && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-16 shrink-0">堆栈:</span>
                <pre className="text-red-500 whitespace-pre-wrap text-[10px] leading-tight">
                  {result.stackTrace}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
