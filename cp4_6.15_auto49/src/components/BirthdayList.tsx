/**
 * BirthdayList 组件
 *
 * 职责：
 *   渲染生日卡片列表，根据数据量智能选择渲染策略（普通布局 / 虚拟滚动），
 *   确保在大量数据时仍保持流畅的滚动性能。
 *
 * 调用关系：
 *   - 被 App.tsx 调用
 *   - 接收 props: people（Person[] 数组）
 *   - 内部渲染 BirthdayCard 子组件
 *
 * 性能优化策略：
 *   1. 条件虚拟滚动：当 people.length >= 20 时启用 react-window 的 FixedSizeGrid
 *      进行虚拟滚动，仅渲染可视区域内的卡片，减少 DOM 节点数量；
 *      不足 20 条时使用普通 CSS Grid 布局，避免虚拟滚动的额外开销。
 *   2. 组件 memo 包裹：整个组件及内部 Cell 渲染函数均使用 React.memo 包装，
 *      避免不必要的重渲染。
 *   3. 数据排序使用 useMemo 缓存：仅当 people 变化时才重新执行 sortByBirthday。
 *   4. 响应式布局：通过 useEffect 监听窗口尺寸变化，移动端单列、桌面端两列。
 */

import { memo, useMemo, useState, useEffect } from 'react';
import type { Person } from '@/types';
import { BirthdayCard } from './BirthdayCard';
import { sortByBirthday } from '@/utils/dateUtils';
import { useBirthdayStore } from '@/store/useBirthdayStore';
import { FixedSizeGrid, type GridChildComponentProps } from 'react-window';

interface BirthdayListProps {
  people: Person[];
}

const VIRTUAL_THRESHOLD = 20;
const CARD_HEIGHT = 220;
const GAP = 24;

const EmptyState = memo(function EmptyState() {
  return (
    <div className="glass-card p-12 text-center">
      <div className="text-6xl mb-4">🎂</div>
      <h3 className="text-2xl font-bold font-display mb-2">还没有生日记录</h3>
      <p className="text-gray-300 mb-6">
        点击上方的"添加生日"按钮，开始记录您亲友的生日吧！
      </p>
      <p className="text-sm text-gray-400">
        我们会帮您记住每一个重要的日子，并提供贴心的礼物灵感
      </p>
    </div>
  );
});

interface GridCellData {
  sortedPeople: Person[];
  columnCount: number;
  newestPersonId: string | null;
}

const GridCell = memo(function GridCell({
  columnIndex,
  rowIndex,
  style,
  data,
}: GridChildComponentProps<GridCellData>) {
  const { sortedPeople, columnCount, newestPersonId } = data;
  const index = rowIndex * columnCount + columnIndex;
  const person = sortedPeople[index];

  if (!person) return null;

  return (
    <div style={{ ...style, padding: GAP / 2 }}>
      <BirthdayCard
        person={person}
        isNew={person.id === newestPersonId}
      />
    </div>
  );
});

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

export const BirthdayList = memo(function BirthdayList({
  people,
}: BirthdayListProps) {
  const { newestPersonId } = useBirthdayStore();
  const sortedPeople = useMemo(() => sortByBirthday(people), [people]);
  const isMobile = useIsMobile();
  const columnCount = isMobile ? 1 : 2;

  if (sortedPeople.length === 0) {
    return <EmptyState />;
  }

  if (sortedPeople.length < VIRTUAL_THRESHOLD) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sortedPeople.map((person) => (
          <BirthdayCard
            key={person.id}
            person={person}
            isNew={person.id === newestPersonId}
          />
        ))}
      </div>
    );
  }

  const rowCount = Math.ceil(sortedPeople.length / columnCount);
  const containerWidth =
    typeof window !== 'undefined' ? window.innerWidth - 32 : 800;
  const columnWidth = isMobile
    ? containerWidth
    : (containerWidth - GAP) / 2;
  const gridHeight = Math.min(rowCount * (CARD_HEIGHT + GAP), 800);
  const itemData: GridCellData = { sortedPeople, columnCount, newestPersonId };

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <FixedSizeGrid
        columnCount={columnCount}
        columnWidth={columnWidth}
        height={gridHeight}
        rowCount={rowCount}
        rowHeight={CARD_HEIGHT + GAP}
        width={containerWidth}
        itemData={itemData}
      >
        {GridCell}
      </FixedSizeGrid>
    </div>
  );
});
