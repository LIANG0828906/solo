import React, { useState, useRef, useEffect } from 'react';
import { Lock, Image } from 'lucide-react';
import type { Block as BlockType } from '../stores/editorStore';
import { useEditorStore } from '../stores/editorStore';
import { collaborationService } from '../services/collaborationService';
import { clampResize } from '../renderer/canvasRenderer';

interface BlockProps {
  block: BlockType;
  isSelected: boolean;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent, blockId: string) => void;
}

const Block: React.FC<BlockProps> = ({ block, isSelected, isDragging, onMouseDown }) => {
  const {
    updateBlock,
    lockBlock,
    unlockBlock,
    currentUserId,
    users,
    setUserEditingBlock,
  } = useEditorStore();

  const [isEditing, setIsEditing] = useState(false);
  const [resizing, setResizing] = useState<string | null>(null);
  const editRef = useRef<HTMLTextAreaElement | HTMLImageElement | null>(null);
  const resizeStartRef = useRef<{ x: number; y: number; block: BlockType } | null>(null);

  const isLocked = collaborationService.isBlockLockedByOther(block, currentUserId);
  const editingUser = collaborationService.getEditingUser(users, block);

  useEffect(() => {
    if (isEditing && editRef.current) {
      if (editRef.current instanceof HTMLTextAreaElement) {
        editRef.current.focus();
        editRef.current.select();
      }
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocked) return;
    if (block.type === 'image') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (ev) => {
        const file = (ev.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64 = e.target?.result as string;
            updateBlock(block.id, { content: base64 });
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      return;
    }

    lockBlock(block.id, currentUserId);
    setUserEditingBlock(currentUserId, block.id);
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    unlockBlock(block.id);
    setUserEditingBlock(currentUserId, null);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateBlock(block.id, { content: e.target.value });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    if (isLocked) return;
    setResizing(handle);
    resizeStartRef.current = { x: e.clientX, y: e.clientY, block: { ...block } };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizeStartRef.current) return;
      const deltaX = moveEvent.clientX - resizeStartRef.current.x;
      const deltaY = moveEvent.clientY - resizeStartRef.current.y;
      const updated = clampResize(
        resizeStartRef.current.block,
        handle as 'nw' | 'ne' | 'sw' | 'se',
        deltaX,
        deltaY
      );
      updateBlock(block.id, updated);
    };

    const handleMouseUp = () => {
      setResizing(null);
      resizeStartRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const renderContent = () => {
    if (block.type === 'title') {
      if (isEditing) {
        return (
          <textarea
            ref={editRef as React.RefObject<HTMLTextAreaElement>}
            value={block.content}
            onChange={handleContentChange}
            onBlur={handleBlur}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              resize: 'none',
              fontSize: 32,
              fontWeight: 'bold',
              color: '#111827',
              lineHeight: 1.3,
              padding: 8,
              fontFamily: 'inherit',
            }}
          />
        );
      }
      return (
        <div
          style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: '#111827',
            lineHeight: 1.3,
            padding: 8,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          {block.content}
        </div>
      );
    }

    if (block.type === 'text') {
      if (isEditing) {
        return (
          <textarea
            ref={editRef as React.RefObject<HTMLTextAreaElement>}
            value={block.content}
            onChange={handleContentChange}
            onBlur={handleBlur}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              resize: 'none',
              fontSize: 14,
              color: '#374151',
              lineHeight: 1.6,
              padding: 12,
              fontFamily: 'inherit',
            }}
          />
        );
      }
      return (
        <div
          style={{
            fontSize: 14,
            color: '#374151',
            lineHeight: 1.6,
            padding: 12,
            width: '100%',
            height: '100%',
            whiteSpace: 'pre-wrap',
            overflow: 'hidden',
          }}
        >
          {block.content}
        </div>
      );
    }

    if (block.type === 'image') {
      if (block.content) {
        return (
          <img
            ref={editRef as React.RefObject<HTMLImageElement>}
            src={block.content}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            alt=""
          />
        );
      }
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#F3F4F6',
            border: '2px dashed #D1D5DB',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9CA3AF',
            gap: 8,
          }}
        >
          <Image size={32} />
          <span style={{ fontSize: 14 }}>双击上传图片</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: block.x,
        top: block.y,
        width: block.width,
        height: block.height,
        cursor: isLocked ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.8 : 1,
        boxShadow: isDragging ? '0 4px 8px rgba(59, 130, 246, 0.3)' : 'none',
        transition: isDragging ? 'none' : 'box-shadow 0.2s ease, opacity 0.2s ease',
        zIndex: isSelected || isDragging ? 50 : 1,
      }}
      onMouseDown={(e) => !isLocked && !isEditing && onMouseDown(e, block.id)}
      onDoubleClick={handleDoubleClick}
    >
      {isSelected && !isLocked && (
        <div
          style={{
            position: 'absolute',
            inset: -2,
            border: '2px dashed #3B82F6',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
      )}

      {renderContent()}

      {isLocked && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(251, 191, 36, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            gap: 8,
          }}
        >
          <Lock size={28} color="#92400E" />
          <span style={{ fontSize: 12, color: '#92400E', fontWeight: 600 }}>
            {editingUser?.name || '其他用户'} 正在编辑
          </span>
        </div>
      )}

      {isSelected && !isLocked && !resizing && (
        <>
          {(['nw', 'ne', 'sw', 'se'] as const).map((handle) => {
            const posStyles: Record<string, React.CSSProperties> = {
              nw: { top: -6, left: -6, cursor: 'nwse-resize' },
              ne: { top: -6, right: -6, cursor: 'nesw-resize' },
              sw: { bottom: -6, left: -6, cursor: 'nesw-resize' },
              se: { bottom: -6, right: -6, cursor: 'nwse-resize' },
            };
            return (
              <div
                key={handle}
                style={{
                  position: 'absolute',
                  width: 12,
                  height: 12,
                  backgroundColor: '#ffffff',
                  border: '2px solid #3B82F6',
                  borderRadius: 2,
                  zIndex: 15,
                  ...posStyles[handle],
                }}
                onMouseDown={(e) => handleResizeMouseDown(e, handle)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = '#3B82F6';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = '#ffffff';
                }}
              />
            );
          })}
        </>
      )}
    </div>
  );
};

export default Block;
