import React, { memo, useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Wish, useWishStore } from '../store';
import { WishCard } from './WishCard';

export type SortType = 'default' | 'daysAsc' | 'daysDesc' | 'priority' | 'progress';

interface WishListProps {
  wishes: Wish[];
  enableDrag?: boolean;
  emptyText?: string;
  showSortControls?: boolean;
}

const getDaysLeft = (targetDate: string): number => {
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
};

const priorityOrder = { high: 0, medium: 1, low: 2 };

function WishListComponent({ wishes, enableDrag = true, emptyText = '暂无愿望清单', showSortControls = true }: WishListProps) {
  const { reorderWishes, deleteWish } = useWishStore();
  const [sortType, setSortType] = useState<SortType>('default');

  const sortedWishes = useMemo(() => {
    const list = [...wishes];
    
    switch (sortType) {
      case 'daysAsc':
        return list.sort((a, b) => getDaysLeft(a.targetDate) - getDaysLeft(b.targetDate));
      case 'daysDesc':
        return list.sort((a, b) => getDaysLeft(b.targetDate) - getDaysLeft(a.targetDate));
      case 'priority':
        return list.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      case 'progress':
        return list.sort((a, b) => b.progress - a.progress);
      case 'default':
      default:
        return enableDrag
          ? list.sort((a, b) => a.order - b.order)
          : list;
    }
  }, [wishes, sortType, enableDrag]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    reorderWishes(result.source.index, result.destination.index);
  };

  if (wishes.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          color: '#95a5a6'
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎁</div>
        <p style={{ fontSize: 16, margin: 0 }}>{emptyText}</p>
      </div>
    );
  }

  const sortOptions: { value: SortType; label: string; icon: string }[] = [
    { value: 'default', label: '默认排序', icon: '📋' },
    { value: 'daysAsc', label: '剩余天数↑', icon: '⏫' },
    { value: 'daysDesc', label: '剩余天数↓', icon: '⏬' },
    { value: 'priority', label: '优先级', icon: '🎯' },
    { value: 'progress', label: '进度', icon: '📊' }
  ];

  const sortControls = showSortControls && (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        flexWrap: 'wrap'
      }}
    >
      <span style={{ fontSize: 13, color: '#7f8c8d', fontWeight: 500 }}>
        排序方式：
      </span>
      <div
        style={{
          display: 'flex',
          gap: 6,
          backgroundColor: '#fff',
          padding: 4,
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          flexWrap: 'wrap'
        }}
      >
        {sortOptions.map((opt) => {
          const isActive = sortType === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setSortType(opt.value)}
              style={{
                padding: '6px 14px',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#fff' : '#636e72',
                backgroundColor: isActive ? '#6C63FF' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    'rgba(108, 99, 255, 0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    'transparent';
                }
              }}
            >
              <span>{opt.icon}</span>
              {opt.label}
            </button>
          );
        })}
      </div>
      {sortType !== 'default' && enableDrag && (
        <span
          style={{
            fontSize: 11,
            color: '#95a5a6',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          💡 当前排序下不支持拖拽
        </span>
      )}
    </div>
  );

  const isDragEnabled = enableDrag && sortType === 'default';

  const listContent = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 280px)',
        gap: 24,
        justifyContent: 'center',
        padding: 8
      }}
      className="wish-grid"
    >
      {sortedWishes.map((wish, index) => (
        <Draggable key={wish.id} draggableId={wish.id} index={index} isDragDisabled={!isDragEnabled}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              style={{
                ...provided.draggableProps.style,
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <WishCard
                wish={wish}
                isDragging={snapshot.isDragging}
                onDelete={wish.isOwn ? () => deleteWish(wish.id) : undefined}
              />
            </div>
          )}
        </Draggable>
      ))}
    </div>
  );

  if (!isDragEnabled) {
    return (
      <div>
        {sortControls}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 280px)',
            gap: 24,
            justifyContent: 'center',
            padding: 8
          }}
          className="wish-grid"
        >
          {sortedWishes.map((wish) => (
            <div key={wish.id} style={{ display: 'flex', justifyContent: 'center' }}>
              <WishCard
                wish={wish}
                onDelete={wish.isOwn ? () => deleteWish(wish.id) : undefined}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {sortControls}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="wish-list" direction="vertical">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {listContent}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

export const WishList = memo(WishListComponent);
