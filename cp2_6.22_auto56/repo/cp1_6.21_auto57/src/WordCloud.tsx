import { useEffect, useRef, useState, useCallback } from 'react';
import type { KeywordWeight } from './types';

interface WordCloudProps {
  keywords: KeywordWeight[];
  onWordClick: (word: KeywordWeight) => void;
}

interface WordPosition {
  word: string;
  weight: number;
  color: string;
  id: string;
  x: number;
  y: number;
  fontSize: number;
  width: number;
  height: number;
  rotated: boolean;
}

const WordCloud = ({ keywords, onWordClick }: WordCloudProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredWord, setHoveredWord] = useState<WordPosition | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });
  const wordsRef = useRef<WordPosition[]>([]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(rect.width, 400),
          height: 500
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const calculateFontSize = useCallback((weight: number, minWeight: number, maxWeight: number) => {
    const minFont = 14;
    const maxFont = 48;
    const normalized = (weight - minWeight) / (maxWeight - minWeight);
    return minFont + normalized * (maxFont - minFont);
  }, []);

  const checkCollision = useCallback((word: WordPosition, placed: WordPosition[]) => {
    const padding = 8;
    for (const placedWord of placed) {
      const overlapX = Math.abs(word.x - placedWord.x) < (word.width + placedWord.width) / 2 + padding;
      const overlapY = Math.abs(word.y - placedWord.y) < (word.height + placedWord.height) / 2 + padding;
      if (overlapX && overlapY) {
        return true;
      }
    }
    return false;
  }, []);

  const placeWords = useCallback(() => {
    if (!keywords.length || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const weights = keywords.map(k => k.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);

    const placed: WordPosition[] = [];
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    const sortedKeywords = [...keywords].sort((a, b) => b.weight - a.weight);

    for (const keyword of sortedKeywords) {
      const fontSize = calculateFontSize(keyword.weight, minWeight, maxWeight);
      ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif`;
      
      const metrics = ctx.measureText(keyword.word);
      const width = metrics.width;
      const height = fontSize * 1.2;
      
      const rotated = Math.random() > 0.7 && width > dimensions.width * 0.3;
      const actualWidth = rotated ? height : width;
      const actualHeight = rotated ? width : height;

      let placedWord: WordPosition | null = null;
      const maxAttempts = 500;
      let spiralAngle = 0;
      let spiralRadius = 0;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let x: number, y: number;
        
        if (attempt < 100) {
          x = centerX + (Math.random() - 0.5) * dimensions.width * 0.8;
          y = centerY + (Math.random() - 0.5) * dimensions.height * 0.8;
        } else {
          spiralAngle += 0.5;
          spiralRadius += 0.5;
          x = centerX + Math.cos(spiralAngle) * spiralRadius;
          y = centerY + Math.sin(spiralAngle) * spiralRadius;
        }

        const wordPos: WordPosition = {
          word: keyword.word,
          weight: keyword.weight,
          color: keyword.color,
          id: keyword.id,
          x,
          y,
          fontSize,
          width: actualWidth,
          height: actualHeight,
          rotated
        };

        if (!checkCollision(wordPos, placed) &&
            x - actualWidth / 2 > 10 &&
            x + actualWidth / 2 < dimensions.width - 10 &&
            y - actualHeight / 2 > 10 &&
            y + actualHeight / 2 < dimensions.height - 10) {
          placedWord = wordPos;
          break;
        }
      }

      if (placedWord) {
        placed.push(placedWord);
      }
    }

    wordsRef.current = placed;
    return placed;
  }, [keywords, dimensions, calculateFontSize, checkCollision]);

  const draw = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    const words = wordsRef.current;

    for (const word of words) {
      ctx.save();
      ctx.translate(word.x, word.y);
      
      if (word.rotated) {
        ctx.rotate(-Math.PI / 2);
      }

      const isHovered = hoveredWord && hoveredWord.id === word.id;
      const scale = isHovered ? 1.1 : 1;
      
      ctx.font = `600 ${word.fontSize * scale}px -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = word.color;
      ctx.fillText(word.word, 0, 0);
      
      ctx.restore();
    }
  }, [dimensions, hoveredWord]);

  useEffect(() => {
    placeWords();
    draw();
  }, [placeWords, draw]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const findWordAtPosition = (x: number, y: number): WordPosition | null => {
    for (let i = wordsRef.current.length - 1; i >= 0; i--) {
      const word = wordsRef.current[i];
      const halfWidth = word.width / 2;
      const halfHeight = word.height / 2;
      
      if (x >= word.x - halfWidth && x <= word.x + halfWidth &&
          y >= word.y - halfHeight && y <= word.y + halfHeight) {
        return word;
      }
    }
    return null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const word = findWordAtPosition(pos.x, pos.y);
    
    if (word) {
      setHoveredWord(word);
      canvasRef.current!.style.cursor = 'pointer';
    } else {
      setHoveredWord(null);
      canvasRef.current!.style.cursor = 'default';
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const word = findWordAtPosition(pos.x, pos.y);
    
    if (word) {
      const keyword = keywords.find(k => k.id === word.id);
      if (keyword) {
        onWordClick(keyword);
      }
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '500px', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseLeave={() => setHoveredWord(null)}
        style={{
          width: '100%',
          height: '100%',
          transition: 'all 0.2s ease'
        }}
      />
      {hoveredWord && (
        <div
          style={{
            position: 'absolute',
            left: hoveredWord.x + 10,
            top: hoveredWord.y - 30,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            color: '#FFFFFF',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            pointerEvents: 'none',
            zIndex: 10,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div style={{ fontWeight: '600' }}>{hoveredWord.word}</div>
          <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
            权重: {hoveredWord.weight}
          </div>
        </div>
      )}
    </div>
  );
};

export default WordCloud;
