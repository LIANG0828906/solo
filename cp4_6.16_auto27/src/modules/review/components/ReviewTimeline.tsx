import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Star, Check, X } from 'lucide-react';
import { usePlanStore } from '@/store/usePlanStore';
import {
  SLOT_WIDTH,
  LANE_HEIGHT,
  MAX_LANES,
  MINUTE_PER_SLOT,
  minutesToTime,
  snapToSlot,
  TASK_TYPE_COLORS,
} from '@/lib/constants';
import type { TimeBlock, ReviewData } from '@/types';

const SPEED_OPTIONS = [1, 2, 4] as const;
type Speed = (typeof SPEED_OPTIONS)[number];

const ANIMATION_DURATION_BASE = 10000;

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    background: 'linear-gradient(180deg, #2c2c3a 0%, #1e1e2e 100%)',
    borderRadius: 12,
    overflow: 'hidden',
    fontFamily: "'Segoe UI', sans-serif",
  },
  header: {
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  title: {
    color: '#e94560',
    fontSize: 18,
    fontWeight: 700 as const,
    letterSpacing: 0.5,
  },
  timelineScroll: {
    flex: 1,
    overflowX: 'auto' as const,
    overflowY: 'hidden' as const,
    position: 'relative' as const,
  },
  timelineInner: {
    position: 'relative' as const,
  },
  tickLine: {
    position: 'absolute' as const,
    top: 0,
    width: 1,
    background: 'rgba(255,255,255,0.08)',
  },
  tickLabel: {
    position: 'absolute' as const,
    top: 4,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    transform: 'translateX(-50%)',
    userSelect: 'none' as const,
  },
  block: {
    position: 'absolute' as const,
    borderRadius: 2,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    transition: 'all 0.8s ease-out',
  },
  blockHidden: {
    opacity: 0,
    transform: 'translateX(-30px)',
  },
  blockVisible: {
    opacity: 1,
    transform: 'translateX(0)',
  },
  blockTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 500 as const,
    padding: '0 6px',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
  },
  cursor: {
    position: 'absolute' as const,
    top: 0,
    width: 2,
    background: '#e94560',
    zIndex: 10,
    pointerEvents: 'none' as const,
    transition: 'left 0.1s linear',
  },
  cursorDot: {
    position: 'absolute' as const,
    top: -4,
    left: -4,
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: '#e94560',
  },
  controlsBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 20px',
    background: 'rgba(22, 33, 62, 0.9)',
    backdropFilter: 'blur(6px)',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
    background: '#e94560',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  speedBtn: (active: boolean) => ({
    padding: '4px 10px',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.12)',
    background: active ? '#e94560' : 'transparent',
    color: active ? '#fff' : 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: 600 as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
  }),
  timeDisplay: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: 'monospace',
    marginLeft: 'auto',
    letterSpacing: 1,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    cursor: 'pointer',
    position: 'relative' as const,
  },
  progressFill: (pct: number) => ({
    height: '100%',
    width: `${pct}%`,
    background: '#e94560',
    borderRadius: 2,
    transition: 'width 0.1s linear',
  }),
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  detailCard: {
    background: 'rgba(22, 33, 62, 0.95)',
    backdropFilter: 'blur(6px)',
    borderRadius: 12,
    padding: 24,
    width: 360,
    maxWidth: '90vw',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 700 as const,
    marginBottom: 16,
  },
  cardRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    width: 72,
    flexShrink: 0,
  },
  cardTimeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  checkbox: (checked: boolean) => ({
    width: 20,
    height: 20,
    borderRadius: 4,
    border: checked ? 'none' : '2px solid rgba(255,255,255,0.3)',
    background: checked ? '#e94560' : 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }),
  timeInput: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6,
    color: '#fff',
    padding: '6px 10px',
    fontSize: 13,
    fontFamily: 'monospace',
    width: 80,
    outline: 'none',
  },
  starsRow: {
    display: 'flex',
    gap: 4,
  },
  starBtn: (filled: boolean) => ({
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    color: filled ? '#e94560' : 'rgba(255,255,255,0.2)',
    transition: 'color 0.2s',
  }),
  saveBtn: {
    width: '100%',
    padding: '10px 0',
    borderRadius: 8,
    border: 'none',
    background: '#e94560',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600 as const,
    cursor: 'pointer',
    marginTop: 16,
    transition: 'background 0.2s',
  },
  closeBtn: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.4)',
    cursor: 'pointer',
    padding: 4,
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
  },
};

