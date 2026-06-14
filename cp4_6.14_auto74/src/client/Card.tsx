import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CardData } from './Store';

interface CardProps {
  card: CardData;
  isSelected: boolean;
  isEditing: boolean;
  isConnecting: boolean;
  isDeleteMode: boolean;
  onDoubleClick: (id: string) => void;
  onDragStart: (id: string, e: React.MouseEvent) => void;
  onConnectStart: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  onContentChange: (id: string, content: string) => void;
  onEditEnd: (id: string) => void;
}

export const Card: React.FC<CardProps> = ({
  card,
  isSelected,
  isEditing,
  isConnecting,
  isDeleteMode,
  onDoubleClick,
  onDragStart,
  onConnectStart,
  onDelete,
  onContentChange,
  onEditEnd,
}) => {
  const [editContent, setEditContent] = useState(card.content);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditContent(card.content);
  }, [card.content]);

  const handleContentInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      if (val.length <= 100) {
        setEditContent(val);
        onContentChange(card.id, val);
      }
    },
    [card.id, onContentChange]
  );

  const remaining = 100 - editContent.length;

  return (
    <div
      style={{
        position: 'absolute',
        left: card.x,
        top: card.y,
        width: 160,
        height: 120,
        borderRadius: 12,
        background: isEditing ? '#ffffff' : card.color,
        border: isSelected ? '2px solid #3b82f6' : isDeleteMode ? '2px solid #ef4444' : '1px solid rgba(0,0,0,0.1)',
        boxShadow: isSelected
          ? '0 4px 20px rgba(59,130,246,0.3)'
          : '0 2px 8px rgba(0,0,0,0.15)',
        transition: isEditing ? 'none' : 'left 0.25s cubic-bezier(.34,1.56,.64,1), top 0.25s cubic-bezier(.34,1.56,.64,1)',
        cursor: isDeleteMode ? 'pointer' : isEditing ? 'text' : 'grab',
        userSelect: 'none',
        zIndex: isSelected ? 10 : 1,
        display: 'flex',
        flexDirection: 'column',
        padding: 10,
      }}
      onMouseDown={(e) => {
        if (isEditing) return;
        if (isDeleteMode) {
          e.stopPropagation();
          onDelete(card.id);
          return;
        }
        if (isConnecting) {
          e.stopPropagation();
          onConnectStart(card.id, e);
          return;
        }
        e.stopPropagation();
        onDragStart(card.id, e);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick(card.id);
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 6,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          {card.authorAvatar}
        </div>
        <span
          style={{
            fontSize: 10,
            color: '#1e293b',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {card.authorName}
        </span>
      </div>

      {isEditing ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <textarea
            ref={inputRef}
            value={editContent}
            onChange={handleContentInput}
            onBlur={() => onEditEnd(card.id)}
            maxLength={100}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: 13,
              lineHeight: 1.4,
              color: '#1e293b',
              background: 'transparent',
              fontFamily: 'inherit',
            }}
          />
          <div
            style={{
              fontSize: 10,
              color: remaining <= 20 ? '#ef4444' : '#94a3b8',
              textAlign: 'right',
            }}
          >
            {remaining}
          </div>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            fontSize: 13,
            lineHeight: 1.4,
            color: '#1e293b',
            overflow: 'hidden',
            wordBreak: 'break-word',
          }}
        >
          {card.content || (
            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>双击编辑...</span>
          )}
        </div>
      )}

      {isConnecting && (
        <div
          style={{
            position: 'absolute',
            bottom: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: card.color,
            border: '2px solid #0f172a',
            cursor: 'crosshair',
            zIndex: 20,
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            onConnectStart(card.id, e);
          }}
        />
      )}
    </div>
  );
};
