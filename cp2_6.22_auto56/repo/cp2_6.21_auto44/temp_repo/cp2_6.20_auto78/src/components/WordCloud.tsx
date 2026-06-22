import React, { useEffect, useRef, useState, useMemo } from 'react';
import cloud from 'd3-cloud';
import { scaleLinear } from 'd3-scale';
import { WordItem, sentimentColors } from '../store/useDataStore';

interface WordCloudProps {
  words: WordItem[];
  width?: number;
  height?: number;
}

interface LayoutWord {
  text: string;
  size: number;
  x: number;
  y: number;
  rotate: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  count: number;
}

const WordCloudComponent: React.FC<WordCloudProps> = ({ words, width = 500, height = 400 }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [layoutWords, setLayoutWords] = useState<LayoutWord[]>([]);
  const [dimensions, setDimensions] = useState({ width, height });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(rect.width - 20, 300),
          height: Math.max(rect.height - 20, 280),
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fontSizeScale = useMemo(() => {
    if (words.length === 0) return scaleLinear().range([12, 48]);
    const counts = words.map(w => w.count);
    return scaleLinear()
      .domain([Math.min(...counts), Math.max(...counts)])
      .range([14, 56]);
  }, [words]);

  useEffect(() => {
    if (words.length === 0) return;

    const layout = cloud()
      .size([dimensions.width, dimensions.height])
      .words(words.map(w => ({
        text: w.text,
        size: fontSizeScale(w.count),
        sentiment: w.sentiment,
        count: w.count,
      })))
      .padding(5)
      .rotate(() => (Math.random() > 0.7 ? (Math.random() > 0.5 ? 30 : -30) : 0))
      .font('sans-serif')
      .fontSize(d => (d as any).size)
      .on('end', (computedWords: any[]) => {
        setLayoutWords(computedWords.map(w => ({
          text: w.text,
          size: w.size,
          x: w.x || 0,
          y: w.y || 0,
          rotate: w.rotate || 0,
          sentiment: w.sentiment,
          count: w.count,
        })));
      });

    layout.start();
  }, [words, dimensions, fontSizeScale]);

  const getColor = (sentiment: 'positive' | 'negative' | 'neutral') => {
    return sentimentColors[sentiment];
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1e293b',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <style>{`
        @keyframes wordFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes glowPulse {
          0%, 100% { filter: drop-shadow(0 0 2px currentColor); opacity: 0.9; }
          50% { filter: drop-shadow(0 0 8px currentColor); opacity: 1; }
        }
        .word-cloud-text {
          cursor: pointer;
          transition: all 0.3s ease;
          animation: wordFloat 4s ease-in-out infinite;
        }
        .word-cloud-text:hover {
          filter: drop-shadow(0 0 10px currentColor);
        }
        .top-word {
          animation: glowPulse 3s ease-in-out infinite;
          font-weight: 700;
        }
      `}</style>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`${-dimensions.width / 2} ${-dimensions.height / 2} ${dimensions.width} ${dimensions.height}`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {layoutWords.map((word, index) => {
          const isTopWord = index < 3;
          return (
            <text
              key={`${word.text}-${index}`}
              className={`word-cloud-text ${isTopWord ? 'top-word' : ''}`}
              style={{
                fontSize: word.size,
                fill: getColor(word.sentiment),
                color: getColor(word.sentiment),
                fontWeight: isTopWord ? 700 : 500,
                animationDelay: `${index * 0.1}s`,
              }}
              textAnchor="middle"
              transform={`translate(${word.x}, ${word.y}) rotate(${word.rotate})`}
            >
              <title>{`${word.text}\n词频: ${word.count}\n情感: ${word.sentiment === 'positive' ? '正面' : word.sentiment === 'negative' ? '负面' : '中性'}`}</title>
              {word.text}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export default WordCloudComponent;
