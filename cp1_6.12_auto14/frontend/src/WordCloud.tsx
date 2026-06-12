import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';
import { WordItem, ThemeType, CloudConfig } from './types';

interface WordCloudProps {
  words: WordItem[];
  theme: ThemeType;
  config: CloudConfig;
  sourceText: string;
  onWordRemove: (word: string) => void;
}

export interface WordCloudHandle {
  exportPNG: () => void;
  exportSVG: () => void;
}

interface LayoutWord extends cloud.Word {
  text: string;
  frequency: number;
  indices: number[];
  originalIndex: number;
}

interface ContextInfo {
  word: WordItem;
  x: number;
  y: number;
}

const themeConfigs = {
  light: {
    background: 'linear-gradient(135deg, #f8f9fc 0%, #e8eefc 100%)',
    colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'],
  },
  dark: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    colors: ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#38d9a9', '#4dabf7', '#9775fa', '#f783ac'],
  },
  retro: {
    background: 'linear-gradient(135deg, #faf6ed 0%, #f0e6d3 100%)',
    colors: ['#8b4513', '#a0522d', '#b8860b', '#cd853f', '#d2691e', '#d2b48c', '#a67c52', '#8b7355'],
  },
  minimal: {
    background: 'linear-gradient(135deg, #f5f5f7 0%, #e8e8eb 100%)',
    colors: [],
  },
};

