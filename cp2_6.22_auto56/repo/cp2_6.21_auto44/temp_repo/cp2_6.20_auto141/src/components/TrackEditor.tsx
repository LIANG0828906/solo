import { useRef, useEffect, useState, useCallback } from 'react';
import { useTrackStore } from '@/store/useTrackStore';
import { TrackCell, CellType } from '@/types';

const GRID_WIDTH = 20;
const GRID_HEIGHT = 10;
const CELL_SIZE = 40;

const CELL_TYPES: { type: CellType; label: string; color: string }[] = [
  { type: 'empty', label: '空白', color: '#16213e' },
  { type: 'obstacle', label: '障碍物', color: '#ff006e' },
  { type: 'boost', label: '加速带', color: '#00f5d4' },
  { type: 'platform', label: '平台', color: '#b5179e' },
];

export default function TrackEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { tracks, currentTrackId, selectedCell, setSelectedCell, saveTrack, loadTracks, getCurrentTrack, updateCell } = useTrackStore();
  const [selectedType, setSelectedType] = useState<CellType>('obstacle');
  const [trackName, setTrackName] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const gridRef = useRef<TrackCell[][]>([]);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  useEffect(() => {
    initGrid();
  }, [currentTrackId, tracks]);

  const initGrid = useCallback(() => {
    const grid: TrackCell[][] = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      grid[y] = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        grid[y][x] = { x, y, type: 'empty' };
      }
    }

    const currentTrack = getCurrentTrack();
    if (currentTrack) {
      for (const cell of currentTrack.cells) {
        if (cell.y >= 0 && cell.y < GRID_HEIGHT && cell.x >= 0 && cell.x < GRID_WIDTH) {
          grid[cell.y][cell.x] = { ...cell };
        }
      }
      setTrackName(currentTrack.name);
    } else {
      setTrackName('');
    }

    gridRef.current = grid;
    drawGrid(grid);
  }, [getCurrentTrack]);

  const drawGrid = (grid: TrackCell[][]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const cell = grid[y][x];
        const px = x * CELL_SIZE;
        const py = y * CELL_SIZE;

        const depthScale = 0.85 + (y / GRID_HEIGHT) * 0.15;
        const offsetX = (y / GRID_HEIGHT) * 10;
        const drawX = px + offsetX;
        const drawW = CELL_SIZE * depthScale;
        const drawH = CELL_SIZE * 0.7;

        switch (cell.type) {
          case 'empty':
            ctx.fillStyle = y >= GRID_HEIGHT - 1 ? '#1a1a2e' : '#16213e';
            break;
          case 'obstacle':
            ctx.fillStyle = '#ff006e';
            break;
          case 'boost':
            ctx.fillStyle = '#00f5d4';
            break;
          case 'platform':
            ctx.fillStyle = '#b5179e';
            break;
        }

        ctx.fillRect(drawX, py, drawW, drawH);

        if (cell.type === 'obstacle' && cell.height) {
          const height = cell.height;
          const obstacleHeight = drawH * height;
          const obstacleY = py + drawH - obstacleHeight;
          ctx.fillStyle = '#ff4d94';
          ctx.fillRect(drawX, obstacleY, drawW, obstacleHeight);
        }

        if (cell.type === 'boost' && cell.multiplier) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${cell.multiplier.toFixed(1)}x`, drawX + drawW / 2, py + drawH / 2 + 4);
        }

        if (selectedCell && selectedCell.x === x && selectedCell.y === y) {
          ctx.strokeStyle = '#00f5d4';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#00f5d4';
          ctx.shadowBlur = 10;
          ctx.strokeRect(drawX + 1, py + 1, drawW - 2, drawH - 2);
          ctx.shadowBlur = 0;
        } else {
          ctx.strokeStyle = 'rgba(0, 245, 212, 0.15)';
          ctx.lineWidth = 1;
          ctx.strokeRect(drawX, py, drawW, drawH);
        }
      }
    }
  };

  const getGridPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const depthScale = 0.85 + (y / GRID_HEIGHT) * 0.15;
        const offsetX = (y / GRID_HEIGHT) * 10;
        const drawX = x * CELL_SIZE + offsetX;
        const drawW = CELL_SIZE * depthScale;
        const drawH = CELL_SIZE * 0.7;

        if (mouseX >= drawX && mouseX <= drawX + drawW && mouseY >= y * CELL_SIZE && mouseY <= y * CELL_SIZE + drawH) {
          return { x, y };
        }
      }
    }

    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getGridPos(e);
    if (!pos) return;

    setIsDrawing(true);
    paintCell(pos.x, pos.y);
    setSelectedCell(pos);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pos = getGridPos(e);
    if (!pos) return;
    paintCell(pos.x, pos.y);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const paintCell = (x: number, y: number) => {
    const grid = gridRef.current;
    if (!grid[y] || !grid[y][x]) return;

    const cell: TrackCell = { x, y, type: selectedType };

    if (selectedType === 'obstacle') {
      cell.height = 1;
    } else if (selectedType === 'boost') {
      cell.multiplier = 2;
    }

    grid[y][x] = cell;
    drawGrid(grid);
  };

  const handleSave = () => {
    const grid = gridRef.current;
    const cells: TrackCell[] = [];

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (grid[y][x].type !== 'empty') {
          cells.push(grid[y][x]);
        }
      }
    }

    if (!trackName.trim()) {
      alert('请输入赛道名称');
      return;
    }

    const id = saveTrack(trackName.trim(), cells, GRID_WIDTH, GRID_HEIGHT);
    useTrackStore.getState().setCurrentTrackId(id);
    alert('赛道保存成功！');
  };

  const handleClear = () => {
    if (!confirm('确定要清空画布吗？')) return;

    const grid: TrackCell[][] = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      grid[y] = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        grid[y][x] = { x, y, type: 'empty' };
      }
    }
    gridRef.current = grid;
    drawGrid(grid);
    setSelectedCell(null);
  };

  const handleExport = () => {
    const grid = gridRef.current;
    const cells: TrackCell[] = [];

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (grid[y][x].type !== 'empty') {
          cells.push(grid[y][x]);
        }
      }
    }

    const data = {
      name: trackName,
      width: GRID_WIDTH,
      height: GRID_HEIGHT,
      cells,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trackName || 'track'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const grid: TrackCell[][] = [];
        for (let y = 0; y < GRID_HEIGHT; y++) {
          grid[y] = [];
          for (let x = 0; x < GRID_WIDTH; x++) {
            grid[y][x] = { x, y, type: 'empty' };
          }
        }

        for (const cell of data.cells) {
          if (cell.y >= 0 && cell.y < GRID_HEIGHT && cell.x >= 0 && cell.x < GRID_WIDTH) {
            grid[cell.y][cell.x] = { ...cell };
          }
        }

        gridRef.current = grid;
        setTrackName(data.name || '');
        drawGrid(grid);
      } catch (err) {
        alert('导入失败：文件格式错误');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const updateSelectedCellProperty = (property: string, value: number) => {
    if (!selectedCell) return;

    const grid = gridRef.current;
    const cell = grid[selectedCell.y][selectedCell.x];

    if (property === 'height') {
      cell.height = value;
    } else if (property === 'multiplier') {
      cell.multiplier = value;
    }

    if (currentTrackId) {
      updateCell(currentTrackId, cell);
    }

    drawGrid(grid);
  };

  const selectedCellData = selectedCell ? gridRef.current[selectedCell.y]?.[selectedCell.x] : null;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1">
        <div
          className="glass rounded-xl p-4 mb-4"
          style={{
            border: '1px solid rgba(0, 245, 212, 0.3)',
            boxShadow: '0 0 20px rgba(0, 245, 212, 0.1)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: 'var(--neon-cyan)' }}>
              赛道画布
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                placeholder="赛道名称"
                className="px-3 py-1 rounded bg-transparent border text-sm"
                style={{
                  borderColor: 'rgba(0, 245, 212, 0.3)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <div className="flex justify-center overflow-x-auto">
            <canvas
              ref={canvasRef}
              width={GRID_WIDTH * CELL_SIZE + 20}
              height={GRID_HEIGHT * CELL_SIZE}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="cursor-crosshair rounded-lg"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
              }}
            />
          </div>
        </div>

        <div className="glass rounded-xl p-4">
          <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--neon-cyan)' }}>
            工具栏
          </h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleSave} className="neon-button">
              保存赛道
            </button>
            <button onClick={handleExport} className="neon-button">
              导出 JSON
            </button>
            <label className="neon-button cursor-pointer">
              导入 JSON
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button onClick={handleClear} className="neon-button">
              清空画布
            </button>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-72 space-y-4">
        <div className="glass rounded-xl p-4">
          <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--neon-cyan)' }}>
            元素类型
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {CELL_TYPES.map((type) => (
              <button
                key={type.type}
                onClick={() => setSelectedType(type.type)}
                className="py-2 px-3 text-sm rounded-lg transition-all"
                style={{
                  background: selectedType === type.type
                    ? 'linear-gradient(135deg, rgba(0, 245, 212, 0.3), rgba(181, 23, 158, 0.3))'
                    : 'linear-gradient(135deg, rgba(0, 245, 212, 0.1), rgba(181, 23, 158, 0.1))',
                  border: `1px solid ${selectedType === type.type ? 'var(--neon-cyan)' : 'rgba(0, 245, 212, 0.2)'}`,
                  color: selectedType === type.type ? 'var(--neon-cyan)' : 'var(--text-primary)',
                  boxShadow: selectedType === type.type ? '0 0 10px rgba(0, 245, 212, 0.5)' : 'none',
                }}
              >
                <div
                  className="w-4 h-4 rounded mx-auto mb-1"
                  style={{ backgroundColor: type.color }}
                />
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {selectedCellData && selectedCellData.type !== 'empty' && (
          <div className="glass rounded-xl p-4">
            <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--neon-cyan)' }}>
              单元格属性
            </h3>
            <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              位置: ({selectedCell?.x}, {selectedCell?.y})
            </p>
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              类型: {selectedCellData.type}
            </p>

            {selectedCellData.type === 'obstacle' && (
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  高度: {selectedCellData.height || 1}
                </label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="1"
                  value={selectedCellData.height || 1}
                  onChange={(e) => updateSelectedCellProperty('height', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {selectedCellData.type === 'boost' && (
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  倍率: {selectedCellData.multiplier || 2}x
                </label>
                <input
                  type="range"
                  min="1.5"
                  max="3"
                  step="0.5"
                  value={selectedCellData.multiplier || 2}
                  onChange={(e) => updateSelectedCellProperty('multiplier', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}

        <div className="glass rounded-xl p-4">
          <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--neon-cyan)' }}>
            已保存赛道
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {tracks.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                暂无保存的赛道
              </p>
            ) : (
              tracks.map((track) => (
                <div
                  key={track.id}
                  className="p-2 rounded cursor-pointer transition-all text-sm"
                  style={{
                    background: currentTrackId === track.id
                      ? 'rgba(0, 245, 212, 0.1)'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${currentTrackId === track.id ? 'var(--neon-cyan)' : 'rgba(255, 255, 255, 0.1)'}`,
                  }}
                  onClick={() => {
                    useTrackStore.getState().setCurrentTrackId(track.id);
                  }}
                >
                  {track.name}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
