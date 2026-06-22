import { useState, useRef, useEffect } from 'react';

interface AnnotationBubbleProps {
  lineNumber: number;
  x: number;
  y: number;
  onSave: (lineNumber: number, content: string) => void;
  onCancel: () => void;
}

const AnnotationBubble = ({ lineNumber, x, y, onSave, onCancel }: AnnotationBubbleProps) => {
  const [content, setContent] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (content.trim()) {
        onSave(lineNumber, content.trim());
      }
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y - 10,
        zIndex: 100,
        animation: 'bubbleIn 0.2s ease-in-out',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: -8,
          top: 20,
          width: 0,
          height: 0,
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          borderRight: '8px solid #252526',
        }}
      />
      <div
        style={{
          background: '#252526',
          borderRadius: 8,
          padding: 12,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          minWidth: 320,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: '#007ACC',
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          第 {lineNumber} 行 - 添加批注
        </div>
        <textarea
          ref={inputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入批注内容，按 Enter 保存，Shift+Enter 换行..."
          style={{
            width: 300,
            height: 80,
            background: '#1E1E2E',
            border: '1px solid #007ACC',
            borderRadius: 4,
            padding: 8,
            color: '#D4D4D4',
            fontSize: 13,
            fontFamily: 'system-ui, sans-serif',
            resize: 'none',
            outline: 'none',
            lineHeight: 1.5,
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 10,
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: '6px 14px',
              borderRadius: 4,
              border: 'none',
              background: '#3A3A3C',
              color: '#D4D4D4',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#4A4A4C';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#3A3A3C';
            }}
          >
            取消
          </button>
          <button
            onClick={() => content.trim() && onSave(lineNumber, content.trim())}
            disabled={!content.trim()}
            style={{
              padding: '6px 14px',
              borderRadius: 4,
              border: 'none',
              background: content.trim() ? '#007ACC' : '#3A3A3C',
              color: '#FFFFFF',
              fontSize: 12,
              cursor: content.trim() ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (content.trim()) {
                (e.currentTarget as HTMLButtonElement).style.background = '#0088DD';
              }
            }}
            onMouseLeave={(e) => {
              if (content.trim()) {
                (e.currentTarget as HTMLButtonElement).style.background = '#007ACC';
              }
            }}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnotationBubble;