function getThemeColors(theme: ThemeType, freqRatio: number): string {
  const config = themeConfigs[theme];
  
  if (theme === 'minimal') {
    const grayStart = [52, 58, 64];
    const grayEnd = [173, 181, 189];
    const r = Math.round(grayStart[0] + (grayEnd[0] - grayStart[0]) * (1 - freqRatio));
    const g = Math.round(grayStart[1] + (grayEnd[1] - grayStart[1]) * (1 - freqRatio));
    const b = Math.round(grayStart[2] + (grayEnd[2] - grayStart[2]) * (1 - freqRatio));
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  if (theme === 'dark') {
    const t = Math.max(0, Math.min(1, freqRatio));
    const palette = [
      [255, 107, 107], [255, 169, 77], [255, 212, 59],
      [105, 219, 124], [56, 217, 169], [77, 171, 247],
      [151, 117, 250], [247, 131, 172]
    ];
    const idx = Math.min(palette.length - 1, Math.floor(t * palette.length));
    const nextIdx = Math.min(palette.length - 1, idx + 1);
    const localT = (t * palette.length) - idx;
    const c1 = palette[idx];
    const c2 = palette[nextIdx];
    const r = Math.round(c1[0] + (c2[0] - c1[0]) * localT);
    const g = Math.round(c1[1] + (c2[1] - c1[1]) * localT);
    const b = Math.round(c1[2] + (c2[2] - c1[2]) * localT);
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  const palette = config.colors;
  const t = Math.max(0, Math.min(1, freqRatio));
  const idx = Math.min(palette.length - 1, Math.floor(t * palette.length));
  return palette[idx];
}

function getFontFamily(style: string): string {
  switch (style) {
    case 'serif':
      return '"Times New Roman", "Songti SC", Georgia, serif';
    case 'handwriting':
      return '"Segoe Script", "Caveat", "Brush Script MT", "华文行楷", cursive';
    default:
      return '-apple-system, "PingFang SC", "Microsoft YaHei", BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  }
}

function getContextSnippet(text: string, index: number, word: string): string {
  const windowSize = 50;
  const start = Math.max(0, index - windowSize);
  const end = Math.min(text.length, index + word.length + windowSize);
  let snippet = text.substring(start, end);
  
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  
  return snippet;
}

const WordCloud = forwardRef<WordCloudHandle, WordCloudProps>(({
  words,
  theme,
  config,
  sourceText,
  onWordRemove,
}, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contextInfo, setContextInfo] = useState<ContextInfo | null>(null);
  const [renderedWords, setRenderedWords] = useState<LayoutWord[]>([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [removingWords, setRemovingWords] = useState<Set<string>>(new Set());
  const [isRendering, setIsRendering] = useState(false);
  
  const wordsRef = useRef(words);
  const themeRef = useRef(theme);
  const configRef = useRef(config);
  
  useEffect(() => { wordsRef.current = words; }, [words]);
  useEffect(() => { themeRef.current = theme; }, [theme]);
  useEffect(() => { configRef.current = config; }, [config]);
  
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(400, rect.width - 40),
          height: Math.max(400, rect.height - 40),
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  const computeLayout = useCallback((wordsToLayout: WordItem[]) => {
    if (wordsToLayout.length === 0) {
      setRenderedWords([]);
      return;
    }
    
    setIsRendering(true);
    const currentConfig = configRef.current;
    const { width, height } = dimensions;
    
    const maxFreq = Math.max(...wordsToLayout.map(w => w.frequency));
    const minSize = 12;
    const maxSize = 72;
    
    const wordsForLayout = wordsToLayout
      .slice(0, currentConfig.maxWords)
      .map((w, i) => ({
        text: w.text,
        frequency: w.frequency,
        indices: w.indices,
        originalIndex: i,
        size: minSize + (maxSize - minSize) * Math.pow(w.frequency / maxFreq, 0.7),
      }));
    
    const layout = cloud<LayoutWord>()
      .size([width, height])
      .words(wordsForLayout as any)
      .padding(Math.max(2, 8 - currentConfig.compactness * 6))
      .rotate(() => {
        const rotation = currentConfig.rotation;
        if (rotation === 0) return 0;
        const rand = Math.random();
        if (rand < 0.6) return 0;
        if (rand < 0.8) return rotation;
        return -rotation;
      })
      .font(getFontFamily(currentConfig.fontStyle))
      .fontSize((d: any) => d.size)
      .spiral('archimedean')
      .random(() => 0.5 + (Math.random() - 0.5) * 0.2);
    
    layout.on('end', (computedWords: LayoutWord[]) => {
      setRenderedWords(computedWords);
      setIsRendering(false);
    });
    
    layout.start();
  }, [dimensions]);
  
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      computeLayout(words);
    }, 150);
    return () => clearTimeout(debounceTimer);
  }, [words, config.maxWords, config.rotation, config.fontStyle, config.compactness, computeLayout]);
  
  const dragRef = useRef<{
    active: boolean;
    word: LayoutWord | null;
    offsetX: number;
    offsetY: number;
    moved: boolean;
  }>({ active: false, word: null, offsetX: 0, offsetY: 0, moved: false });
  
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;
    const currentTheme = themeRef.current;
    const maxFreq = renderedWords.length > 0 
      ? Math.max(...renderedWords.map(w => w.frequency)) 
      : 1;
    
    svg.selectAll('*').remove();
    
    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);
    
    const wordSelection = g.selectAll('text')
      .data(renderedWords.filter(w => !removingWords.has(w.text)), (d: any) => d.text)
      .enter()
      .append('text')
      .attr('class', 'word-text')
      .attr('text-anchor', 'middle')
      .attr('font-family', (d: any) => d.font)
      .style('font-size', 0)
      .attr('fill', (d: any) => getThemeColors(currentTheme, d.frequency / maxFreq))
      .attr('transform', (d: any) => {
        const t = `translate(${d.x || 0},${d.y || 0}) rotate(${d.rotate || 0})`;
        return t;
      })
      .text((d: any) => d.text)
      .style('opacity', 0)
      .style('font-size', (d: any) => `${d.size}px`)
      .style('font-weight', (d: any) => {
        const ratio = d.frequency / maxFreq;
        return ratio > 0.6 ? 700 : ratio > 0.3 ? 600 : 500;
      })
      .style('paint-order', 'stroke fill')
      .style('-webkit-tap-highlight-color', 'transparent');
    
    wordSelection
      .transition()
      .duration(800)
      .ease(d3.easeElasticOut.amplitude(1).period(0.5))
      .style('opacity', 1);
    
    wordSelection
      .on('click', function(event: MouseEvent, d: any) {
        event.stopPropagation();
        if (dragRef.current.moved) return;
        
        const wordItem = words.find(w => w.text === d.text);
        if (!wordItem) return;
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const cardWidth = 380;
        const cardHeight = 320;
        
        let x = event.clientX + 16;
        let y = event.clientY + 16;
        
        if (x + cardWidth > viewportWidth - 20) {
          x = event.clientX - cardWidth - 16;
        }
        if (y + cardHeight > viewportHeight - 20) {
          y = event.clientY - cardHeight - 16;
        }
        x = Math.max(20, x);
        y = Math.max(20, y);
        
        setContextInfo({ word: wordItem, x, y });
      })
      .on('contextmenu', function(event: MouseEvent, d: any) {
        event.preventDefault();
        event.stopPropagation();
        handleRemoveWord(d.text);
      })
      .on('mousedown', function(event: MouseEvent, d: any) {
        event.stopPropagation();
        dragRef.current = {
          active: true,
          word: d,
          offsetX: event.offsetX,
          offsetY: event.offsetY,
          moved: false,
        };
        d3.select(this).classed('dragging', true);
        d3.select(this).style('transform', 'scale(1.1)');
        (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
      });
    
    const container = containerRef.current;
    if (container) {
      container.onmousemove = (e: MouseEvent) => {
        if (!dragRef.current.active || !dragRef.current.word) return;
        
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (!svgRect) return;
        
        const centerX = svgRect.left + svgRect.width / 2;
        const centerY = svgRect.top + svgRect.height / 2;
        
        const newX = e.clientX - centerX;
        const newY = e.clientY - centerY;
        
        const word = dragRef.current.word;
        dragRef.current.moved = true;
        word.x = newX;
        word.y = newY;
        
        wordSelection
          .filter((d: any) => d.text === word.text)
          .attr('transform', `translate(${newX},${newY}) rotate(${word.rotate || 0})`);
      };
      
      container.onmouseup = () => {
        if (dragRef.current.active) {
          wordSelection.classed('dragging', false);
          dragRef.current.active = false;
          setTimeout(() => {
            dragRef.current.moved = false;
          }, 50);
        }
      };
    }
    
  }, [renderedWords, dimensions, theme, removingWords, words]);
  
  const handleRemoveWord = useCallback((wordText: string) => {
    setRemovingWords(prev => new Set([...prev, wordText]));
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('text')
      .filter((d: any) => d && d.text === wordText)
      .classed('removing', true);
    
    setTimeout(() => {
      setRemovingWords(prev => {
        const next = new Set(prev);
        next.delete(wordText);
        return next;
      });
      onWordRemove(wordText);
    }, 400);
  }, [onWordRemove]);
  
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (contextInfo) {
        const card = document.querySelector('.context-card');
        if (card && !card.contains(e.target as Node)) {
          setContextInfo(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [contextInfo]);
  
  useImperativeHandle(ref, () => ({
    exportPNG: () => {
      const svg = svgRef.current;
      if (!svg) return;
      
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 2;
        canvas.width = dimensions.width * scale;
        canvas.height = dimensions.height * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.scale(scale, scale);
        
        const bgConfig = themeConfigs[theme];
        if (bgConfig.background.includes('gradient')) {
          ctx.fillStyle = theme === 'light' ? '#f8f9fc' 
            : theme === 'dark' ? '#0f172a'
            : theme === 'retro' ? '#faf6ed'
            : '#f5f5f7';
        }
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
        ctx.drawImage(img, 0, 0);
        
        URL.revokeObjectURL(url);
        
        canvas.toBlob((blob) => {
          if (!blob) return;
          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `wordcloud-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(downloadUrl);
        }, 'image/png');
      };
      img.src = url;
    },
    
    exportSVG: () => {
      const svg = svgRef.current;
      if (!svg) return;
      
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      const svgData = new XMLSerializer().serializeToString(clone);
      const svgBlob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${svgData}`], { 
        type: 'image/svg+xml;charset=utf-8' 
      });
      
      const url = URL.createObjectURL(svgBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wordcloud-${Date.now()}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  }));
  
  const bgStyle = {
    background: themeConfigs[theme].background,
  };
  
  return (
    <div 
      className="wordcloud-container" 
      ref={containerRef}
      style={bgStyle}
    >
      {renderedWords.length === 0 && (
        <div className="empty-state">
          {isRendering ? (
            <>
              <div className="loading-spinner" />
              <div className="empty-title">正在生成词云...</div>
            </>
          ) : (
            <>
              <svg className="empty-icon" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                <path d="M25 55 Q30 35, 50 35 Q70 35, 75 55 Q70 75, 50 75 Q30 75, 25 55 Z" 
                  fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                <text x="50" y="58" textAnchor="middle" fill="rgba(255,255,255,0.6)" 
                  fontSize="16" fontWeight="600" fontFamily="sans-serif">词</text>
              </svg>
              <div className="empty-title">开始创建词云</div>
              <div className="empty-desc">
                在左侧输入框中粘贴或输入文本内容，系统将自动分析词频并生成精美的交互式词云
              </div>
            </>
          )}
        </div>
      )}
      
      <svg
        ref={svgRef}
        className="wordcloud-svg"
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        style={{
          background: theme === 'light' ? 'transparent' 
            : theme === 'dark' ? 'transparent'
            : theme === 'retro' ? 'transparent'
            : 'transparent',
          borderRadius: 16,
        }}
      />
      
      {contextInfo && (
        <div 
          className="context-card"
          style={{ left: contextInfo.x, top: contextInfo.y }}
        >
          <div className="context-card-header">
            <div className="context-word">{contextInfo.word.text}</div>
            <button 
              className="context-close" 
              onClick={() => setContextInfo(null)}
            >
              ✕
            </button>
          </div>
          
          <div className="context-meta">
            <div className="context-meta-item">
              <span className="context-meta-label">出现频次</span>
              <span className="context-meta-value">{contextInfo.word.frequency}</span>
            </div>
            <div className="context-meta-item">
              <span className="context-meta-label">位置次数</span>
              <span className="context-meta-value">{contextInfo.word.indices.length}</span>
            </div>
          </div>
          
          <div className="context-snippets">
            {contextInfo.word.indices.slice(0, 3).map((idx, i) => {
              const snippet = getContextSnippet(sourceText, idx, contextInfo.word.text);
              const parts = snippet.split(contextInfo.word.text);
              return (
                <div key={i} className="context-snippet">
                  {parts.map((part, j, arr) => (
                    <React.Fragment key={j}>
                      {part}
                      {j < arr.length - 1 && (
                        <span className="highlight">{contextInfo.word.text}</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              );
            })}
            {contextInfo.word.indices.length === 0 && (
              <div className="context-snippet">无上下文摘录</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

WordCloud.displayName = 'WordCloud';

export default WordCloud;
