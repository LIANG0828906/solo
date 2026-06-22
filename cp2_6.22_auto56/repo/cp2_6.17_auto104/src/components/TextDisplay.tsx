import { useEffect, useRef, useMemo } from 'react';
import { useTypingEngine } from '../hooks/useTypingEngine';

interface TextDisplayProps {
  onStart: () => void;
}

export function TextDisplay({ onStart }: TextDisplayProps) {
  const {
    currentText,
    status,
    flashIndex,
    heatmapMode,
    getCharStatus,
    getWordErrorRate,
  } = useTypingEngine();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);

  const words = useMemo(() => {
    const result: { word: string; isSpace: boolean; startIndex: number }[] = [];
    let currentWord = '';
    let wordStart = 0;

    for (let i = 0; i < currentText.length; i++) {
      const char = currentText[i];
      if (char === ' ' || char === '\n') {
        if (currentWord) {
          result.push({ word: currentWord, isSpace: false, startIndex: wordStart });
          currentWord = '';
        }
        result.push({ word: char, isSpace: true, startIndex: i });
      } else {
        if (!currentWord) {
          wordStart = i;
        }
        currentWord += char;
      }
    }
    if (currentWord) {
      result.push({ word: currentWord, isSpace: false, startIndex: wordStart });
    }
    return result;
  }, [currentText]);

  useEffect(() => {
    if (!heatmapMode || !canvasRef.current || !textContainerRef.current) return;

    const canvas = canvasRef.current;
    const container = textContainerRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const wordElements = container.querySelectorAll('.word-span:not(.space-word)');
    wordElements.forEach((el) => {
      const wordEl = el as HTMLElement;
      const word = wordEl.dataset.word || '';
      const errorRate = getWordErrorRate(word);
      if (errorRate > 0) {
        const wordRect = wordEl.getBoundingClientRect();
        const x = wordRect.left - rect.left;
        const y = wordRect.top - rect.top;
        const width = wordRect.width;
        const height = 8;

        const r = Math.round(166 + (243 - 166) * errorRate);
        const g = Math.round(227 + (139 - 227) * errorRate);
        const b = Math.round(161 + (168 - 161) * errorRate);

        const gradient = ctx.createLinearGradient(0, y + height, 0, y);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.6)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y - height - 6, width, height + 6);
      }
    });
  }, [heatmapMode, words, currentText, getWordErrorRate, status]);

  const handleClick = () => {
    if (status === 'idle') {
      onStart();
    }
  };

  if (status === 'idle') {
    return (
      <div className="text-display-container" onClick={handleClick} style={{ cursor: 'pointer' }}>
        <div className="start-prompt">
          Click here or start typing to begin
          <br />
          <span style={{ fontSize: '14px', opacity: 0.7 }}>
            60 second typing test
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="text-display-container">
      {heatmapMode && (
        <canvas
          ref={canvasRef}
          className="heatmap-canvas"
        />
      )}
      <div ref={textContainerRef} className="text-display">
        {words.map((wordItem, wordIndex) => {
          const { word, isSpace, startIndex } = wordItem;

          return (
            <span
              key={wordIndex}
              className={`word-span ${isSpace ? 'space-word' : ''}`}
              data-word={isSpace ? '' : word}
              style={{ display: 'inline' }}
            >
              {word.split('').map((char, charIndex) => {
                const globalIndex = startIndex + charIndex;
                const charStatus = getCharStatus(globalIndex);
                const isFlashing = flashIndex === globalIndex;

                const charClass = [
                  'char',
                  charStatus === 'correct' ? 'char-correct' : '',
                  charStatus === 'incorrect' ? 'char-incorrect' : '',
                  charStatus === 'current' ? 'char-current' : '',
                  isFlashing ? 'char-flash' : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <span key={charIndex} className={charClass}>
                    {char}
                  </span>
                );
              })}
            </span>
          );
        })}
      </div>
    </div>
  );
}
