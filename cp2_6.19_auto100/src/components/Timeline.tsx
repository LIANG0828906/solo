import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Clock, MessageSquare, Star, Trash2 } from 'lucide-react';
import { PomodoroRecord, TaskType, deleteRecord } from '@/utils/storage';
import { useStore } from '@/store';

const typeColors: Record<TaskType, string> = {
  work: 'bg-blue-500/20 border-blue-400/40 text-blue-200 hover:bg-blue-500/30 hover:border-blue-400/60',
  study: 'bg-green-500/20 border-green-400/40 text-green-200 hover:bg-green-500/30 hover:border-green-400/60',
  exercise: 'bg-orange-500/20 border-orange-400/40 text-orange-200 hover:bg-orange-500/30 hover:border-orange-400/60',
};

const typeBadge: Record<TaskType, string> = {
  work: 'bg-blue-500 text-white',
  study: 'bg-green-500 text-white',
  exercise: 'bg-orange-500 text-white',
};

const typeLabel: Record<TaskType, string> = {
  work: '工作',
  study: '学习',
  exercise: '运动',
};

interface TimelineProps {
  records: PomodoroRecord[];
}

export default function Timeline({ records }: TimelineProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const { setTodayPomodoros, todayPomodoros } = useStore();

  const handleDelete = async (id: string) => {
    await deleteRecord(id);
    const updated = todayPomodoros
      .filter((r) => r.id !== id)
      .map((r, i) => ({ ...r, index: i + 1 }));
    setTodayPomodoros(updated);
  };

  return (
    <div className="w-full glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg flex items-center gap-2">
          <Clock size={18} className="text-indigo-300" />
          今日番茄时间轴
        </h3>
        <span className="text-xs text-slate-400">
          {records.length > 0 ? format(parseISO(records[0].completedAt), 'yyyy年MM月dd日', { locale: zhCN }) : '暂无记录'}
        </span>
      </div>

      {records.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          <div className="text-5xl mb-3">🍅</div>
          <p>还没有完成的番茄钟，开始你的第一个专注吧！</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-0 right-0 top-16 h-0.5 bg-gradient-to-r from-transparent via-white/15 to-transparent" />

          <div className="overflow-x-auto timeline-scroll pb-4 -mx-2 px-2">
            <div className="flex items-end gap-5 min-h-[120px] py-4" style={{ width: 'max-content' }}>
              {records.map((record, idx) => {
                const isHovered = hoveredId === record.id;
                return (
                  <div
                    key={record.id}
                    className="relative flex-shrink-0"
                    onMouseEnter={() => setHoveredId(record.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {idx === 0 ? null : (
                      <div className="absolute -left-[18px] top-16 w-4 h-0.5 bg-white/10" />
                    )}

                    <div className="absolute left-1/2 top-16 w-3 h-3 rounded-full border-2 border-white/50 -translate-x-1/2 z-10"
                      style={{
                        background: record.taskType === 'work' ? '#3b82f6' : record.taskType === 'study' ? '#22c55e' : '#f97316',
                      }}
                    />

                    <div
                      className={`relative rounded-xl px-3.5 py-2.5 border text-sm cursor-pointer transition-all duration-200 ${typeColors[record.taskType]} ${isHovered ? 'scale-105 shadow-lg' : ''}`}
                      style={{ minWidth: '140px' }}
                    >
                      <div className="flex items-center gap-1.5 text-[11px] opacity-80 mb-1">
                        <span>{format(parseISO(record.completedAt), 'HH:mm')}</span>
                        <span className="opacity-50">·</span>
                        <span>第{record.index}个</span>
                      </div>
                      <div className="font-medium truncate max-w-[140px]">
                        {record.taskName}
                      </div>
                    </div>

                    {isHovered && (
                      <div
                        className="absolute top-full left-full ml-4 mt-0 z-30 glass-card rounded-xl p-4 slide-in-right shadow-2xl"
                        style={{ width: '260px', backdropFilter: 'blur(8px)' }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${typeBadge[record.taskType]}`}>
                            {typeLabel[record.taskType]}
                          </span>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="text-slate-400 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-500/10"
                            title="删除记录"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <h4 className="text-white font-semibold mb-2 text-base">{record.taskName}</h4>

                        {record.taskDescription && (
                          <div className="flex items-start gap-2 mb-3">
                            <MessageSquare size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                            <p className="text-slate-300 text-sm leading-relaxed">{record.taskDescription}</p>
                          </div>
                        )}

                        <div className="space-y-2 pt-2 border-t border-white/10">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">番茄时长</span>
                            <span className="text-white font-medium">{record.duration} 分钟</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">完成时间</span>
                            <span className="text-white font-medium">
                              {format(parseISO(record.completedAt), 'HH:mm')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">心情评分</span>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  className={i < record.moodScore ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
