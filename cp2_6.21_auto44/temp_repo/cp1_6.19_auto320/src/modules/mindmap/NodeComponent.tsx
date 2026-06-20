import React, { useState, useRef, useEffect } from 'react';
import { MindMapNode } from './types';
import { useMindMapStore } from './store';

interface NodeComponentProps {
  node: MindMapNode;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
}

const COLOR_PALETTE = ['#e94560', '#0f3460', '#533483', '#16213e', '#f39c12', '#27ae60', '#3498db', '#9b59b6'];

export const NodeComponent: React.FC<NodeComponentProps> = ({ node, isDragging, onMouseDown }) => {
  const {
    selectedNodeId,
    highlightNodeId,
    selectNode,
    editNode,
    addNode,
    removeNode,
    changeNodeColor,
    setNodeNote,
  } = useMindMapStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(node.text);
  const [showToolbar, setShowToolbar] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState(node.note || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const isSelected = selectedNodeId === node.id;
  const isHighlighted = highlightNodeId === node.id;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isSelected && !isEditing) {
      const timer = setTimeout(() => setShowToolbar(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowToolbar(false);
      setShowColorPicker(false);
    }
  }, [isSelected, isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditText(node.text);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectNode(node.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editText.trim() && editText !== node.text) {
        editNode(node.id, editText.trim());
      }
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    if (editText.trim() && editText !== node.text) {
      editNode(node.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    addNode(node.id);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(node.id);
  };

  const handleColorChange = (color: string, e: React.MouseEvent) => {
    e.stopPropagation();
    changeNodeColor(node.id, color);
    setShowColorPicker(false);
  };

  const handleOpenNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNoteText(node.note || '');
    setShowNoteModal(true);
  };

  const handleSaveNote = () => {
    setNodeNote(node.id, noteText);
    setShowNoteModal(false);
  };

  const toolbarOffsetX = 0;
  const toolbarOffsetY = -60;

  return (
    <>
      <div
        ref={nodeRef}
        className={`mindmap-node ${isDragging ? 'dragging' : ''} ${isHighlighted ? 'highlighted' : ''}`}
        style={{
          position: 'absolute',
          left: node.x - 30,
          top: node.y - 30,
          width: 60,
          height: 60,
          cursor: isEditing ? 'text' : 'grab',
          transform: isDragging ? 'scale(1.1)' : 'scale(1)',
          opacity: isDragging ? 0.8 : 1,
          transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease',
          zIndex: isSelected || isDragging ? 100 : 10,
        }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseDown={(e) => !isEditing && onMouseDown(e, node.id)}
      >
        <svg width="60" height="60" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
          {isSelected && (
            <circle
              cx="30"
              cy="30"
              r="34"
              fill="none"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          )}
          {isHighlighted && (
            <circle
              cx="30"
              cy="30"
              r="36"
              fill="none"
              stroke="#f39c12"
              strokeWidth="3"
              style={{ animation: 'pulse 1s ease-in-out infinite' }}
            />
          )}
        </svg>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            backgroundColor: node.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 12,
            fontWeight: 'bold',
            textAlign: 'center',
            padding: 4,
            boxShadow: isSelected ? '0 0 20px rgba(233, 69, 96, 0.5)' : '0 2px 8px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            wordBreak: 'break-word',
            lineHeight: 1.2,
          }}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'white',
                fontSize: 12,
                fontWeight: 'bold',
                textAlign: 'center',
                padding: 0,
              }}
            />
          ) : (
            <span style={{ maxHeight: '100%', overflow: 'hidden' }}>{node.text}</span>
          )}
        </div>

        {node.note && !isEditing && (
          <div
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              width: 16,
              height: 16,
              backgroundColor: '#f39c12',
              borderRadius: '50%',
              fontSize: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            📝
          </div>
        )}

        {showToolbar && !isEditing && (
          <div
            ref={toolbarRef}
            style={{
              position: 'absolute',
              left: `calc(50% + ${toolbarOffsetX}px)`,
              top: toolbarOffsetY,
              transform: 'translateX(-50%)',
              backgroundColor: '#16213e',
              borderRadius: 6,
              padding: '6px 8px',
              display: 'flex',
              gap: 6,
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              animation: 'fadeIn 0.3s ease',
              zIndex: 1000,
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleAddChild}
              title="添加子节点"
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                border: 'none',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              +
            </button>
            {node.parentId && (
              <button
                onClick={handleRemove}
                title="删除节点"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                  border: 'none',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: 16,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            )}
            <div style={{ position: 'relative' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPicker(!showColorPicker);
                }}
                title="更改颜色"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                  background: node.color,
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
              {showColorPicker && (
                <div
                  style={{
                    position: 'absolute',
                    top: 34,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 4,
                    padding: 6,
                    background: '#0f3460',
                    borderRadius: 6,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  }}
                >
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      onClick={(e) => handleColorChange(color, e)}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: color,
                        border: node.color === color ? '2px solid white' : 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleOpenNote}
              title={node.note ? '编辑备注' : '添加备注'}
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                border: 'none',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              📝
            </button>
          </div>
        )}
      </div>

      {showNoteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={() => setShowNoteModal(false)}
        >
          <div
            style={{
              background: '#16213e',
              borderRadius: 8,
              padding: 20,
              width: 360,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: 'white', margin: '0 0 12px 0', fontSize: 16 }}>节点备注</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="输入备注内容..."
              style={{
                width: '100%',
                minHeight: 120,
                background: '#0f3460',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 4,
                color: 'white',
                padding: 8,
                fontSize: 14,
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button
                onClick={() => setShowNoteModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 4,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                取消
              </button>
              <button
                onClick={handleSaveNote}
                style={{
                  padding: '8px 16px',
                  borderRadius: 4,
                  border: 'none',
                  background: '#e94560',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 'bold',
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
