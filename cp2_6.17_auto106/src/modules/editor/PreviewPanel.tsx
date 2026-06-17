import { useState, useEffect, useRef } from 'react';
import type { Theme } from '@/types';

interface PreviewPanelProps {
  output: string;
  isError: boolean;
  isRunning: boolean;
  theme: Theme;
}

export function PreviewPanel({ output, isError, isRunning, theme }: PreviewPanelProps) {
  const [displayedOutput, setDisplayedOutput] = useState('');
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const prevOutputRef = useRef('');
  const isDark = theme === 'dark';
  const caretColor = isDark ? '#6C63FF' : '#6C63FF';
  const placeholderColor = isDark ? '#6A6A8E' : '#999999';

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
        backgroundColor: isDark ? '#0F0F23' : '#FFFFFF',
        borderRadius: '8px',
        padding: '16px',
        overflow: 'auto',
        fontFamily: "'Consolas', monospace",
        fontSize: '16px',
        lineHeight: '1.6',
        color: isError ? '#FF6B6B' : (isDark ? '#FFFFFF' : '#444444'),
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        border: `1px solid ${isDark ? '#2D2D4A' : '#DDDDDD'}`,
        position: 'relative',
        transition: 'all 0.3s ease',
      }}
    >
      {showPlaceholder && !isRunning && (
        <span
          style={{
            color: placeholderColor,
            fontStyle: 'italic',
            animation: 'placeholderFadeIn 0.5s ease forwards',
          }}
        >
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
            backgroundColor: caretColor,
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
        @keyframes placeholderFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
