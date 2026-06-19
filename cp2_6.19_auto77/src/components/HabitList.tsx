import { useEffect, useLayoutEffect, useMemo, useRef, useState, memo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useHabitStore } from '../store';
import { HabitCard } from './HabitCard';
import type { Habit } from '../types';

interface HabitListProps {
  onOpenDetail: (habitId: string) => void;
  newestId?: string | null;
}

const ITEM_HEIGHT = 92;
const OVERSCAN = 6;

interface Props {
  habits: Habit[];
  weeklyCountFn: (id: string) => number;
  onOpenDetail: (id: string) => void;
  newestId?: string | null;
  containerHeight: number;
  scrollTop: number;
}

function VirtualListInner({
  habits,
  weeklyCountFn,
  onOpenDetail,
  newestId,
  containerHeight,
  scrollTop,
}: Props) {
  const total = habits.length;
  const totalHeight = total * ITEM_HEIGHT;

  const startIdx = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const endIdx = Math.min(
    total,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN
  );

  const visible: Habit[] = [];
  const offsets: number[] = [];
  for (let i = startIdx; i < endIdx; i++) {
    visible.push(habits[i]);
    offsets.push(i * ITEM_HEIGHT);
  }

  return (
    <div className="virtual-inner" style={{ height: totalHeight }}>
      {visible.map((h, i) => (
        <div
          key={h.id}
          className="virtual-item"
          style={{ transform: `translateY(${offsets[i]}px)`, height: ITEM_HEIGHT, paddingTop: 4, paddingBottom: 4 }}
        >
          <HabitCard
            habit={h}
            weeklyCount={weeklyCountFn(h.id)}
            isNew={newestId === h.id}
            onClick={onOpenDetail}
          />
        </div>
      ))}
    </div>
  );
}

const VirtualList = memo(VirtualListInner);
VirtualList.displayName = 'VirtualList';

export function HabitList({ onOpenDetail, newestId }: HabitListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerHeight, setContainerHeight] = useState(520);
  const [scrollTop, setScrollTop] = useState(0);

  const { habits, getWeeklyCount } = useHabitStore(
    useShallow((s) => ({
      habits: s.habits,
      getWeeklyCount: s.getWeeklyCount,
    }))
  );

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const applyHeight = () => {
      const maxH = Math.min(560, Math.max(320, window.innerHeight - 340));
      const byItems = habits.length * ITEM_HEIGHT + 20;
      setContainerHeight(Math.min(maxH, Math.max(260, byItems)));
    };
    applyHeight();
    window.addEventListener('resize', applyHeight);
    return () => window.removeEventListener('resize', applyHeight);
  }, [habits.length]);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  useEffect(() => {
    if (!newestId) return;
    const idx = habits.findIndex((h) => h.id === newestId);
    if (idx < 0 || !containerRef.current) return;
    const target = idx * ITEM_HEIGHT;
    containerRef.current.scrollTo({ top: Math.max(0, target - 100), behavior: 'smooth' });
  }, [newestId, habits]);

  const weeklyCountFn = useMemo(() => getWeeklyCount, [getWeeklyCount]);

  if (habits.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-emoji">🌱</div>
        <div className="empty-title">还没有习惯</div>
        <div className="empty-text">点击下方按钮添加你的第一个习惯吧</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="virtual-scroll"
      onScroll={onScroll}
      style={{ height: containerHeight, maxHeight: 560 }}
    >
      <VirtualList
        habits={habits}
        weeklyCountFn={weeklyCountFn}
        onOpenDetail={onOpenDetail}
        newestId={newestId}
        containerHeight={containerHeight}
        scrollTop={scrollTop}
      />
    </div>
  );
}
