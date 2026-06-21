import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ShapeType, ColorTheme, LayoutResult } from './types';
import { generateLayout } from './WordCloudEngine';
import { WordCloudRenderer } from './WordCloudRenderer';
import ControlPanel, { THEMES } from './ControlPanel';

const DEFAULT_TEXT = `Technology shapes the future of humanity in profound ways. Artificial intelligence and machine learning are transforming industries from healthcare to finance. Cloud computing enables businesses to scale rapidly while reducing infrastructure costs. The rise of blockchain technology promises decentralized systems that could revolutionize digital transactions. Quantum computing stands at the frontier of computational power, potentially solving problems classical computers cannot. Cybersecurity remains critical as digital threats evolve and become more sophisticated. The Internet of Things connects billions of devices, creating smart homes and intelligent cities. Robotics advances bring automation to manufacturing, logistics, and even healthcare surgery. Virtual reality and augmented reality are creating immersive experiences for education and entertainment. Data science empowers organizations to extract meaningful insights from vast datasets. Sustainable technology development focuses on reducing environmental impact while maintaining innovation. Open source communities drive collaborative software development across the globe. Edge computing brings processing power closer to data sources for faster response times. Natural language processing enables machines to understand and generate human language. Biotechnology merges with computing to unlock new frontiers in medicine and agriculture. Nanotechnology operates at the atomic level to create materials with extraordinary properties. Autonomous vehicles combine sensors, AI, and connectivity to navigate complex environments. Digital transformation reshapes traditional business models and customer experiences. Innovation ecosystems foster startups and entrepreneurship worldwide. Programming languages evolve to meet the demands of modern software development.`;

const App: React.FC = () => {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [minWords, setMinWords] = useState(40);
  const [shape, setShape] = useState<ShapeType>('circle');
  const [theme, setTheme] = useState<ColorTheme>(THEMES[0]);
  const [layout, setLayout] = useState<LayoutResult | null>(null);
  const [deletedWords, setDeletedWords] = useState<Set<string>>(new Set());
  const [selectedWordIndex, setSelectedWordIndex] = useState<number>(-1);
  const [colorPickerPos, setColorPickerPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WordCloudRenderer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutTimerRef = useRef<number>(0);

  const regenerateLayout = useCallback(
    (currentText: string, currentMinWords: number, currentShape: ShapeType, currentTheme: ColorTheme, currentDeleted: Set<string>) => {
      if (!canvasRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;

      const renderer = rendererRef.current;
      if (renderer) {
        renderer.setSize(width, height);
      }

      const result = generateLayout(
        currentText,
        currentMinWords,
        currentShape,
        currentTheme,
        width,
        height,
        currentDeleted
      );

      setLayout(result);
    },
    []
  );

  useEffect(() => {
    if (!canvasRef.current) return;
    const renderer = new WordCloudRenderer(canvasRef.current);
    rendererRef.current = renderer;

    renderer.setOnClick((index, x, y) => {
      setSelectedWordIndex(index);
      setColorPickerPos({ x, y });
    });

    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    clearTimeout(layoutTimerRef.current);
    layoutTimerRef.current = window.setTimeout(() => {
      regenerateLayout(text, minWords, shape, theme, deletedWords);
    }, 150);
  }, [text, minWords, shape, theme, deletedWords, regenerateLayout]);

  useEffect(() => {
    if (!rendererRef.current || !layout) return;
    rendererRef.current.render(layout, true);
  }, [layout]);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const container = containerRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;
      rendererRef.current.setSize(width, height);
      regenerateLayout(text, minWords, shape, theme, deletedWords);
    };

    window.addEventListener('resize', handleResize);
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [text, minWords, shape, theme, deletedWords, regenerateLayout]);

  const handleSavePNG = useCallback(() => {
    if (!rendererRef.current) return;
    const dataURL = rendererRef.current.getCanvasDataURL();
    const link = document.createElement('a');
    link.download = `word-cloud-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  }, []);

  const handleColorPick = useCallback(
    (color: string) => {
      if (!rendererRef.current || selectedWordIndex < 0 || !layout) return;
      rendererRef.current.updateWordColor(selectedWordIndex, color);
      if (layout && selectedWordIndex < layout.words.length) {
        const newLayout = { ...layout };
        newLayout.words = [...newLayout.words];
        newLayout.words[selectedWordIndex] = {
          ...newLayout.words[selectedWordIndex],
          color,
        };
        setLayout(newLayout);
      }
      setSelectedWordIndex(-1);
      setColorPickerPos(null);
    },
    [selectedWordIndex, layout]
  );

  const handleDeleteWord = useCallback(() => {
    if (!layout || selectedWordIndex < 0 || selectedWordIndex >= layout.words.length)
      return;
    const wordText = layout.words[selectedWordIndex].text;
    const newDeleted = new Set(deletedWords);
    newDeleted.add(wordText);
    setDeletedWords(newDeleted);
    setSelectedWordIndex(-1);
    setColorPickerPos(null);
  }, [layout, selectedWordIndex, deletedWords]);

  const closeColorPicker = useCallback(() => {
    setSelectedWordIndex(-1);
    setColorPickerPos(null);
  }, []);

  const selectedWordColor =
    layout && selectedWordIndex >= 0 && selectedWordIndex < layout.words.length
      ? layout.words[selectedWordIndex].color
      : '';

  return (
    <div
      className="app-container"
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        gap: 16,
        padding: 16,
        overflow: 'hidden',
      }}
      onClick={() => {
        if (colorPickerPos) closeColorPicker();
      }}
    >
      <div
        ref={containerRef}
        className="canvas-area"
        style={{
          flex: '1 1 0%',
          background: '#0F172A',
          borderRadius: 16,
          position: 'relative',
          overflow: 'hidden',
          minHeight: 400,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
          }}
        />

        {layout && layout.words.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#475569',
              fontSize: 16,
              textAlign: 'center',
            }}
          >
            请在右侧输入文本来生成词云
          </div>
        )}

        {colorPickerPos && selectedWordIndex >= 0 && (
          <div
            className="color-picker-overlay"
            onClick={(e) => e.stopPropagation()}
            style={{
              left: Math.min(
                colorPickerPos.x,
                (containerRef.current?.clientWidth || 400) - 320
              ),
              top: Math.max(0, colorPickerPos.y - 50),
            }}
          >
            {theme.colors.map((c, i) => (
              <div
                key={i}
                className={`color-swatch${c === selectedWordColor ? ' selected' : ''}`}
                style={{ background: c }}
                onClick={() => handleColorPick(c)}
              />
            ))}
            <button className="delete-word-btn" onClick={handleDeleteWord}>
              ✕
            </button>
          </div>
        )}
      </div>

      <ControlPanel
        text={text}
        minWords={minWords}
        shape={shape}
        theme={theme}
        onTextChange={setText}
        onMinWordsChange={setMinWords}
        onShapeChange={setShape}
        onThemeChange={setTheme}
        onSavePNG={handleSavePNG}
      />
    </div>
  );
};

export default App;
