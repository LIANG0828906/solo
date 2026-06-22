import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import ColorInputPanel, { type ColorItem } from './components/ColorInputPanel';
import HeatmapMatrix, { type MatrixCellData } from './components/HeatmapMatrix';
import DetailPanel from './components/DetailPanel';
import PreviewMode from './components/PreviewMode';
import { calculateContrastRatio } from './utils/contrastCalculator';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

interface SchemeData {
  foregroundColors: ColorItem[];
  backgroundColors: ColorItem[];
  matrix: MatrixCellData[][];
}

const App: React.FC = () => {
  const [foregroundColors, setForegroundColors] = useState<ColorItem[]>([
    { id: generateId(), hex: '#FFFFFF' },
    { id: generateId(), hex: '#E0E0F0' },
  ]);
  const [backgroundColors, setBackgroundColors] = useState<ColorItem[]>([
    { id: generateId(), hex: '#1E1E2E' },
    { id: generateId(), hex: '#2A2A3E' },
  ]);
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [leftWidth, setLeftWidth] = useState(280);
  const [rightVisible, setRightVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(true);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const matrix = useMemo<MatrixCellData[][]>(() => {
    const t0 = performance.now();
    const result: MatrixCellData[][] = [];
    for (let r = 0; r < foregroundColors.length; r++) {
      const row: MatrixCellData[] = [];
      for (let c = 0; c < backgroundColors.length; c++) {
        const fgHex = foregroundColors[r].hex;
        const bgHex = backgroundColors[c].hex;
        let ratio = 1;
        if (/^#[0-9A-Fa-f]{6}$/.test(fgHex) && /^#[0-9A-Fa-f]{6}$/.test(bgHex)) {
          ratio = calculateContrastRatio(fgHex, bgHex);
        }
        row.push({ fgHex, bgHex, ratio });
      }
      result.push(row);
    }
    const elapsed = performance.now() - t0;
    if (elapsed > 500) {
      console.warn(`Matrix calculation took ${elapsed.toFixed(1)}ms`);
    }
    return result;
  }, [foregroundColors, backgroundColors]);

  const handleCellClick = useCallback((row: number, col: number) => {
    setSelectedCell({ row, col });
    setRightVisible(true);
  }, []);

  const selectedFg = selectedCell
    ? foregroundColors[selectedCell.row]?.hex
    : null;
  const selectedBg = selectedCell
    ? backgroundColors[selectedCell.col]?.hex
    : null;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      startX.current = e.clientX;
      startWidth.current = leftWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [leftWidth]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = e.clientX - startX.current;
      const newWidth = Math.max(200, Math.min(500, startWidth.current + delta));
      setLeftWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleExport = useCallback(() => {
    const data: SchemeData = {
      foregroundColors,
      backgroundColors,
      matrix,
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'color-scheme.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [foregroundColors, backgroundColors, matrix]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string) as SchemeData;
          if (
            Array.isArray(data.foregroundColors) &&
            Array.isArray(data.backgroundColors)
          ) {
            setForegroundColors(data.foregroundColors);
            setBackgroundColors(data.backgroundColors);
            setSelectedCell(null);
            setRightVisible(false);
          }
        } catch {
          console.error('Invalid scheme file');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    []
  );

  if (previewMode) {
    return (
      <PreviewMode
        foregroundColors={foregroundColors}
        backgroundColors={backgroundColors}
        onClose={() => setPreviewMode(false)}
      />
    );
  }

  if (isMobile) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#1E1E2E',
          color: '#E0E0F0',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div
          style={{
            padding: '10px 16px',
            background: '#2A2A3E',
            borderBottom: '1px solid #3B3B55',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
          onClick={() => setMobilePanelOpen(!mobilePanelOpen)}
        >
          <span style={{ fontSize: 14, fontWeight: 600 }}>颜色输入</span>
          <span style={{ fontSize: 18 }}>{mobilePanelOpen ? '▾' : '▸'}</span>
        </div>
        {mobilePanelOpen && (
          <div style={{ maxHeight: '40vh', overflow: 'auto' }}>
            <ColorInputPanel
              foregroundColors={foregroundColors}
              backgroundColors={backgroundColors}
              onForegroundChange={setForegroundColors}
              onBackgroundChange={setBackgroundColors}
            />
          </div>
        )}
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <HeatmapMatrix
            matrix={matrix}
            foregroundHexes={foregroundColors.map((c) => c.hex)}
            backgroundHexes={backgroundColors.map((c) => c.hex)}
            onCellClick={handleCellClick}
            selectedCell={selectedCell}
          />
        </div>
        {rightVisible && selectedFg && selectedBg && (
          <div
            style={{
              maxHeight: '45vh',
              overflow: 'auto',
              background: '#2A2A3E',
              borderTop: '1px solid #3B3B55',
            }}
          >
            <DetailPanel fgHex={selectedFg} bgHex={selectedBg} />
          </div>
        )}
        <div
          style={{
            height: 64,
            borderTop: '1px solid #3B3B55',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '0 16px',
            background: '#2A2A3E',
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleExport}
            style={{
              padding: '8px 20px',
              background: '#6366F1',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.2s, transform 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#7C3AED')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#6366F1')}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            导出方案
          </button>
          <button
            onClick={handleImport}
            style={{
              padding: '8px 20px',
              background: '#6366F1',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.2s, transform 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#7C3AED')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#6366F1')}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            导入方案
          </button>
          <button
            onClick={() => setPreviewMode(true)}
            style={{
              padding: '8px 20px',
              background: 'transparent',
              color: '#6366F1',
              border: '1px solid #6366F1',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.2s, transform 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            预览模式
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#1E1E2E',
        color: '#E0E0F0',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div
          style={{
            width: leftWidth,
            flexShrink: 0,
            background: '#2A2A3E',
            overflowY: 'auto',
            transition: dragging.current ? 'none' : 'width 0.2s',
          }}
        >
          <ColorInputPanel
            foregroundColors={foregroundColors}
            backgroundColors={backgroundColors}
            onForegroundChange={setForegroundColors}
            onBackgroundChange={setBackgroundColors}
          />
        </div>

        <div
          onMouseDown={handleMouseDown}
          style={{
            width: 6,
            cursor: 'col-resize',
            background: '#3B3B55',
            transition: dragging.current ? 'none' : 'background 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#6366F1';
          }}
          onMouseLeave={(e) => {
            if (!dragging.current) e.currentTarget.style.background = '#3B3B55';
          }}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
              <HeatmapMatrix
                matrix={matrix}
                foregroundHexes={foregroundColors.map((c) => c.hex)}
                backgroundHexes={backgroundColors.map((c) => c.hex)}
                onCellClick={handleCellClick}
                selectedCell={selectedCell}
              />
            </div>

            {rightVisible && selectedFg && selectedBg && (
              <div
                style={{
                  width: 300,
                  flexShrink: 0,
                  background: '#2A2A3E',
                  borderLeft: '1px solid #3B3B55',
                  overflowY: 'auto',
                }}
              >
                <DetailPanel fgHex={selectedFg} bgHex={selectedBg} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          height: 64,
          borderTop: '1px solid #3B3B55',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '0 24px',
          background: '#2A2A3E',
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleExport}
          style={{
            padding: '8px 24px',
            background: '#6366F1',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.2s, transform 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#7C3AED')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#6366F1')}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          导出方案
        </button>
        <button
          onClick={handleImport}
          style={{
            padding: '8px 24px',
            background: '#6366F1',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.2s, transform 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#7C3AED')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#6366F1')}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          导入方案
        </button>
        <button
          onClick={() => setPreviewMode(true)}
          style={{
            padding: '8px 24px',
            background: 'transparent',
            color: '#6366F1',
            border: '1px solid #6366F1',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.2s, transform 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          预览模式
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default App;
