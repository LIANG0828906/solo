import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import useDrawingStore from '@/store/drawingStore';

interface ToolbarProps {
  socketRef: React.MutableRefObject<Socket | null>;
}

const COLORS = [
  '#FF5722',
  '#FF9800',
  '#FFC107',
  '#4CAF50',
  '#2196F6',
  '#3F51B5',
  '#9C27B0',
  '#E91E63',
  '#000000',
  '#FFFFFF',
];

const Toolbar: React.FC<ToolbarProps> = ({ socketRef }) => {
  const {
    color,
    thickness,
    mode,
    setColor,
    setThickness,
    setMode,
    undo,
    redo,
    undoStack,
    redoStack,
    clearCanvas,
    currentSessionId,
    isPlaying,
    stopPlayback,
  } = useDrawingStore();

  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleUndo = () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }
    undo();
  };

  const handleRedo = () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }
    redo();
  };

  const handleClear = () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }
    if (window.confirm('确定要清空整个画布吗？此操作无法撤销。')) {
      clearCanvas();
      if (currentSessionId) {
        socketRef.current?.emit('clear-canvas', currentSessionId);
      }
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 64,
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '0 24px',
        boxShadow: '0 -2px 16px rgba(0, 0, 0, 0.2)',
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => {
            if (isPlaying) stopPlayback();
            setMode('brush');
          }}
          title="画笔"
          style={{
            width: 40,
            height: 40,
            borderRadius: 6,
            border: mode === 'brush' ? '2px solid #2196F6' : '2px solid transparent',
            backgroundColor: mode === 'brush' ? 'rgba(33, 150, 246, 0.2)' : 'rgba(255,255,255,0.1)',
            color: mode === 'brush' ? '#2196F6' : '#ccc',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (mode !== 'brush') {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (mode !== 'brush') {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
            }
          }}
        >
          <i className="fa-solid fa-paintbrush" />
        </button>

        <button
          onClick={() => {
            if (isPlaying) stopPlayback();
            setMode('eraser');
          }}
          title="橡皮擦"
          style={{
            width: 40,
            height: 40,
            borderRadius: 6,
            border: mode === 'eraser' ? '2px solid #FF5722' : '2px solid transparent',
            backgroundColor: mode === 'eraser' ? 'rgba(255, 87, 34, 0.2)' : 'rgba(255,255,255,0.1)',
            color: mode === 'eraser' ? '#FF5722' : '#ccc',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (mode !== 'eraser') {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (mode !== 'eraser') {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
            }
          }}
        >
          <i className="fa-solid fa-eraser" />
        </button>
      </div>

      <div
        style={{
          width: 1,
          height: 28,
          backgroundColor: 'rgba(255,255,255,0.2)',
          margin: '0 12px',
        }}
      />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="颜色选择"
          style={{
            width: 40,
            height: 40,
            borderRadius: 6,
            border: '2px solid rgba(255,255,255,0.3)',
            backgroundColor: color,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.1s ease-out',
            padding: 0,
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.92)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {color === '#FFFFFF' && <i className="fa-solid fa-palette" style={{ color: '#999' }} />}
        </button>

        {showColorPicker && (
          <div
            style={{
              position: 'absolute',
              bottom: 52,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(30, 30, 30, 0.98)',
              borderRadius: 8,
              padding: 10,
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 6,
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              zIndex: 200,
            }}
          >
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setMode('brush');
                  setShowColorPicker(false);
                }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: color === c ? '50%' : 6,
                  border: color === c ? '2px solid #2196F6' : '2px solid rgba(255,255,255,0.2)',
                  backgroundColor: c,
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.1s ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          width: 1,
          height: 28,
          backgroundColor: 'rgba(255,255,255,0.2)',
          margin: '0 12px',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minWidth: 160,
        }}
      >
        <i className="fa-solid fa-minus" style={{ color: '#999', fontSize: 10 }} />
        <div
          style={{
            position: 'relative',
            flex: 1,
            height: 28,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: 4,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 2,
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: `${((thickness - 3) / 17) * 100}%`,
              height: 4,
              backgroundColor: '#2196F6',
              borderRadius: 2,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: `${((thickness - 3) / 17) * 100}%`,
              width: thickness,
              height: thickness,
              borderRadius: '50%',
              backgroundColor: mode === 'eraser' ? '#FF5722' : color,
              border: '2px solid white',
              transform: 'translateX(-50%)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              transition: 'width 0.1s, height 0.1s',
            }}
          />
          <input
            type="range"
            min={3}
            max={20}
            value={thickness}
            onChange={(e) => setThickness(parseInt(e.target.value))}
            disabled={isPlaying}
            style={{
              position: 'absolute',
              width: '100%',
              height: 28,
              opacity: 0,
              cursor: isPlaying ? 'not-allowed' : 'pointer',
              margin: 0,
            }}
          />
        </div>
        <i className="fa-solid fa-plus" style={{ color: '#999', fontSize: 10 }} />
        <span
          style={{
            color: '#ccc',
            fontSize: 12,
            minWidth: 24,
            textAlign: 'center',
          }}
        >
          {thickness}
        </span>
      </div>

      <div
        style={{
          width: 1,
          height: 28,
          backgroundColor: 'rgba(255,255,255,0.2)',
          margin: '0 12px',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={handleUndo}
          title="撤销"
          disabled={isPlaying ? false : undoStack.length === 0}
          style={{
            width: 40,
            height: 40,
            borderRadius: 6,
            border: 'none',
            backgroundColor:
              isPlaying || undoStack.length === 0
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(255,255,255,0.1)',
            color: isPlaying || undoStack.length === 0 ? '#666' : '#ccc',
            cursor: isPlaying || undoStack.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!isPlaying && undoStack.length > 0) {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.color = '#2196F6';
            }
          }}
          onMouseLeave={(e) => {
            if (!isPlaying && undoStack.length > 0) {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = '#ccc';
            }
          }}
        >
          <i className="fa-solid fa-rotate-left" />
        </button>

        <button
          onClick={handleRedo}
          title="重做"
          disabled={isPlaying ? false : redoStack.length === 0}
          style={{
            width: 40,
            height: 40,
            borderRadius: 6,
            border: 'none',
            backgroundColor:
              isPlaying || redoStack.length === 0
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(255,255,255,0.1)',
            color: isPlaying || redoStack.length === 0 ? '#666' : '#ccc',
            cursor: isPlaying || redoStack.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!isPlaying && redoStack.length > 0) {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.color = '#2196F6';
            }
          }}
          onMouseLeave={(e) => {
            if (!isPlaying && redoStack.length > 0) {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = '#ccc';
            }
          }}
        >
          <i className="fa-solid fa-rotate-right" />
        </button>

        <div
          style={{
            width: 1,
            height: 20,
            backgroundColor: 'rgba(255,255,255,0.15)',
            margin: '0 4px',
          }}
        />

        <button
          onClick={handleClear}
          title="清空画布"
          style={{
            width: 40,
            height: 40,
            borderRadius: 6,
            border: 'none',
            backgroundColor: 'rgba(255,255,255,0.1)',
            color: '#ccc',
            cursor: isPlaying ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!isPlaying) {
              e.currentTarget.style.backgroundColor = 'rgba(255, 87, 34, 0.3)';
              e.currentTarget.style.color = '#FF5722';
            }
          }}
          onMouseLeave={(e) => {
            if (!isPlaying) {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = '#ccc';
            }
          }}
        >
          <i className="fa-solid fa-trash-can" />
        </button>
      </div>

      {showColorPicker && (
        <div
          onClick={() => setShowColorPicker(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 150,
          }}
        />
      )}
    </div>
  );
};

export default Toolbar;