export default function ReviewTimeline() {
  const { blocks, reviews, setReview } = usePlanStore();
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [progress, setProgress] = useState(0);
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null);
  const [reviewForm, setReviewForm] = useState<ReviewData | null>(null);

  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  const sortedBlocks = [...blocks].sort((a, b) => a.startTime - b.startTime);
  const minTime = sortedBlocks.length > 0 ? sortedBlocks[0].startTime : 0;
  const maxTime = sortedBlocks.length > 0 ? sortedBlocks[sortedBlocks.length - 1].endTime : 1440;
  const timeRange = maxTime - minTime || 1;
  const totalSlots = (timeRange / MINUTE_PER_SLOT);
  const timelineWidth = totalSlots * SLOT_WIDTH;
  const timelineHeight = LANE_HEIGHT * MAX_LANES + 28;

  const currentMinutes = minTime + progress * timeRange;

  const tickSlots = Math.ceil(timeRange / MINUTE_PER_SLOT);
  const halfHourSlotStep = 30 / MINUTE_PER_SLOT;

  const startAnimation = useCallback((fromProgress: number) => {
    startTimeRef.current = performance.now();
    pausedAtRef.current = fromProgress;
    const duration = ANIMATION_DURATION_BASE / speed;

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const addProgress = elapsed / duration;
      const newProgress = Math.min(pausedAtRef.current + addProgress, 1);
      setProgress(newProgress);
      if (newProgress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPlaying(false);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [speed]);

  useEffect(() => {
    if (playing) {
      startAnimation(progress);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, speed]);

  const togglePlay = () => {
    if (progress >= 1) {
      setProgress(0);
      pausedAtRef.current = 0;
    }
    setPlaying((p) => !p);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setProgress(pct);
    if (playing) {
      cancelAnimationFrame(rafRef.current);
      startAnimation(pct);
    } else {
      pausedAtRef.current = pct;
    }
  };

  const openDetail = (block: TimeBlock) => {
    setSelectedBlock(block);
    const existing = reviews[block.id];
    setReviewForm(
      existing ?? {
        blockId: block.id,
        completed: false,
        actualStart: block.startTime,
        actualEnd: block.endTime,
        satisfaction: 0,
      }
    );
  };

  const handleSave = () => {
    if (!reviewForm || !selectedBlock) return;
    setReview(selectedBlock.id, reviewForm);
    setSelectedBlock(null);
    setReviewForm(null);
  };

  const handleTimeBlur = (field: 'actualStart' | 'actualEnd', value: string) => {
    const parts = value.split(':');
    if (parts.length !== 2) return;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return;
    const snapped = snapToSlot(h * 60 + m);
    setReviewForm((f) => (f ? { ...f, [field]: snapped } : f));
  };

  const minutesToInput = (m: number) => minutesToTime(m);

  if (blocks.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>暂无计划块，请先添加计划</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>日程回顾</span>
      </div>

      <div style={styles.timelineScroll}>
        <div style={{ ...styles.timelineInner, width: timelineWidth, height: timelineHeight }}>
          {Array.from({ length: tickSlots + 1 }, (_, i) => {
            if (i % halfHourSlotStep !== 0) return null;
            const minute = minTime + i * MINUTE_PER_SLOT;
            const left = i * SLOT_WIDTH;
            return (
              <div key={`tick-${i}`}>
                <div style={{ ...styles.tickLine, left, height: timelineHeight }} />
                <span style={{ ...styles.tickLabel, left }}>{minutesToTime(minute)}</span>
              </div>
            );
          })}

          {sortedBlocks.map((block) => {
            const left = ((block.startTime - minTime) / MINUTE_PER_SLOT) * SLOT_WIDTH;
            const width = ((block.endTime - block.startTime) / MINUTE_PER_SLOT) * SLOT_WIDTH;
            const top = 28 + block.lane * LANE_HEIGHT + 8;
            const height = LANE_HEIGHT - 16;
            const visible = block.startTime <= currentMinutes;
            const blockColor = block.color || TASK_TYPE_COLORS[block.type] || '#0f3460';

            return (
              <div
                key={block.id}
                style={{
                  ...styles.block,
                  left,
                  width: Math.max(width, SLOT_WIDTH / 2),
                  top,
                  height,
                  background: blockColor,
                  ...(visible ? styles.blockVisible : styles.blockHidden),
                }}
                onClick={() => openDetail(block)}
                onDoubleClick={() => openDetail(block)}
              >
                <span style={styles.blockTitle}>{block.title}</span>
              </div>
            );
          })}

          <div
            style={{
              ...styles.cursor,
              left: ((currentMinutes - minTime) / MINUTE_PER_SLOT) * SLOT_WIDTH,
              height: timelineHeight,
            }}
          >
            <div style={styles.cursorDot} />
          </div>
        </div>
      </div>

      <div style={styles.controlsBar}>
        <button style={styles.playBtn} onClick={togglePlay}>
          {playing ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
        </button>

        <div style={styles.progressTrack} onClick={handleProgressClick}>
          <div style={styles.progressFill(progress * 100)} />
        </div>

        {SPEED_OPTIONS.map((s) => (
          <button key={s} style={styles.speedBtn(speed === s)} onClick={() => setSpeed(s)}>
            {s}x
          </button>
        ))}

        <span style={styles.timeDisplay}>{minutesToTime(Math.round(currentMinutes))}</span>
      </div>

      {selectedBlock && reviewForm && (
        <div style={styles.overlay} onClick={() => { setSelectedBlock(null); setReviewForm(null); }}>
          <div style={{ ...styles.detailCard, position: 'relative' as const }} onClick={(e) => e.stopPropagation()}>
            <button
              style={styles.closeBtn}
              onClick={() => { setSelectedBlock(null); setReviewForm(null); }}
            >
              <X size={16} />
            </button>

            <div style={styles.cardTitle}>{selectedBlock.title}</div>

            <div style={styles.cardRow}>
              <span style={styles.cardLabel}>计划时间</span>
              <span style={styles.cardTimeText}>
                {minutesToTime(selectedBlock.startTime)} - {minutesToTime(selectedBlock.endTime)}
              </span>
            </div>

            <div style={styles.cardRow}>
              <span style={styles.cardLabel}>已完成</span>
              <div
                style={styles.checkbox(reviewForm.completed)}
                onClick={() => setReviewForm((f) => (f ? { ...f, completed: !f.completed } : f))}
              >
                {reviewForm.completed && <Check size={14} color="#fff" />}
              </div>
            </div>

            <div style={styles.cardRow}>
              <span style={styles.cardLabel}>实际开始</span>
              <input
                style={styles.timeInput}
                value={minutesToInput(reviewForm.actualStart)}
                onChange={(e) =>
                  setReviewForm((f) => (f ? { ...f, actualStart: snapToSlot(parseInt(e.target.value.split(':')[0], 10) * 60 + parseInt(e.target.value.split(':')[1] || '0', 10)) || f.actualStart } : f))
                }
                onBlur={(e) => handleTimeBlur('actualStart', e.target.value)}
              />
            </div>

            <div style={styles.cardRow}>
              <span style={styles.cardLabel}>实际结束</span>
              <input
                style={styles.timeInput}
                value={minutesToInput(reviewForm.actualEnd)}
                onChange={(e) =>
                  setReviewForm((f) => (f ? { ...f, actualEnd: snapToSlot(parseInt(e.target.value.split(':')[0], 10) * 60 + parseInt(e.target.value.split(':')[1] || '0', 10)) || f.actualEnd } : f))
                }
                onBlur={(e) => handleTimeBlur('actualEnd', e.target.value)}
              />
            </div>

            <div style={styles.cardRow}>
              <span style={styles.cardLabel}>满意度</span>
              <div style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    style={styles.starBtn(s <= reviewForm.satisfaction)}
                    onClick={() => setReviewForm((f) => (f ? { ...f, satisfaction: s } : f))}
                  >
                    <Star size={20} fill={s <= reviewForm.satisfaction ? '#e94560' : 'none'} />
                  </button>
                ))}
              </div>
            </div>

            <button style={styles.saveBtn} onClick={handleSave}>
              保存评价
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
