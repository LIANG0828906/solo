import { useEffect, useRef } from 'react';

interface StoryDisplayProps {
  text: string;
  isTyping: boolean;
  onClick: () => void;
}

const StoryDisplay = ({ text, isTyping, onClick }: StoryDisplayProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [text]);

  const renderText = () => {
    const chars = text.split('');
    return chars.map((char, i) => {
      const isLast = i === chars.length - 1 && isTyping;
      if (char === '\n') {
        return (
          <br key={`br-${i}`} />
        );
      }
      return (
        <span
          key={`char-${i}`}
          className={isLast ? 'animate-char-glow' : ''}
          style={{
            color: isLast ? '#ffffff' : 'var(--text-primary)',
          }}
        >
          {char}
        </span>
      );
    });
  };

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className="flex-1 overflow-y-auto p-6 cursor-pointer"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div
        className="font-mono text-base leading-relaxed whitespace-pre-wrap"
        style={{ maxWidth: '800px', margin: '0 auto' }}
      >
        {text ? (
          renderText()
        ) : (
          <span style={{ color: 'var(--text-secondary)' }}>
            {isTyping ? '' : '等待故事开始...'}
          </span>
        )}
        {isTyping && (
          <span
            className="animate-cursor-blink ml-1 inline-block w-2"
            style={{
              backgroundColor: 'var(--text-primary)',
              height: '1.2em',
              verticalAlign: 'text-bottom',
            }}
          />
        )}
      </div>
      {isTyping && (
        <div
          className="text-center mt-4 font-mono text-xs"
          style={{ color: 'var(--text-secondary)' }}
        >
          [点击任意处跳过]
        </div>
      )}
    </div>
  );
};

export default StoryDisplay;
