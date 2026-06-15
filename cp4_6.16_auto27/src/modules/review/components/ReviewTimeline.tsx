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
import styles from './ReviewTimeline.module.css';

const SPEED_OPTIONS = [1, 2, 4] as const;
type Speed = (typeof SPEED_OPTIONS)[number];

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
    const totalMinutes = maxTime - minTime;
    const duration = (totalMinutes * 1000) / speed;

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
  }, [speed, minTime, maxTime]);

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
      <div className={styles.container}>
        <div className={styles.emptyState}>暂无计划块，请先添加计划</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>日程回顾</span>
      </div>

      <div className={styles.timelineScroll}>
        <div className={styles.timelineInner} style={{ width: timelineWidth, height: timelineHeight }}>
          {Array.from({ length: tickSlots + 1 }, (_, i) => {
            if (i % halfHourSlotStep !== 0) return null;
            const minute = minTime + i * MINUTE_PER_SLOT;
            const left = i * SLOT_WIDTH;
            return (
              <div key={`tick-${i}`}>
                <div className={styles.tickLine} style={{ left, height: timelineHeight }} />
                <span className={styles.tickLabel} style={{ left }}>{minutesToTime(minute)}</span>
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
                className={`${styles.block} ${visible ? styles.blockVisible : styles.blockHidden}`}
                style={{
                  left,
                  width: Math.max(width, SLOT_WIDTH / 2),
                  top,
                  height,
                  background: blockColor,
                }}
                onClick={() => openDetail(block)}
                onDoubleClick={() => openDetail(block)}
              >
                <span className={styles.blockTitle}>{block.title}</span>
              </div>
            );
          })}

          <div
            className={styles.cursor}
            style={{
              left: ((currentMinutes - minTime) / MINUTE_PER_SLOT) * SLOT_WIDTH,
              height: timelineHeight,
            }}
          >
            <div className={styles.cursorDot} />
          </div>
        </div>
      </div>

      <div className={styles.controlsBar}>
        <button className={styles.playBtn} onClick={togglePlay}>
          {playing ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
        </button>

        <div className={styles.progressTrack} onClick={handleProgressClick}>
          <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
        </div>

        {SPEED_OPTIONS.map((s) => (
          <button
            key={s}
            className={`${styles.speedBtn} ${speed === s ? styles.speedBtnActive : ''}`}
            onClick={() => setSpeed(s)}
          >
            {s}x
          </button>
        ))}

        <span className={styles.timeDisplay}>{minutesToTime(Math.round(currentMinutes))}</span>
      </div>

      {selectedBlock && reviewForm && (
        <div className={styles.overlay} onClick={() => { setSelectedBlock(null); setReviewForm(null); }}>
          <div className={styles.detailCard} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.closeBtn}
              onClick={() => { setSelectedBlock(null); setReviewForm(null); }}
            >
              <X size={16} />
            </button>

            <div className={styles.cardTitle}>{selectedBlock.title}</div>

            <div className={styles.cardRow}>
              <span className={styles.cardLabel}>计划时间</span>
              <span className={styles.cardTimeText}>
                {minutesToTime(selectedBlock.startTime)} - {minutesToTime(selectedBlock.endTime)}
              </span>
            </div>

            <div className={styles.cardRow}>
              <span className={styles.cardLabel}>已完成</span>
              <div
                className={`${styles.checkbox} ${reviewForm.completed ? styles.checkboxChecked : ''}`}
                onClick={() => setReviewForm((f) => (f ? { ...f, completed: !f.completed } : f))}
              >
                {reviewForm.completed && <Check size={14} color="#fff" />}
              </div>
            </div>

            <div className={styles.cardRow}>
              <span className={styles.cardLabel}>实际开始</span>
              <input
                className={styles.timeInput}
                value={minutesToInput(reviewForm.actualStart)}
                onChange={(e) =>
                  setReviewForm((f) => (f ? { ...f, actualStart: snapToSlot(parseInt(e.target.value.split(':')[0], 10) * 60 + parseInt(e.target.value.split(':')[1] || '0', 10)) || f.actualStart } : f))
                }
                onBlur={(e) => handleTimeBlur('actualStart', e.target.value)}
              />
            </div>

            <div className={styles.cardRow}>
              <span className={styles.cardLabel}>实际结束</span>
              <input
                className={styles.timeInput}
                value={minutesToInput(reviewForm.actualEnd)}
                onChange={(e) =>
                  setReviewForm((f) => (f ? { ...f, actualEnd: snapToSlot(parseInt(e.target.value.split(':')[0], 10) * 60 + parseInt(e.target.value.split(':')[1] || '0', 10)) || f.actualEnd } : f))
                }
                onBlur={(e) => handleTimeBlur('actualEnd', e.target.value)}
              />
            </div>

            <div className={styles.cardRow}>
              <span className={styles.cardLabel}>满意度</span>
              <div className={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    className={`${styles.starBtn} ${s <= reviewForm.satisfaction ? styles.starBtnFilled : ''}`}
                    onClick={() => setReviewForm((f) => (f ? { ...f, satisfaction: s } : f))}
                  >
                    <Star size={20} fill={s <= reviewForm.satisfaction ? '#e94560' : 'none'} />
                  </button>
                ))}
              </div>
            </div>

            <button className={styles.saveBtn} onClick={handleSave}>
              保存评价
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
