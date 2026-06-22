import { useState } from 'react';
import type { ReadingProgress, Member } from '@/types';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<ReadingProgress['status'], string> = {
  not_started: '未开始',
  reading: '阅读中',
  completed: '已完成',
};

const STATUS_COLORS: Record<ReadingProgress['status'], string> = {
  not_started: 'bg-latte text-coffee',
  reading: 'bg-forest/10 text-forest',
  completed: 'bg-forest text-warm-white',
};

function ProgressBubble({
  progress,
  member,
  onClose,
}: {
  progress: ReadingProgress;
  member: Member;
  onClose: () => void;
}) {
  const percent = Math.round((progress.currentChapter / progress.totalChapters) * 100);
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-20 w-64 animate-bubble-in" onClick={e => e.stopPropagation()}>
      <div className="bg-warm-white rounded-card shadow-hover border border-latte/40 p-4">
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-latte/30">
          <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover border-2 border-forest-pale" />
          <div>
            <p className="font-semibold text-espresso text-sm">{member.name}</p>
            <p className="text-xs text-coffee">最近更新：{new Date(progress.lastUpdateAt).toLocaleDateString('zh-CN')}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-coffee">阅读进度</span>
            <span className="text-sm font-bold text-forest">{percent}%</span>
          </div>
          <div className="h-2 bg-latte/40 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-forest via-forest-light to-forest-pale"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-xs text-coffee">
              第 {progress.currentChapter} / {progress.totalChapters} 章
            </span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[progress.status])}>
              {STATUS_LABELS[progress.status]}
            </span>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-warm-white border-r border-b border-latte/40 rotate-45" />
      <button
        onClick={onClose}
        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-espresso text-warm-white text-xs flex items-center justify-center hover:bg-espresso/80 transition-colors"
      >
        ×
      </button>
    </div>
  );
}

export default function ProgressTrack({
  progressList,
}: {
  progressList: (ReadingProgress & { member: Member })[];
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="bg-warm-white rounded-card p-6 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif text-xl font-bold text-espresso">阅读进度追踪</h3>
        <span className="text-sm text-coffee">{progressList.length} 位成员</span>
      </div>
      <div className="space-y-5">
        {progressList.map(p => {
          const percent = Math.round((p.currentChapter / p.totalChapters) * 100);
          const isActive = activeId === p.memberId;
          return (
            <div key={p.memberId} className="group">
              <div className="flex items-center gap-4 mb-2">
                <div className="relative">
                  <button
                    onClick={() => setActiveId(isActive ? null : p.memberId)}
                    className={cn(
                      'w-10 h-10 rounded-full overflow-hidden border-2 transition-all duration-200',
                      isActive ? 'border-forest shadow-hover scale-110' : 'border-forest-pale group-hover:border-forest/60 group-hover:scale-105'
                    )}
                  >
                    <img src={p.member.avatar} alt={p.member.name} className="w-full h-full object-cover" />
                  </button>
                  {isActive && (
                    <ProgressBubble
                      progress={p}
                      member={p.member}
                      onClose={() => setActiveId(null)}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-espresso">{p.member.name}</span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[p.status])}>
                      {STATUS_LABELS[p.status]}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="h-2.5 bg-latte/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-forest via-forest-light to-forest-pale shadow-sm"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    {percent > 0 && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-warm-white border-2 border-forest shadow-sm transition-all duration-300"
                        style={{ left: `calc(${percent}% - 8px)` }}
                      >
                        <div className="absolute inset-1 rounded-full bg-forest" />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs text-coffee">
                    <span>第 {p.currentChapter} / {p.totalChapters} 章</span>
                    <span className="text-forest font-medium">{percent}%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
