import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { FixedSizeList as List, areEqual } from 'react-window';
import dayjs from 'dayjs';
import { useMemoryStore } from '../store/memoryStore';
import type { Memory } from '../types';

interface CardProps {
  data: Memory;
  index: number;
  isDragging: boolean;
  isDragOver: boolean;
  dragOverPosition: 'before' | 'after' | null;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const MemoryCard = ({
  data,
  index,
  isDragging,
  isDragOver,
  dragOverPosition,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onEdit,
  onDelete,
}: CardProps) => {
  const isLast = false;

  return (
    <div
      style={{
        position: 'relative',
        padding: '0 16px 0 28px',
        height: '96px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '19px',
          top: '0',
          bottom: '0',
          width: '2px',
          backgroundColor: index === 0 && isDragOver && dragOverPosition === 'before' ? '#40916c' : '#d8f3dc',
          zIndex: 0,
        }}
      />
      {isDragOver && dragOverPosition === 'before' && (
        <div
          style={{
            position: 'absolute',
            left: '8px',
            top: '-2px',
            right: '8px',
            height: '4px',
            backgroundColor: '#40916c',
            borderRadius: '2px',
            zIndex: 10,
          }}
        />
      )}
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', String(index));
          onDragStart(index);
        }}
        onDragOver={(e) => onDragOver(e, index)}
        onDrop={() => onDrop(index)}
        onDragEnd={onDragEnd}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          width: '100%',
          padding: '12px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: isDragging
            ? '0 8px 24px rgba(45, 106, 79, 0.25)'
            : '0 2px 8px rgba(0,0,0,0.06)',
          transform: isDragging ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          zIndex: isDragging ? 20 : 1,
          cursor: 'grab',
          border: isDragging ? '2px solid #95d5b2' : 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '-19px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#2d6a4f',
            border: '2px solid white',
            zIndex: 5,
          }}
        />
        {data.imageUrl ? (
          <img
            src={data.imageUrl}
            alt={data.title}
            loading="lazy"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              objectFit: 'cover',
              flexShrink: 0,
              border: '2px solid #d8f3dc',
            }}
          />
        ) : (
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#d8f3dc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              flexShrink: 0,
            }}
          >
            📷
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div
            style={{
              color: '#2d6a4f',
              fontWeight: 700,
              fontSize: '14px',
              marginBottom: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {dayjs(data.date).format('YYYY年MM月DD日')}
          </div>
          <div
            style={{
              color: '#1a1a2e',
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {data.title}
          </div>
          <div
            style={{
              color: '#4a4a6a',
              fontSize: '14px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {data.description}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(data.id);
            }}
            draggable={false}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#f0f0f0',
              color: '#4a4a6a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#d8f3dc';
              e.currentTarget.style.color = '#2d6a4f';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
              e.currentTarget.style.color = '#4a4a6a';
            }}
            title="编辑"
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('确定要删除这条记忆吗？')) onDelete(data.id);
            }}
            draggable={false}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#f0f0f0',
              color: '#4a4a6a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ffe0e0';
              e.currentTarget.style.color = '#d63031';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
              e.currentTarget.style.color = '#4a4a6a';
            }}
            title="删除"
          >
            🗑️
          </button>
        </div>
      </div>
      {isDragOver && dragOverPosition === 'after' && (
        <div
          style={{
            position: 'absolute',
            left: '8px',
            bottom: '-2px',
            right: '8px',
            height: '4px',
            backgroundColor: '#40916c',
            borderRadius: '2px',
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
};

interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    memories: Memory[];
    draggingIndex: number | null;
    dragOverIndex: number | null;
    dragOverPosition: 'before' | 'after' | null;
    onDragStart: (index: number) => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDrop: (index: number) => void;
    onDragEnd: () => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
  };
}

const Row = ({ index, style, data }: RowProps) => {
  const memory = data.memories[index];
  if (!memory) return null;

  return (
    <div style={{ ...style, overflow: 'visible' }}>
      <MemoryCard
        data={memory}
        index={index}
        isDragging={data.draggingIndex === index}
        isDragOver={data.dragOverIndex === index}
        dragOverPosition={data.dragOverIndex === index ? data.dragOverPosition : null}
        onDragStart={data.onDragStart}
        onDragOver={data.onDragOver}
        onDrop={data.onDrop}
        onDragEnd={data.onDragEnd}
        onEdit={data.onEdit}
        onDelete={data.onDelete}
      />
    </div>
  );
};

const MemoRow = React.memo(Row, areEqual);

const TimelinePanel = () => {
  const memories = useMemoryStore((s) => s.memories);
  const reorderMemories = useMemoryStore((s) => s.reorderMemories);
  const setEditingId = useMemoryStore((s) => s.setEditingId);
  const deleteMemory = useMemoryStore((s) => s.deleteMemory);
  const setCurrentPlayIndex = useMemoryStore((s) => s.setCurrentPlayIndex);

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | null>(null);
  const [listHeight, setListHeight] = useState(400);

  const listRef = useRef<List>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      roRef.current = new ResizeObserver((entries) => {
        for (const e of entries) {
          setListHeight(e.contentRect.height);
        }
      });
      roRef.current.observe(scrollRef.current);
    }
    return () => {
      roRef.current?.disconnect();
    };
  }, []);

  const handleDragStart = useCallback((index: number) => {
    setDraggingIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const position = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    setDragOverIndex(index);
    setDragOverPosition(position);
  }, []);

  const handleDrop = useCallback(
    (index: number) => {
      if (draggingIndex === null || draggingIndex === undefined) return;
      let target = index;
      if (dragOverPosition === 'after') target = index + 1;
      if (draggingIndex < target) target -= 1;
      if (draggingIndex !== target) {
        reorderMemories(draggingIndex, target);
      }
      setDraggingIndex(null);
      setDragOverIndex(null);
      setDragOverPosition(null);
    },
    [draggingIndex, dragOverPosition, reorderMemories]
  );

  const handleDragEnd = useCallback(() => {
    setDraggingIndex(null);
    setDragOverIndex(null);
    setDragOverPosition(null);
  }, []);

  const handleEdit = useCallback(
    (id: string) => {
      setEditingId(id);
      const idx = memories.findIndex((m) => m.id === id);
      if (idx >= 0) setCurrentPlayIndex(idx);
    },
    [memories, setEditingId, setCurrentPlayIndex]
  );

  const itemData = useMemo(
    () => ({
      memories,
      draggingIndex,
      dragOverIndex,
      dragOverPosition,
      onDragStart: handleDragStart,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
      onDragEnd: handleDragEnd,
      onEdit: handleEdit,
      onDelete: deleteMemory,
    }),
    [
      memories,
      draggingIndex,
      dragOverIndex,
      dragOverPosition,
      handleDragStart,
      handleDragOver,
      handleDrop,
      handleDragEnd,
      handleEdit,
      deleteMemory,
    ]
  );

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        minHeight: 0,
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>📅</span>
          <span style={{ fontWeight: 700, fontSize: '16px', color: '#1a1a2e' }}>
            旅行时间轴
          </span>
        </div>
        <span style={{ fontSize: '13px', color: '#4a4a6a', backgroundColor: '#d8f3dc', padding: '2px 10px', borderRadius: '9999px', fontWeight: 600 }}>
          {memories.length} 段记忆
        </span>
      </div>
      <div ref={scrollRef} style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {memories.length === 0 ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              color: '#4a4a6a',
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '48px' }}>✈️</span>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>还没有旅行记忆</div>
            <div style={{ fontSize: '13px', opacity: 0.7 }}>
              点击顶部的"添加记忆"按钮开始记录你的旅行吧
            </div>
          </div>
        ) : (
          <List
            ref={listRef}
            height={listHeight}
            itemCount={memories.length}
            itemSize={96}
            width="100%"
            itemData={itemData}
            style={{ width: '100%', overflowX: 'hidden' }}
            outerElementType="div"
          >
            {MemoRow}
          </List>
        )}
      </div>
      <style>{`
        .ReactVirtualized__List { overflow-x: hidden !important; }
      `}</style>
    </div>
  );
};

export default TimelinePanel;
