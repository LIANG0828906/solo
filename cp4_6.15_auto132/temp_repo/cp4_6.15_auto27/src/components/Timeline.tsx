import type { BrewRecord, TastingNote } from '@/types';
import { Droplet, Flame, Timer, ThermometerSun } from 'lucide-react';
import { Star } from 'lucide-react';

interface Props {
  brews: BrewRecord[];
  notes: TastingNote[];
  newestId?: string | null;
}

const vesselIcons: Record<string, string> = {
  盖碗: '🫖',
  紫砂壶: '🏺',
  玻璃杯: '🥛',
  瓷杯: '🍵',
};

export default function Timeline({ brews, notes, newestId }: Props) {
  if (brews.length === 0) {
    return (
      <div
        className="py-16 text-center text-sm"
        style={{ color: 'var(--color-text-light)' }}
      >
        暂无冲泡记录，点击「记录冲泡」添加第一条
      </div>
    );
  }

  return (
    <div className="relative pl-8">
      <div
        className="absolute left-3 top-2 bottom-2 w-0.5"
        style={{ backgroundColor: 'var(--color-border)' }}
      />
      <div className="space-y-5">
        {brews.map((b, i) => {
          const note = notes.find((n) => n.brewRecordId === b.id);
          const stars = note ? Math.round(note.overallScore / 20) : 0;
          const isNew = newestId === b.id;
          const date = new Date(b.createdAt);

          return (
            <div
              key={b.id}
              className="relative"
              style={{
                animation: isNew ? 'slideInRight 400ms ease-out' : undefined,
              }}
            >
              <div
                className="absolute -left-[22px] top-3 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-white"
                style={{
                  borderColor: i === 0 ? 'var(--color-tea)' : 'var(--color-border)',
                  backgroundColor: i === 0 ? 'var(--color-tea)' : 'white',
                }}
              >
                {i === 0 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>

              <div className="tea-card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--color-wood-dark)' }}>
                      第 {b.brewCount} 泡
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-light)' }}>
                      {date.toLocaleString('zh-CN', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  {note && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            size={12}
                            fill={n <= stars ? 'var(--color-tea)' : 'none'}
                            color={n <= stars ? 'var(--color-tea)' : 'var(--color-border)'}
                            strokeWidth={2}
                          />
                        ))}
                      </div>
                      <span
                        className="text-sm font-bold"
                        style={{
                          fontFamily: 'var(--font-serif)',
                          color: 'var(--color-tea)',
                        }}
                      >
                        {note.overallScore}
                      </span>
                    </div>
                  )}
                </div>

                <div
                  className="flex flex-wrap gap-3 mb-3 text-xs"
                  style={{ color: 'var(--color-text-light)' }}
                >
                  <span className="flex items-center gap-1">
                    <ThermometerSun className="w-3 h-3" /> {b.temperature}°C
                  </span>
                  <span className="flex items-center gap-1">
                    <Droplet className="w-3 h-3" /> {b.teaAmount}g
                  </span>
                  <span className="flex items-center gap-1">
                    <Timer className="w-3 h-3" /> {b.brewTime}s
                  </span>
                  <span>{b.pourMethod}</span>
                  <span>
                    {vesselIcons[b.vessel] || '🍵'} {b.vessel}
                  </span>
                </div>

                {note && (
                  <div
                    className="pt-3 space-y-2"
                    style={{ borderTop: '1px solid var(--color-border)' }}
                  >
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span
                        className="tea-tag"
                        style={{
                          backgroundColor: 'rgba(107, 142, 35, 0.12)',
                          color: 'var(--color-tea-dark)',
                        }}
                      >
                        汤色：{note.liquorColor}
                      </span>
                      <span
                        className="tea-tag"
                        style={{
                          backgroundColor: 'rgba(139, 94, 60, 0.12)',
                          color: 'var(--color-wood-dark)',
                        }}
                      >
                        滋味：{note.taste}
                      </span>
                    </div>
                    {note.notes && (
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {note.notes}
                      </p>
                    )}
                    {note.dryAroma && (
                      <div className="text-xs" style={{ color: 'var(--color-text-light)' }}>
                        <Flame className="w-3 h-3 inline mr-1" />
                        干香：{note.dryAroma} | 湿香：{note.wetAroma || '-'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
