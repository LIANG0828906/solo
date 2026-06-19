import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  memo,
} from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useHabitStore } from '../store';
import { HabitCard } from './HabitCard';
import type { Habit } from '../types';

interface HabitListProps {
  onOpenDetail: (habitId: string) => void;
  newestId?: string | null;
}

const ITEM_HEIGHT = 92;
const ITEM_GAP = 10;
const ROW_HEIGHT = ITEM_HEIGHT + ITEM_GAP;
const OVERSCAN = 4;
const MIN_ITEMS_FOR_VIRTUAL = 8;

interface VirtualListInnerProps {
  habits: Habit[];
  getWeeklyCount: (id: string) => number;
  onOpenDetail: (id: string) => void;
  newestId?: string | null;
  containerHeight: number;
  scrollTop: number;
  enableVirtual: boolean;
}

function VirtualListInnerFn({
  habits,
  getWeeklyCount,
  onOpenDetail,
  newestId,
  containerHeight,
  scrollTop,
  enableVirtual,
}: VirtualListInnerProps) {
  const total = habits.length;
  const totalHeight = total * ROW_HEIGHT - ITEM_GAP;

  let startIdx = 0;
  let endIdx = total;

  if (enableVirtual) {
    startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT) + OVERSCAN * 2;
    endIdx = Math.min(total, startIdx + visibleCount);
  }

  const visible: Habit[] = [];
  const offsets: number[] = [];
  const indexes: number[] = [];
  for (let i = startIdx; i < endIdx; i++) {
    visible.push(habits[i]);
    offsets.push(i * ROW_HEIGHT);
    indexes.push(i);
  }

  return (
    <div
      className="virtual-inner"
      style={enableVirtual ? { height: Math.max(0, totalHeight) } : undefined}
    >
      {visible.map((h, i) => {
        const top = offsets[i];
        const style = enableVirtual
          ? {
              transform: `translateY(${top}px)`,
              height: ITEM_HEIGHT,
              paddingBottom: 0,
            }
          : { marginBottom: i < visible.length - 1 ? ITEM_GAP : 0 };
        return (
          <div
            key={h.id}
            className="virtual-item"
            style={style}
            data-virtual-index={indexes[i]}
            data-static={enableVirtual ? '0' : '1'}
          >
            <HabitCard
              habit={h}
              weeklyCount={getWeeklyCount(h.id)}
              isNew={newestId === h.id}
              onClick={onOpenDetail}
            />
          </div>
        );
      })}
    </div>
  );
}

const VirtualList = memo(VirtualListInnerFn);
VirtualList.displayName = 'VirtualList';

function useDebouncedScroll(callback: (st: number) => void) {
  const frameRef = useRef<number | null>(null);
  const latestRef = useRef(0);
  const cbRef = useRef(callback);
  cbRef.current = callback;

  const enqueue = useCallback((scrollTop: number) => {
    latestRef.current = scrollTop;
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      cbRef.current(latestRef.current);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return enqueue;
}

export function HabitList({ onOpenDetail, newestId }: HabitListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerHeight, setContainerHeight] = useState(420);
  const [scrollTop, setScrollTop] = useState(0);
  const roRef = useRef<ResizeObserver | null>(null);
  const [ready, setReady] = useState(false);

  const { habits, getWeeklyCount } = useHabitStore(
    useShallow((s) => ({
      habits: s.habits,
      getWeeklyCount: s.getWeeklyCount,
    }))
  );

  const enqueueScroll = useDebouncedScroll(setScrollTop);

  const computeHeight = useCallback(() => {
    const maxH = Math.min(560, Math.max(300, window.innerHeight - 360));
    const byItems = habits.length * ROW_HEIGHT - ITEM_GAP + 16;
    const h = Math.min(maxH, Math.max(260, byItems));
    setContainerHeight(h);
  }, [habits.length]);

  useLayoutEffect(() => {
    setReady(true);
    computeHeight();
    const onResize = () => computeHeight();
    window.addEventListener('resize', onResize);

    const el = containerRef.current;
    if (el && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => computeHeight());
      ro.observe(el);
      roRef.current = ro;
    }
    return () => {
      window.removeEventListener('resize', onResize);
      if (roRef.current) roRef.current.disconnect();
    };
  }, [computeHeight]);

  const onScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      enqueueScroll(e.currentTarget.scrollTop);
    },
    [enqueueScroll]
  );

  useEffect(() => {
    if (!newestId || !ready) return;
    const idx = habits.findIndex((h) => h.id === newestId);
    if (idx < 0 || !containerRef.current) return;
    const target = Math.max(0, idx * ROW_HEIGHT - 120);
    const el = containerRef.current;
    if ('scrollBehavior' in el.style) {
      el.scrollTo({ top: target, behavior: 'smooth' });
    } else {
      el.scrollTop = target;
    }
  }, [newestId, habits, ready]);

  const enableVirtual = useMemo(() => habits.length >= MIN_ITEMS_FOR_VIRTUAL, [habits.length]);

  if (!ready) {
    return (
      <div style={{ height: 420, borderRadius: 18, background: 'rgba(255,255,255,0.02)' }} />
    );
  }

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
      style={{
        height: containerHeight,
        maxHeight: 560,
        willChange: 'transform',
      }}
    >
      <VirtualList
        habits={habits}
        getWeeklyCount={getWeeklyCount}
        onOpenDetail={onOpenDetail}
        newestId={newestId}
        containerHeight={containerHeight}
        scrollTop={scrollTop}
        enableVirtual={enableVirtual}
      />
    </div>
  );
}
