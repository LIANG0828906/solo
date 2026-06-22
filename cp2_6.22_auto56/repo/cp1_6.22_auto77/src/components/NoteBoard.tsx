import React, { useState, useRef } from 'react';
import { Note } from '../types';
import { useMindMap } from '../context/MindMapContext';

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

interface NoteCardProps {
  note: Note;
  index: number;
  onDelete: () => void;
  onStartEdit: () => void;
  isEditing: boolean;
  editContent: string;
  setEditContent: (s: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  isDragging: boolean;
  dragOffset: { x: number; y: number } | null;
  onDragStart: (e: React.PointerEvent) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onDelete,
  onStartEdit,
  isEditing,
  editContent,
  setEditContent,
  onCommitEdit,
  onCancelEdit,
  isDragging,
  dragOffset,
  onDragStart,
}) => {
  const [translateX, setTranslateX] = useState(0);
  const startX = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const showDelete = translateX <= -60;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isEditing) return;
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    setTranslateX(Math.min(0, Math.max(-90, dx)));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (startX.current == null) return;
    const wasDragging = Math.abs(e.clientX - startX.current) > 5;
    startX.current = null;
    if (translateX <= -40) {
      setTranslateX(-72);
    } else if (!wasDragging && !showDelete) {
      onStartEdit();
    } else {
      setTranslateX(0);
    }
  };

  const style: React.CSSProperties = {
    position: 'relative',
    background: '#e6f0fa',
    borderRadius: 6,
    padding: isEditing ? '12px 14px' : '12px 14px 14px 14px',
    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
    transform: isDragging && dragOffset
      ? `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(1.02)`
      : `translateX(${translateX}px)`,
    transition: isDragging ? 'box-shadow 0.2s, transform 0.05s' : `transform 0.2s ${EASE}, box-shadow 0.2s ${EASE}`,
    zIndex: isDragging ? 100 : 1,
    touchAction: 'none',
    overflow: 'hidden',
  };

  const deleteBtnWidth = 72;

  return (
    <div
      style={{
        position: 'relative',
        marginBottom: 10,
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: deleteBtnWidth,
          background: '#e74c3c',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: `opacity 0.2s ${EASE}`,
          opacity: showDelete ? 1 : 0,
        }}
        onClick={onDelete}
      >
        删除
      </div>

      <div ref={cardRef} style={style} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={() => { startX.current = null; setTranslateX(0); }}>
        {isEditing ? (
          <div>
            <textarea
              autoFocus
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault();
                  onCommitEdit();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  onCancelEdit();
                }
              }}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                minHeight: 100,
                border: '1px solid #bcd7ef',
                outline: 'none',
                background: '#f5faff',
                borderRadius: 4,
                padding: 8,
                resize: 'vertical',
                fontSize: 13,
                lineHeight: 1.6,
                fontFamily: 'inherit',
                color: '#222',
                boxSizing: 'border-box',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 6,
                marginTop: 8,
              }}
            >
              <button
                onClick={onCancelEdit}
                style={{
                  padding: '4px 10px',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                取消
              </button>
              <button
                onClick={onCommitEdit}
                style={{
                  padding: '4px 10px',
                  border: 'none',
                  borderRadius: 4,
                  background: '#4a90d9',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                保存
              </button>
            </div>
            <div
              style={{
                position: 'absolute',
                left: 14,
                top: 14,
                width: 2,
                height: 14,
                background: '#4a90d9',
                animation: 'typewriter 0.8s steps(2) infinite',
              }}
            />
          </div>
        ) : (
          <div
            onPointerDown={onDragStart}
            style={{
              cursor: 'grab',
              minHeight: 40,
              transition: `height 0.2s ${EASE}`,
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: '#1a365d',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {note.content || <span style={{ color: '#94a3b8' }}>点击编辑便签...</span>}
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 10,
                color: '#7a93b0',
                textAlign: 'right',
              }}
            >
              🕒 {new Date(note.createdAt).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes typewriter {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export const NoteBoard: React.FC = () => {
  const { data, selectedNodeId, addNote, updateNote, deleteNote, reorderNotes } = useMindMap();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number; noteY: number; order: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const node = selectedNodeId ? data?.nodes[selectedNodeId] : null;
  const notes = data && selectedNodeId ? data.notes[selectedNodeId] || [] : [];
  const sortedNotes = [...notes].sort((a, b) => a.order - b.order);

  const commitEdit = () => {
    if (!editingId || !selectedNodeId) return;
    updateNote(selectedNodeId, editingId, editingContent);
    setEditingId(null);
  };

  const onDragStart = (noteId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const idx = sortedNotes.findIndex((n) => n.id === noteId);
    if (idx < 0) return;
    const itemEl = itemRefs.current.get(noteId);
    if (!itemEl) return;
    const rect = itemEl.getBoundingClientRect();
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      noteY: rect.top,
      order: idx,
    };
    setDraggingId(noteId);
    setDragPos({ x: 0, y: 0 });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onDragMove = (e: React.PointerEvent) => {
    if (!draggingId || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setDragPos({ x: dx * 0.05, y: dy });
    let newIdx = dragStart.current.order;
    for (let i = 0; i < sortedNotes.length; i++) {
      const el = itemRefs.current.get(sortedNotes[i].id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (e.clientY < r.top + r.height / 2) {
        newIdx = i;
        break;
      }
      newIdx = i + 1;
    }
    if (newIdx !== dragStart.current.order) {
      const ids = sortedNotes.map((n) => n.id);
      const [removed] = ids.splice(dragStart.current.order, 1);
      ids.splice(newIdx, 0, removed);
      dragStart.current.order = newIdx;
      if (selectedNodeId) reorderNotes(selectedNodeId, ids);
    }
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setDragPos(null);
    dragStart.current = null;
  };

  const boardContent = (
    <div
      ref={containerRef}
      onPointerMove={onDragMove}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: 16,
      }}
    >
      {!node ? (
        <div
          style={{
            color: '#888',
            fontSize: 13,
            textAlign: 'center',
            paddingTop: 40,
          }}
        >
          请先选择一个节点
        </div>
      ) : (
        <>
          <div
            style={{
              marginBottom: 16,
              padding: '10px 12px',
              background: 'linear-gradient(90deg, #e6f0fa, #f0f6ff)',
              borderRadius: 8,
              fontSize: 12,
              color: '#2c5282',
              fontWeight: 500,
              borderLeft: `3px solid ${node.colorTag || '#4a90d9'}`,
            }}
          >
            📌 当前节点：{node.text}
          </div>

          <div style={{ position: 'relative', minHeight: 20 }}>
            {sortedNotes.map((n) => (
              <div
                key={n.id}
                ref={(el) => {
                  if (el) itemRefs.current.set(n.id, el);
                  else itemRefs.current.delete(n.id);
                }}
                style={{
                  transform:
                    draggingId && dragStart.current && sortedNotes.findIndex((x) => x.id === n.id) !== dragStart.current.order
                      ? `translateY(0)`
                      : undefined,
                  transition: `transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                  animation: n.id === draggingId && !dragPos ? undefined : `noteFadeIn 0.3s ${EASE} both`,
                }}
              >
                <NoteCard
                  note={n}
                  index={n.order}
                  onDelete={() => {
                    if (selectedNodeId) deleteNote(selectedNodeId, n.id);
                  }}
                  onStartEdit={() => {
                    setEditingId(n.id);
                    setEditingContent(n.content);
                  }}
                  isEditing={editingId === n.id}
                  editContent={editingContent}
                  setEditContent={setEditingContent}
                  onCommitEdit={commitEdit}
                  onCancelEdit={() => setEditingId(null)}
                  isDragging={draggingId === n.id}
                  dragOffset={draggingId === n.id ? dragPos : null}
                  onDragStart={(e) => onDragStart(n.id, e)}
                />
              </div>
            ))}
          </div>

          {sortedNotes.length === 0 && (
            <div
              style={{
                color: '#94a3b8',
                fontSize: 12,
                textAlign: 'center',
                padding: '30px 0',
              }}
            >
              暂无便签，点击下方按钮添加
            </div>
          )}
        </>
      )}
      <style>{`
        @keyframes noteFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );

  const addButton = (
    <button
      disabled={!selectedNodeId}
      onClick={() => {
        if (selectedNodeId) addNote(selectedNodeId, '');
      }}
      style={{
        margin: '0 16px 16px 16px',
        padding: '10px 16px',
        border: 'none',
        borderRadius: 8,
        background: selectedNodeId ? 'linear-gradient(90deg, #4a90d9, #3182ce)' : '#cbd5e0',
        color: '#fff',
        fontSize: 13,
        fontWeight: 600,
        cursor: selectedNodeId ? 'pointer' : 'not-allowed',
        boxShadow: selectedNodeId ? '0 2px 8px rgba(74, 144, 217, 0.3)' : undefined,
        transition: `transform 0.15s ${EASE}`,
      }}
      onMouseEnter={(e) => selectedNodeId && ((e.currentTarget.style.transform = 'translateY(-1px)'))}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      ＋ 新增便签
    </button>
  );

  return (
    <>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#fafcff',
        }}
      >
        <div
          style={{
            padding: '16px 16px 10px 16px',
            borderBottom: '1px solid #edf2f7',
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#1a365d',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            📒 便签看板
          </div>
          <div style={{ fontSize: 11, color: '#718096', marginTop: 2 }}>
            左滑删除 · 点击编辑 · Ctrl+Enter 保存
          </div>
        </div>
        {boardContent}
        {addButton}
      </div>
    </>
  );
};
