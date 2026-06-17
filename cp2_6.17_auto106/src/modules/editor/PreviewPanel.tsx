import { useState, useEffect, useRef } from 'react';

interface PreviewPanelProps {
  output: string;
  isError: boolean;
  isRunning: boolean;
}

export function PreviewPanel({ output, isError, isRunning }: PreviewPanelProps) {
  const [displayedOutput, setDisplayedOutput] = useState('');
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const prevOutputRef = useRef('');

  useEffect(() => {
    if (!output) return;

    setShowPlaceholder(false);

    if (prevOutputRef.current === output) return;
    prevOutputRef.current = output;

    let index = 0;
    const speed = 15;

    const timer = setInterval(() => {
      if (index < output.length) {
        const chunkSize = Math.min(3, output.length - index);
        index += chunkSize;
        setDisplayedOutput(output.slice(0, index));
      } else {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [output]);

  useEffect(() => {
    if (isRunning) {
      setDisplayedOutput('');
      setShowPlaceholder(false);
    }
  }, [isRunning]);

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        backgroundColor: '#0F0F23',
        borderRadius: '8px',
        padding: '16px',
        overflow: 'auto',
        fontFamily: "'Consolas', monospace",
        fontSize: '16px',
        lineHeight: '1.6',
        color: isError ? '#FF6B6B' : '#FFFFFF',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        border: '1px solid #2D2D4A',
        position: 'relative',
      }}
    >
      {showPlaceholder && !isRunning && (
        <span style={{ color: '#6A6A8E', fontStyle: 'italic' }}>
          请运行代码
        </span>
      )}
      {displayedOutput}
      {isRunning && (
        <span
          style={{
            display: 'inline-block',
            width: '8px',
            height: '16px',
            backgroundColor: '#6C63FF',
            marginLeft: '2px',
            animation: 'blink 1s infinite',
            verticalAlign: 'text-bottom',
          }}
        />
      )}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
