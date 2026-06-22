import { CheckCircle2, XCircle, Circle, Loader2, Clock } from 'lucide-react'
import type { TrackedTestCase } from '@/assessment/types'

interface TestCaseCardProps {
  tc: TrackedTestCase
  index: number
  style?: React.CSSProperties
}

const statusConfig = {
  pending: {
    icon: Clock,
    iconColor: '#94a3b8',
    labelBg: '#f1f5f9',
    labelColor: '#64748b',
    label: '等待中',
    borderColor: '#e2e8f0',
    cardBg: '#ffffff',
    iconAnim: 'animate-pulse',
  },
  running: {
    icon: Loader2,
    iconColor: '#2563eb',
    labelBg: '#eff6ff',
    labelColor: '#2563eb',
    label: '执行中',
    borderColor: '#93c5fd',
    cardBg: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
    iconAnim: 'animate-spin',
  },
  passed: {
    icon: CheckCircle2,
    iconColor: '#16a34a',
    labelBg: '#f0fdf4',
    labelColor: '#16a34a',
    label: '已通过',
    borderColor: '#bbf7d0',
    cardBg: '#ffffff',
    iconAnim: '',
  },
  failed: {
    icon: XCircle,
    iconColor: '#dc2626',
    labelBg: '#fef2f2',
    labelColor: '#dc2626',
    label: '未通过',
    borderColor: '#fecaca',
    cardBg: 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)',
    iconAnim: '',
  },
} as const

export default function TestCaseCard({ tc, index, style }: TestCaseCardProps) {
  const cfg = statusConfig[tc.status]
  const finished = tc.status === 'passed' || tc.status === 'failed'
  const failed = tc.status === 'failed'
  const Icon = cfg.icon

  return (
    <div
      className={`animate-slide-in ${failed ? 'animate-shake' : ''}`}
      style={{
        animationDelay: tc.status === 'pending' ? '0s' : `${index * 0.08}s`,
        animationFillMode: 'both',
        ...style,
      }}
    >
      <div
        className="rounded-lg border p-3.5 transition-all duration-300"
        style={{
          borderColor: cfg.borderColor,
          background: cfg.cardBg,
          boxShadow:
            tc.status === 'running'
              ? '0 0 0 3px rgba(37, 99, 235, 0.08)'
              : 'none',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="shrink-0 flex items-center justify-center">
            <Icon
              className={`h-5 w-5 ${cfg.iconAnim}`}
              style={{ color: cfg.iconColor }}
            />
          </div>

          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="font-medium text-sm text-gray-800 truncate flex-1">
              {tc.name}
            </span>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
              style={{ background: cfg.labelBg, color: cfg.labelColor }}
            >
              {cfg.label}
            </span>
          </div>

          <div className="shrink-0 text-right min-w-[60px]">
            {finished ? (
              <div className="flex flex-col items-end">
                <span className="text-xs font-mono font-semibold tabular-nums" style={{ color: '#1a3a5c' }}>
                  {tc.executionTime.toFixed(1)}
                </span>
                <span className="text-[10px] text-gray-400">毫秒</span>
              </div>
            ) : tc.status === 'running' ? (
              <span
                className="inline-flex items-center gap-1 text-xs font-medium"
                style={{ color: '#2563eb' }}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full animate-ping"
                  style={{ background: '#2563eb' }}
                />
                运行中
              </span>
            ) : (
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-300 font-mono">--</span>
                <span className="text-[10px] text-gray-300">毫秒</span>
              </div>
            )}
          </div>
        </div>

        {failed && tc.actual !== undefined && (
          <div
            className="mt-3 space-y-1.5 text-xs font-mono border-t border-red-100 pt-2.5"
          >
            <div className="flex gap-2">
              <span className="text-gray-500 w-14 shrink-0">输入:</span>
              <span className="text-gray-800">{tc.input}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-14 shrink-0">期望:</span>
              <span className="text-green-700">{tc.expected}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-14 shrink-0">实际:</span>
              <span className="text-red-700 break-all">{tc.actual}</span>
            </div>
            {tc.error && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-14 shrink-0">错误:</span>
                <span className="text-red-600">{tc.error}</span>
              </div>
            )}
            {tc.stackTrace && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-14 shrink-0">堆栈:</span>
                <pre className="text-red-500 whitespace-pre-wrap text-[10px] leading-tight break-all max-h-20 overflow-auto">
                  {tc.stackTrace}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
