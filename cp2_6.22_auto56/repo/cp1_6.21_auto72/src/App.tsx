import React, { useState, useRef, useCallback, useMemo } from 'react';
import * as htmlToImage from 'html-to-image';
import Toolbar, { type ToolType, type SymmetryType } from './Toolbar';
import GridCanvas from './GridCanvas';
import { applyFilter, type FilterType } from './effects';

const GRID_SIZE = 24;
const CELL_SIZE = 20;
const DEFAULT_COLOR = '#000000';

type Grid = (string | null)[][];

const createEmptyGrid = (): Grid =>
  Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'none', label: '无滤镜' },
  { value: 'invert', label: '反转颜色' },
  { value: 'mirror-h', label: '水平镜像' },
  { value: 'mirror-v', label: '垂直镜像' },
  { value: 'blur', label: '模糊边缘' },
];

const App: React.FC = () => {
  const [baseGrid, setBaseGrid] = useState<Grid>(createEmptyGrid);
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_COLOR);
  const [selectedTool, setSelectedTool] = useState<ToolType>('brush');
  const [symmetry, setSymmetry] = useState<SymmetryType>('none');
  const [filter, setFilter] = useState<FilterType>('none');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  const displayedGrid = useMemo(() => applyFilter(baseGrid, filter), [baseGrid, filter]);

  const applyCellChange = useCallback(
    (grid: Grid, x: number, y: number, value: string | null): Grid => {
      const newGrid = grid.map((row) => [...row]);
      const size = GRID_SIZE;
      const half = Math.floor(size / 2);

      const setCell = (cx: number, cy: number) => {
        if (cx >= 0 && cx < size && cy >= 0 && cy < size) {
          newGrid[cy][cx] = value;
        }
      };

      setCell(x, y);

      switch (symmetry) {
        case 'horizontal': {
          const mirrorX = size - 1 - x;
          setCell(mirrorX, y);
          break;
        }
        case 'vertical': {
          const mirrorY = size - 1 - y;
          setCell(x, mirrorY);
          break;
        }
        case 'center': {
          const mirrorX = size - 1 - x;
          const mirrorY = size - 1 - y;
          setCell(mirrorX, y);
          setCell(x, mirrorY);
          setCell(mirrorX, mirrorY);
          break;
        }
      }

      return newGrid;
    },
    [symmetry]
  );

  const handleCellClick = useCallback(
    (x: number, y: number) => {
      const currentCell = baseGrid[y][x];

      if (selectedTool === 'eraser') {
        setBaseGrid((prev) => applyCellChange(prev, x, y, null));
      } else {
        if (currentCell === selectedColor) {
          setBaseGrid((prev) => applyCellChange(prev, x, y, null));
        } else {
          setBaseGrid((prev) => applyCellChange(prev, x, y, selectedColor));
        }
      }
    },
    [baseGrid, selectedColor, selectedTool, applyCellChange]
  );

  const handleClearAll = () => {
    setShowConfirmDialog(true);
  };

  const confirmClear = () => {
    setBaseGrid(createEmptyGrid());
    setShowConfirmDialog(false);
  };

  const cancelClear = () => {
    setShowConfirmDialog(false);
  };

  const handleExport = async () => {
    if (!canvasRef.current) return;

    try {
      const dataUrl = await htmlToImage.toPng(canvasRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = 'pixel-art.png';
      link.href = dataUrl;
      link.click();

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 500);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const appStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#1e1e1e',
    color: '#ffffff',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid #333333',
    backgroundColor: '#252525',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 600,
    color: '#ffffff',
  };

  const selectStyle: React.CSSProperties = {
    height: 36,
    borderRadius: 4,
    backgroundColor: '#3a3a3a',
    color: '#ffffff',
    border: '1px solid #444444',
    padding: '0 12px',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  };

  const mainLayoutStyle: React.CSSProperties = {
    display: 'flex',
    flex: 1,
    padding: 20,
    gap: 20,
    minHeight: 0,
  };

  const centerColumnStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  };

  const bottomBarStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: 16,
    padding: '16px 0',
  };

  const buttonBaseStyle: React.CSSProperties = {
    height: 40,
    borderRadius: 4,
    border: 'none',
    cursor: 'pointer',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 500,
    padding: '0 24px',
    transition: 'background-color 0.2s ease',
    backgroundColor: '#3a3a3a',
  };

  const clearButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: '#c0392b',
  };

  const exportButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: exportSuccess ? '#27ae60' : '#2980b9',
    transition: 'background-color 0.2s ease',
  };

  const dialogOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#00000080',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const dialogBoxStyle: React.CSSProperties = {
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    padding: 24,
    minWidth: 300,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  };

  const dialogTitleStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 12,
    color: '#ffffff',
  };

  const dialogMessageStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 20,
  };

  const dialogButtonsStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
  };

  const dialogButtonStyle: React.CSSProperties = {
    height: 36,
    borderRadius: 4,
    border: 'none',
    cursor: 'pointer',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 500,
    padding: '0 16px',
    transition: 'background-color 0.2s ease',
  };

  return (
    <div style={appStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>🎨 像素艺术编辑器</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterType)}
          style={selectStyle}
          onMouseEnter={(e) => {
            (e.target as HTMLSelectElement).style.backgroundColor = '#2a2a2a';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLSelectElement).style.backgroundColor = '#3a3a3a';
          }}
        >
          {FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div style={mainLayoutStyle}>
        <Toolbar
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
          selectedTool={selectedTool}
          onToolChange={setSelectedTool}
          symmetry={symmetry}
          onSymmetryChange={setSymmetry}
        />

        <div style={centerColumnStyle}>
          <GridCanvas
            grid={displayedGrid}
            onCellClick={handleCellClick}
            symmetry={symmetry}
            cellSize={CELL_SIZE}
            canvasRef={canvasRef}
          />

          <div style={bottomBarStyle}>
            <button
              style={clearButtonStyle}
              onClick={handleClearAll}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#a93226';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#c0392b';
              }}
            >
              清除所有
            </button>
            <button
              style={exportButtonStyle}
              onClick={handleExport}
              onMouseEnter={(e) => {
                if (!exportSuccess) {
                  e.currentTarget.style.backgroundColor = '#1f618d';
                }
              }}
              onMouseLeave={(e) => {
                if (!exportSuccess) {
                  e.currentTarget.style.backgroundColor = '#2980b9';
                }
              }}
            >
              导出 PNG
            </button>
          </div>
        </div>
      </div>

      {showConfirmDialog && (
        <div style={dialogOverlayStyle}>
          <div style={dialogBoxStyle}>
            <div style={dialogTitleStyle}>确认清除</div>
            <div style={dialogMessageStyle}>
              确定要清除所有画布内容吗？此操作无法撤销。
            </div>
            <div style={dialogButtonsStyle}>
              <button
                style={{
                  ...dialogButtonStyle,
                  backgroundColor: '#3a3a3a',
                }}
                onClick={cancelClear}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3a3a3a';
                }}
              >
                取消
              </button>
              <button
                style={{
                  ...dialogButtonStyle,
                  backgroundColor: '#c0392b',
                }}
                onClick={confirmClear}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#a93226';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#c0392b';
                }}
              >
                确定清除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
