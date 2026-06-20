import React, { useState, useEffect, useRef } from 'react';
import useFlowStore from '../store/useFlowStore';

const PRESET_COLORS = [
  '#ffffff',
  '#fef2f2',
  '#fff7ed',
  '#fefce8',
  '#f0fdf4',
  '#ecfeff',
  '#eff6ff',
  '#f5f3ff',
  '#fdf4ff',
  '#fdf2f8',
  '#f3f4f6',
  '#e5e7eb',
];

const FONT_SIZES = [12, 14, 16, 18, 20];

const NodeEditor: React.FC = () => {
  const { selectedNodeId, nodes, updateNode, deleteNode } = useFlowStore();
  const [isVisible, setIsVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [color, setColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(16);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  useEffect(() => {
    if (selectedNode) {
      setTitle(selectedNode.data.title || selectedNode.data.label || '');
      setNote(selectedNode.data.note || '');
      setColor(selectedNode.data.color || '#ffffff');
      setFontSize(selectedNode.data.fontSize || 16);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [selectedNode]);

  useEffect(() => {
    if (noteRef.current) {
      noteRef.current.style.height = 'auto';
      noteRef.current.style.height = `${noteRef.current.scrollHeight}px`;
    }
  }, [note]);

  const debouncedUpdate = (updates: Record<string, any>) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (selectedNodeId) {
        updateNode(selectedNodeId, updates);
      }
    }, 100);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    debouncedUpdate({ title: value });
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNote(value);
    debouncedUpdate({ note: value });
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (selectedNodeId) {
      updateNode(selectedNodeId, { color: newColor });
    }
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    setFontSize(value);
    if (selectedNodeId) {
      updateNode(selectedNodeId, { fontSize: value });
    }
  };

  const handleDelete = () => {
    if (selectedNodeId) {
      deleteNode(selectedNodeId);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '320px',
        height: '100%',
        backgroundColor: '#f0f4f8',
        boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.1)',
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 200ms ease-out',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#1f2937',
            margin: 0,
          }}
        >
          节点属性
        </h3>
      </div>

      <div
        style={{
          padding: '20px',
          overflowY: 'auto',
          flex: 1,
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '8px',
            }}
          >
            节点标题
          </label>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="输入节点标题"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#1f2937',
              outline: 'none',
              transition: 'border-color 200ms ease, box-shadow 200ms ease',
              backgroundColor: '#ffffff',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#6366f1';
              e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '8px',
            }}
          >
            备注
          </label>
          <textarea
            ref={noteRef}
            value={note}
            onChange={handleNoteChange}
            placeholder="添加备注..."
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#1f2937',
              outline: 'none',
              resize: 'none',
              overflow: 'hidden',
              fontFamily: 'inherit',
              transition: 'border-color 200ms ease, box-shadow 200ms ease',
              backgroundColor: '#ffffff',
              minHeight: '60px',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#6366f1';
              e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '10px',
            }}
          >
            背景颜色
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '8px',
            }}
          >
            {PRESET_COLORS.map((presetColor) => (
              <button
                key={presetColor}
                onClick={() => handleColorChange(presetColor)}
                title={presetColor}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: color === presetColor ? '2px solid #6366f1' : '1px solid #d1d5db',
                  backgroundColor: presetColor,
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'border-color 200ms ease, transform 150ms ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {color === presetColor && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#6366f1',
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '8px',
            }}
          >
            字体大小
          </label>
          <select
            value={fontSize}
            onChange={handleFontSizeChange}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#1f2937',
              outline: 'none',
              cursor: 'pointer',
              backgroundColor: '#ffffff',
              transition: 'border-color 200ms ease, box-shadow 200ms ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#6366f1';
              e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = 'none';
            }}
          >
            {FONT_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
        </div>

        <div>
          <button
            onClick={handleDelete}
            style={{
              width: '100%',
              padding: '10px 16px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 200ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fecaca';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
            }}
          >
            删除节点
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeEditor;
