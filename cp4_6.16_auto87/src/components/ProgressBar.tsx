import type { ProgramStatus } from '@/store';

const STAGES: { key: ProgramStatus; label: string; color: string }[] = [
  { key: 'draft', label: '草稿', color: '#94a3b8' },
  { key: 'recording', label: '录制中', color: '#3b82f6' },
  { key: 'editing', label: '剪辑中', color: '#f59e0b' },
  { key: 'published', label: '发布', color: '#22c55e' },
];

interface ProgressBarProps {
  status: ProgramStatus;
  editingProgress?: number;
}

export default function ProgressBar({ status, editingProgress }: ProgressBarProps) {
  const currentIndex = STAGES.findIndex((s) => s.key === status);

  const getTooltip = (stage: typeof STAGES[number], index: number) => {
    if (index < currentIndex) return `${stage.label} - 已完成`;
    if (index === currentIndex) {
      if (stage.key === 'editing' && editingProgress !== undefined) {
        return `剪辑中 - 已剪辑${editingProgress}%`;
      }
      return `${stage.label} - 进行中`;
    }
    return stage.label;
  };

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between mb-3">
        {STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={stage.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center relative group">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                    isCurrent
                      ? 'animate-pulse-glow text-white'
                      : isCompleted
                      ? 'text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                  style={{
                    backgroundColor: isCurrent || isCompleted ? stage.color : undefined,
                  }}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
                <span className="text-[11px] mt-1.5 text-slate-500 font-medium">{stage.label}</span>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {getTooltip(stage, index)}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45" />
                </div>
              </div>
              {index < STAGES.length - 1 && (
                <div className="flex-1 mx-3 h-[3px] rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: isCompleted ? '100%' : isCurrent ? '50%' : '0%',
                      backgroundColor: isCompleted || isCurrent ? stage.color : undefined,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
