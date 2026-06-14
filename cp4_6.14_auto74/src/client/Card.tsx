import React, { memo, useState, useRef, useCallback, useEffect } from 'react';
import { CardData } from './Store';

interface CardProps {
  card: CardData;
  isSelected: boolean;
  isEditing: boolean;
  isConnecting: boolean;
  isDeleteMode: boolean;
  editingContent?: string;
  onDoubleClick: (id: string) => void;
  onDragStart: (id: string, e: React.MouseEvent) => void;
  onConnectStart: (id: string, point: 'bottom' | 'top', e: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  onContentChange: (id: string, content: string) => void;
  onEditEnd: (id: string) => void;
  onConnectPointHover?: (cardId: string, point: 'bottom' | 'top' | null) => void;
}

export const Card = memo(function Card({
  card,
  isSelected,
  isEditing,
  isConnecting,
  isDeleteMode,
  editingContent,
  onDoubleClick,
  onDragStart,
  onConnectStart,
  onDelete,
  onContentChange,
  onEditEnd,
  onConnectPointHover,
}: CardProps) {
  const [localContent, setLocalContent] = useState(editingContent ?? card.content);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingContent !== undefined) {
      setLocalContent(editingContent);
    }
  }, [editingContent]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(
        inputRef.current.value.length,
        inputRef.current.value.length
      );
    }
  }, [isEditing]);

  const handleContentInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      if (val.length <= 100) {
        setLocalContent(val);
        onContentChange(card.id, val);
      }
    },
    [card.id, onContentChange]
  );

  const remaining = 100 - localContent.length;

  return (
    <div
      data-card-id={card.id}
      style={{
        width: 160,
        height: 120,
        borderRadius: 12,
        background: isEditing ? '#ffffff' : card.color,
        border: isSelected
          ? '2px solid #3b82f6'
          : isDeleteMode
          ? '2px solid #ef4444'
          : '1px solid rgba(0,0,0,0.1)',
        boxShadow: isSelected
          ? '0 4px 20px rgba(59,130,246,0.3)'
          : '0 2px 8px rgba(0,0,0,0.15)',
        transition:
          isEditing
            ? 'box-shadow 150ms ease'
            : 'box-shadow 150ms ease, border-color 150ms ease',
        cursor: isDeleteMode ? 'pointer' : isEditing ? 'text' : 'grab',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        padding: 10,
        position: 'relative',
      }}
      onMouseDown={(e) => {
        if (isEditing) return;
        if (isDeleteMode) {
          e.stopPropagation();
          onDelete(card.id);
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
      {isConnecting && (
        <div
          data-connect-point="top"
          style={{
            position: 'absolute',
            top: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: card.color,
            border: '2px solid #3b82f6',
            cursor: 'crosshair',
            zIndex: 20,
            boxShadow: '0 0 6px rgba(59,130,246,0.5)',
          }}
          onMouseEnter={() => onConnectPointHover?.(card.id, 'top')}
          onMouseLeave={() => onConnectPointHover?.(card.id, null)}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
          }}
        />
      )}

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
            background: 'rgba(226,232,240,0.8)',
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
            fontWeight: 600,
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
            value={localContent}
            onChange={handleContentInput}
            onBlur={() => onEditEnd(card.id)}
            maxLength={100}
            spellCheck={false}
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
              width: '100%',
            }}
          />
          <div
            style={{
              fontSize: 10,
              color: remaining <= 20 ? '#ef4444' : '#94a3b8',
              textAlign: 'right',
              marginTop: 2,
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
            <span style={{ color: '#64748b', fontStyle: 'italic', opacity: 0.8 }}>
              双击编辑...
            </span>
          )}
        </div>
      )}

      {isConnecting && (
        <div
          data-connect-point="bottom"
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
            boxShadow: '0 0 6px rgba(255,255,255,0.3)',
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            onConnectStart(card.id, 'bottom', e);
          }}
          onMouseEnter={() => onConnectPointHover?.(card.id, 'bottom')}
          onMouseLeave={() => onConnectPointHover?.(card.id, null)}
        />
      )}
    </div>
  );
});
