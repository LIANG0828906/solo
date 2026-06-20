import { useEffect, useRef } from 'react';
import { usePoemStore, themeConfig } from '../store/poemStore';
import { poems } from '../data/poems';
import './PoemDisplay.css';

const PoemDisplay = () => {
  const { currentPoemIndex, printPosition, theme, speed, isPlaying, incrementPrintPosition, setIsPlaying } = usePoemStore();
  const poem = poems[currentPoemIndex];
  const currentTheme = themeConfig[theme];
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    if (printPosition >= poem.content.length) {
      setIsPlaying(false);
      return;
    }

    const currentChar = poem.content[printPosition];
    
    let extraDelay = 0;
    if (['。', '！', '？', '.', '!', '?'].includes(currentChar)) {
      extraDelay = 300;
    } else if (['，', '；', ',', ';'].includes(currentChar)) {
      extraDelay = 150;
    }

    const totalDelay = speed + extraDelay;

    timeoutRef.current = setTimeout(() => {
      incrementPrintPosition();
    }, totalDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [printPosition, speed, isPlaying, poem.content, incrementPrintPosition, setIsPlaying]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const displayedText = poem.content.slice(0, printPosition);
  const progress = poem.content.length > 0 
    ? Math.round((printPosition / poem.content.length) * 100) 
    : 0;

  const containerStyle: React.CSSProperties = {
    fontFamily: currentTheme.fontFamily,
    color: currentTheme.color,
    lineHeight: currentTheme.lineHeight,
    letterSpacing: currentTheme.letterSpacing,
    transition: 'all 0.3s ease-in-out',
  };

  return (
    <div className="poem-display-container" style={containerStyle}>
      <div className="poem-header">
        <div className="poet-name">{poem.poet}</div>
        <div className="poem-title">{poem.title}</div>
      </div>
      <div className="poem-content">
        {displayedText.split('\n').map((line, index, arr) => (
          <span key={index}>
            {line}
            {index < arr.length - 1 && <br />}
          </span>
        ))}
        <span className={`cursor ${isPlaying ? 'playing' : ''}`}>|</span>
      </div>
      <div className="progress-indicator">{progress}%</div>
    </div>
  );
};

export default PoemDisplay;
