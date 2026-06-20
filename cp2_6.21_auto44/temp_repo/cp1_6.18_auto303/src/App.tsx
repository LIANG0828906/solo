import { useState, useCallback, useRef, useEffect } from 'react';
import CodeEditor from './components/CodeEditor';
import ProbabilityCloud from './components/ProbabilityCloud';

export default function App() {
  const [leftWidth, setLeftWidth] = useState(40);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;
    const newWidthPercent = (mouseX / containerWidth) * 100;
    
    setLeftWidth(Math.max(20, Math.min(80, newWidthPercent)));
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#252526',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
    }}>
      <div style={{
        height: '50px',
        backgroundColor: '#1E1E1E',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid #3E3E3E',
        flexShrink: 0,
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#FFFFFF',
          letterSpacing: '1px',
        }}>
          代码量子态
        </h1>
      </div>

      <div 
        ref={containerRef}
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        <div style={{
          width: `${leftWidth}%`,
          minWidth: '200px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}>
          <div style={{
            marginBottom: '8px',
            fontSize: '13px',
            color: '#CCCCCC',
            fontWeight: 500,
          }}>
            代码编辑器
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <CodeEditor />
          </div>
        </div>

        <div
          onMouseDown={handleMouseDown}
          style={{
            width: '4px',
            backgroundColor: '#555555',
            cursor: 'col-resize',
            flexShrink: 0,
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!isDraggingRef.current) {
              e.currentTarget.style.backgroundColor = '#888888';
            }
          }}
          onMouseLeave={(e) => {
            if (!isDraggingRef.current) {
              e.currentTarget.style.backgroundColor = '#555555';
            }
          }}
        />

        <div style={{
          flex: 1,
          minWidth: '400px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          borderLeft: '1px solid #3E3E3E',
        }}>
          <div style={{
            marginBottom: '8px',
            fontSize: '13px',
            color: '#CCCCCC',
            fontWeight: 500,
          }}>
            量子态概率云图
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ProbabilityCloud />
          </div>
        </div>
      </div>
    </div>
  );
}
