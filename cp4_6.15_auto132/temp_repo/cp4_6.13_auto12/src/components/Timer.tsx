import { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Square,
  ChevronUp,
  ChevronDown,
  X,
  Star,
  BookOpen,
  Clock3,
} from 'lucide-react';
import type { Subject } from '@/types';
import { useTimerStore, useUIStore } from '@/store';
import { sessionApi } from '@/utils/api';
import { formatDuration, triggerNotification, requestNotificationPermission } from '@/utils/helpers';
import { useUIStore as _ui } from '@/store';

interface Props {
  subjects: Subject[];
}

export default function Timer({ subjects }: Props) {
  const {
    isRunning,
    isPaused,
    currentSubjectId,
    start,
    pause,
    resume,
    stop,
    getElapsedMs,
  } = useTimerStore();
  const { timerExpanded, setTimerExpanded, pushPendingAchievement } = useUIStore();
  const [tick, setTick] = useState(0);
  const [showEndModal, setShowEndModal] = useState(false);
  const [endData, setEndData] = useState<{
    subjectId: number;
    duration: number;
    startISO: string;
    endISO: string;
  } | null>(null);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const startSubjectRef = useRef<number | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning) {
      interval = setInterval(() => setTick((t) => t + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  useEffect(() => {
    if (isRunning && currentSubjectId) {
      startSubjectRef.current = currentSubjectId;
    }
  }, [isRunning, currentSubjectId]);

  const elapsed = isRunning ? Math.floor(getElapsedMs() / 1000) : 0;
  const currentSubject = subjects.find((s) => s.id === currentSubjectId);
  const canStart = subjects.length > 0;

  const handleStart = (subjectId: number) => {
    start(subjectId);
    setTimerExpanded(true);
    requestNotificationPermission();
    triggerNotification('专注计时已开始', '加油，保持专注！');
  };

  const handleStop = () => {
    const result = stop();
    if (!result || result.duration < 60) {
      if (result && result.duration < 60) {
        alert('专注时长不足1分钟，未保存。');
      }
      return;
    }
    setEndData({
      subjectId: result.subjectId,
      duration: Math.floor(result.duration / 1000),
      startISO: result.startISO,
      endISO: new Date().toISOString(),
    });
    setNotes('');
    setRating(0);
    setShowEndModal(true);
  };

  const handleSave = async () => {
    if (!endData) return;
    setSaving(true);
    try {
      const res = await sessionApi.create({
        subject_id: endData.subjectId,
        start_time: endData.startISO,
        end_time: endData.endISO,
        duration_seconds: endData.duration,
        notes: notes.trim(),
        rating,
      });
      triggerNotification(
        '专注完成',
        `学习了 ${formatDuration(endData.duration)}，继续保持！`
      );
      for (const ach of res.newAchievements || []) {
        pushPendingAchievement(ach);
      }
      setShowEndModal(false);
      setEndData(null);
    } catch (err: any) {
      alert(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowEndModal(false);
    setEndData(null);
  };

  return (
    <>
      <div
        className={`fixed z-50 right-4 md:right-6 transition-all duration-300 ease-out ${
          timerExpanded ? 'top-20 md:top-24' : 'top-20 md:top-24'
        } ${isRunning ? 'opacity-100' : 'opacity-100'}`}
      >
        <div
          className={`bg-bg-secondary border border-zinc-700/40 rounded-2xl shadow-2xl overflow-hidden ${
            isRunning ? 'animate-fade-slide-up' : ''
          }`}
          style={{
            width: timerExpanded ? '320px' : isRunning ? '320px' : 'auto',
            maxWidth: 'calc(100vw - 2rem)',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-bg-tertiary/50 transition-colors"
            onClick={() => !isRunning && setTimerExpanded(!timerExpanded)}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isRunning
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 animate-pulse-soft'
                    : 'bg-accent-primary/15'
                }`}
              >
                <Clock3
                  className={`w-4 h-4 ${isRunning ? 'text-white' : 'text-accent-primary'}`}
                />
              </div>
              <div>
                <div className="text-sm font-medium text-text-primary">
                  {isRunning ? '专注中' : timerExpanded ? '专注计时器' : '点击展开计时器'}
                </div>
                {isRunning && currentSubject && (
                  <div className="text-xs text-text-muted flex items-center gap-1">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: currentSubject.color }}
                    />
                    {currentSubject.name}
                  </div>
                )}
              </div>
            </div>
            <button
              className="p-1 rounded hover:bg-bg-tertiary text-text-muted"
              onClick={(e) => {
                e.stopPropagation();
                setTimerExpanded(!timerExpanded);
              }}
            >
              {timerExpanded || isRunning ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>

          {(timerExpanded || isRunning) && (
            <div className="px-4 pb-4 space-y-4">
              <div className="flex justify-center items-center py-2">
                <div
                  className="text-5xl font-bold tabular-nums tracking-tight"
                  style={{
                    fontFamily: 'Consolas, Monaco, monospace',
                    color: isRunning ? '#f5c542' : '#7c6fff',
                  }}
                >
                  {formatDuration(elapsed)}
                </div>
              </div>

              {!isRunning ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">
                      选择科目
                    </label>
                    <select
                      defaultValue={startSubjectRef.current || subjects[0]?.id || ''}
                      className="input-field text-sm py-2"
                      id="timer-subject-select"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      const sel = document.getElementById(
                        'timer-subject-select'
                      ) as HTMLSelectElement | null;
                      const id = sel ? parseInt(sel.value) : subjects[0]?.id;
                      if (id) handleStart(id);
                    }}
                    disabled={!canStart}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span className="font-medium">开始专注学习</span>
                  </button>
                  {!canStart && (
                    <p className="text-xs text-text-muted text-center">
                      请先在侧边栏创建学习科目
                    </p>
                  )}
                </>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => (isPaused ? resume() : pause())}
                    className="flex-1 btn-secondary flex items-center justify-center gap-1.5 py-3"
                  >
                    {isPaused ? (
                      <>
                        <Play className="w-4 h-4 fill-current" /> 继续
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4 fill-current" /> 暂停
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleStop}
                    className="flex-1 bg-red-500/85 hover:bg-red-500 text-white px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5"
                  >
                    <Square className="w-4 h-4 fill-current" /> 结束
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showEndModal && endData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-bg-secondary border border-zinc-700/40 rounded-2xl shadow-2xl animate-fade-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-zinc-700/30">
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent-primary" />
                记录本次学习
              </h2>
              <button
                onClick={handleCancel}
                className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between p-4 bg-bg-tertiary/60 rounded-xl">
                <div>
                  <div className="text-xs text-text-muted mb-1">学习时长</div>
                  <div
                    className="text-2xl font-bold text-accent-secondary tabular-nums"
                    style={{ fontFamily: 'Consolas, Monaco, monospace' }}
                  >
                    {formatDuration(endData.duration)}
                  </div>
                </div>
                {(() => {
                  const sub = subjects.find((s) => s.id === endData.subjectId);
                  if (!sub) return null;
                  return (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-secondary">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: sub.color }}
                      />
                      <span className="text-sm font-medium text-text-primary">{sub.name}</span>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  今日学习内容
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="记录一下今天学了什么，有什么收获..."
                  className="input-field resize-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  自我评价
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((n) => {
                    const active = (hoverRating || rating) >= n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(n)}
                        className="p-1 transition-transform duration-200 hover:scale-125"
                      >
                        <Star
                          className={`w-9 h-9 transition-colors duration-200 ${
                            active
                              ? 'fill-accent-secondary text-accent-secondary drop-shadow-[0_0_8px_rgba(245,197,66,0.5)]'
                              : 'fill-none text-text-muted'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="ml-2 text-sm text-text-muted">
                    {rating === 0
                      ? '点击星星评价'
                      : rating === 1
                      ? '一般'
                      : rating === 2
                      ? '不错'
                      : '很棒！'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button onClick={handleCancel} className="flex-1 btn-secondary">
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 btn-primary"
                  disabled={saving}
                >
                  {saving ? '保存中...' : '保存记录'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
