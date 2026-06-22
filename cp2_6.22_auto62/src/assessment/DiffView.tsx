import type { CodeDiff } from '@/assessment/types'

interface DiffViewProps {
  diff: CodeDiff[]
}

const typeConfig: Record<string, { bg: string; border: string; prefix: string; label: string }> = {
  added: { bg: '#e6ffed', border: '#28a745', prefix: '+', label: '新增' },
  removed: { bg: '#ffeef0', border: '#cb2431', prefix: '-', label: '缺失' },
  modified: { bg: '#fff8c5', border: '#e3b341', prefix: '~', label: '修改' },
}

export default function DiffView({ diff }: DiffViewProps) {
  if (diff.length === 0) {
    return (
      <div className="text-center text-gray-400 py-6 text-sm">
        代码与参考答案一致，未发现差异
      </div>
    )
  }

  return (
    <div>
      <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between" style={{ background: '#f8fafc' }}>
        <span className="text-sm font-semibold" style={{ color: '#1a3a5c' }}>代码差异对比</span>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#28a745' }} /> 新增</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#cb2431' }} /> 缺失</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#e3b341' }} /> 修改</span>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {diff.map((item, i) => {
          const cfg = typeConfig[item.type]
          return (
            <div
              key={i}
              className="flex items-stretch"
              style={{ background: cfg.bg }}
            >
              <div
                className="w-1.5 shrink-0"
                style={{ background: cfg.border }}
              />
              <div className="flex-1 flex items-start px-3 py-2 font-mono text-xs">
                <span className="text-gray-400 w-8 shrink-0 text-right mr-2">
                  {item.lineNumber}
                </span>
                <span
                  className="font-bold mr-2 w-4"
                  style={{ color: cfg.border }}
                >
                  {cfg.prefix}
                </span>
                <span className="text-gray-800 flex-1 whitespace-pre-wrap leading-relaxed">
                  {item.content}
                </span>
                {item.suggestion && (
                  <span
                    className="ml-2 px-2 py-0.5 rounded-full text-[10px] shrink-0 whitespace-nowrap"
                    style={{ background: 'rgba(255,255,255,0.8)', color: '#1a3a5c', border: '1px solid #e2e8f0' }}
                  >
                    {item.suggestion}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
