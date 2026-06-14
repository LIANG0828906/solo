import React, { memo, useState, useRef, useCallback, useEffect } from 'react';
import { CardData } from './Store';

interface CardProps {
  card: CardData;
  isSelected: boolean;
  isEditing: boolean;
  isConnecting: boolean;
  isDeleteMode: boolean;
  editingContent?: string;
  hoveredPointType?: 'top' | 'bottom' | null;
  onDoubleClick: (id: string) => void;
  onDragStart: (id: string, e: React.MouseEvent) => void;
  onConnectStart: (id: string, point: 'bottom' | 'top', e: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  onContentChange: (id: string, content: string) => void;
  onEditEnd: (id: string) => void;
  onConnectPointEnter?: (cardId: string, point: 'top' | 'bottom') => void;
  onConnectPointLeave?: (cardId: string) => void;
}

export const Card = memo(
  function Card({
    card,
    isSelected,
    isEditing,
    isConnecting,
    isDeleteMode,
    editingContent,
    hoveredPointType,
    onDoubleClick,
    onDragStart,
    onConnectStart,
    onDelete,
    onContentChange,
    onEditEnd,
    onConnectPointEnter,
    onConnectPointLeave,
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
        const len = inputRef.current.value.length;
        requestAnimationFrame(() => {
          inputRef.current?.setSelectionRange(len, len);
        });
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
            : '1px solid rgba(0,0,0,0.08)',
          boxShadow: isSelected
            ? '0 4px 20px rgba(59,130,246,0.35)'
            : '0 2px 8px rgba(0,0,0,0.12)',
          transition:
            isEditing
              ? 'box-shadow 150ms ease, border-color 150ms ease'
              : 'box-shadow 150ms ease, border-color 150ms ease, transform 150ms ease',
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
            data-card-id={card.id}
            style={{
              position: 'absolute',
              top: -10,
              left: '50%',
              transform: 'translateX(-50%)',
              width: hoveredPointType === 'top' ? 16 : 12,
              height: hoveredPointType === 'top' ? 16 : 12,
              borderRadius: '50%',
              background: hoveredPointType === 'top' ? '#22c55e' : card.color,
              border: hoveredPointType === 'top' ? '3px solid #ffffff' : '2px solid #3b82f6',
              cursor: 'crosshair',
              zIndex: 30,
              boxShadow:
                hoveredPointType === 'top'
                  ? '0 0 12px rgba(34,197,94,0.8), 0 0 4px rgba(255,255,255,0.6)'
                  : '0 0 6px rgba(59,130,246,0.5)',
              transition: 'all 120ms ease-out',
            }}
            onMouseEnter={() => onConnectPointEnter?.(card.id, 'top')}
            onMouseLeave={() => onConnectPointLeave?.(card.id)}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
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
              background: 'rgba(226,232,240,0.85)',
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
              fontSize: 11,
              color: '#1e293b',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.2,
            }}
          >
            {card.authorName}
          </span>
        </div>

        {isEditing ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <textarea
              ref={inputRef}
              value={localContent}
              onChange={handleContentInput}
              onBlur={() => onEditEnd(card.id)}
              maxLength={100}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontSize: 13,
                lineHeight: 1.45,
                color: '#1e293b',
                background: 'transparent',
                fontFamily: 'inherit',
                width: '100%',
                minHeight: 0,
                WebkitAppearance: 'none',
              }}
            />
            <div
              style={{
                fontSize: 10,
                color: remaining <= 20 ? '#ef4444' : '#94a3b8',
                textAlign: 'right',
                marginTop: 2,
                flexShrink: 0,
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
              lineHeight: 1.45,
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
            data-card-id={card.id}
            style={{
              position: 'absolute',
              bottom: -10,
              left: '50%',
              transform: 'translateX(-50%)',
              width: hoveredPointType === 'bottom' ? 16 : 12,
              height: hoveredPointType === 'bottom' ? 16 : 12,
              borderRadius: '50%',
              background: hoveredPointType === 'bottom' ? '#3b82f6' : card.color,
              border: hoveredPointType === 'bottom'
                ? '3px solid #ffffff'
                : '2px solid #0f172a',
              cursor: 'crosshair',
              zIndex: 30,
              boxShadow:
                hoveredPointType === 'bottom'
                  ? '0 0 12px rgba(59,130,246,0.8), 0 0 4px rgba(255,255,255,0.6)'
                  : '0 0 6px rgba(255,255,255,0.3)',
              transition: 'all 120ms ease-out',
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onConnectStart(card.id, 'bottom', e);
            }}
            onMouseEnter={() => onConnectPointEnter?.(card.id, 'bottom')}
            onMouseLeave={() => onConnectPointLeave?.(card.id)}
          />
        )}
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.card.id === next.card.id &&
      prev.card.x === next.card.x &&
      prev.card.y === next.card.y &&
      prev.card.content === next.card.content &&
      prev.card.color === next.card.color &&
      prev.card.authorName === next.card.authorName &&
      prev.card.authorAvatar === next.card.authorAvatar &&
      prev.isSelected === next.isSelected &&
      prev.isEditing === next.isEditing &&
      prev.isConnecting === next.isConnecting &&
      prev.isDeleteMode === next.isDeleteMode &&
      prev.editingContent === next.editingContent &&
      prev.hoveredPointType === next.hoveredPointType
    );
  }
);
