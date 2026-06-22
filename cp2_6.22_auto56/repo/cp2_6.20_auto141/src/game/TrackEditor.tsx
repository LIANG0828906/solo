import { useRef, useEffect, useState, useCallback } from 'react';
import { TrackCell, CellType, TrackData } from '@/types';
import { useTrackStore } from '@/store/useTrackStore';

const GRID_WIDTH = 20;
const GRID_HEIGHT = 10;
const CELL_SIZE = 30;

const CELL_TYPES: CellType[] = ['empty', 'obstacle', 'boost', 'platform'];

const TYPE_LABELS: Record<CellType, string> = {
  empty: '空白',
  obstacle: '障碍物',
  boost: '加速带',
  platform: '跳跃平台',
};

interface TrackEditorProps {
  initialTrack?: TrackData;
}

export default function TrackEditor({ initialTrack }: TrackEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cells, setCells] = useState<Map<string, TrackCell>>(new Map());
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [trackName, setTrackName] = useState('');
  const [importJson, setImportJson] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { tracks, loadTracks, saveTrack, deleteTrack, setCurrentTrackId } = useTrackStore();

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  useEffect(() => {
    if (initialTrack) {
      const cellMap = new Map<string, TrackCell>();
      initialTrack.cells.forEach((cell) => {
        cellMap.set(`${cell.x},${cell.y}`, cell);
      });
      setCells(cellMap);
    }
  }, [initialTrack]);

  const getCell = useCallback(
    (x: number, y: number): TrackCell => {
      const key = `${x},${y}`;
      return cells.get(key) || { x, y, type: 'empty' };
    },
    [cells]
  );

  const setCell = useCallback((cell: TrackCell) => {
    setCells((prev) => {
      const next = new Map(prev);
      const key = `${cell.x},${cell.y}`;
      if (cell.type === 'empty') {
        next.delete(key);
      } else {
        next.set(key, cell);
      }
      return next;
    });
  }, []);

  const cycleCellType = useCallback(
    (x: number, y: number) => {
      const currentCell = getCell(x, y);
      const currentIndex = CELL_TYPES.indexOf(currentCell.type);
      const nextIndex = (currentIndex + 1) % CELL_TYPES.length;
      const nextType = CELL_TYPES[nextIndex];

      const newCell: TrackCell = { x, y, type: nextType };

      if (nextType === 'obstacle') {
        newCell.height = 1;
      } else if (nextType === 'boost') {
        newCell.multiplier = 2;
      }

      setCell(newCell);
      setSelectedCell({ x, y });
    },
    [getCell, setCell]
  );

  const updateCellProperty = useCallback(
    (x: number, y: number, updates: Partial<TrackCell>) => {
      const currentCell = getCell(x, y);
      const newCell = { ...currentCell, ...updates };
      setCell(newCell);
    },
    [getCell, setCell]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor(((e.clientX - rect.left) * scaleX) / CELL_SIZE);
      const y = Math.floor(((e.clientY - rect.top) * scaleY) / CELL_SIZE);

      if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
        cycleCellType(x, y);
      }
    },
    [cycleCellType]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = GRID_WIDTH * CELL_SIZE;
    const height = GRID_HEIGHT * CELL_SIZE;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    for (let x = 0; x <= GRID_WIDTH; x++) {
      ctx.strokeStyle = '#0a0f24';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, height);
      ctx.stroke();
    }

    for (let y = 0; y <= GRID_HEIGHT; y++) {
      ctx.strokeStyle = '#0a0f24';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(width, y * CELL_SIZE);
      ctx.stroke();
    }

    cells.forEach((cell) => {
      const px = cell.x * CELL_SIZE;
      const py = cell.y * CELL_SIZE;

      if (cell.type === 'obstacle') {
        const h = cell.height || 1;
        const obstacleHeight = CELL_SIZE * h;
        const obstacleY = py + CELL_SIZE - obstacleHeight;

        const gradient = ctx.createLinearGradient(px, obstacleY, px + CELL_SIZE, obstacleY);
        gradient.addColorStop(0, '#ff006e');
        gradient.addColorStop(1, '#ff4d94');

        ctx.fillStyle = gradient;
        ctx.fillRect(px + 2, obstacleY + 2, CELL_SIZE - 4, obstacleHeight - 4);

        ctx.strokeStyle = '#ff6b9d';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 2, obstacleY + 2, CELL_SIZE - 4, obstacleHeight - 4);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(px + 4, obstacleY + 4, CELL_SIZE - 8, 3);
      } else if (cell.type === 'boost') {
        const cx = px + CELL_SIZE / 2;
        const cy = py + CELL_SIZE / 2;
        const rx = CELL_SIZE * 0.35;
        const ry = CELL_SIZE * 0.35;

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
        gradient.addColorStop(0, '#00f5d4');
        gradient.addColorStop(0.5, '#00d4b8');
        gradient.addColorStop(1, 'rgba(0, 245, 212, 0.3)');

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI / 4);

        ctx.fillStyle = gradient;
        ctx.fillRect(-rx, -ry, rx * 2, ry * 2);

        ctx.strokeStyle = '#00f5d4';
        ctx.lineWidth = 1;
        ctx.strokeRect(-rx, -ry, rx * 2, ry * 2);

        ctx.restore();

        const multiplier = cell.multiplier || 2;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${multiplier.toFixed(1)}x`, cx, cy + 4);
      } else if (cell.type === 'platform') {
        ctx.beginPath();
        ctx.moveTo(px + CELL_SIZE * 0.15, py + CELL_SIZE);
        ctx.lineTo(px + CELL_SIZE * 0.25, py + 2);
        ctx.lineTo(px + CELL_SIZE * 0.75, py + 2);
        ctx.lineTo(px + CELL_SIZE * 0.85, py + CELL_SIZE);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(px, py, px, py + CELL_SIZE);
        gradient.addColorStop(0, '#b5179e');
        gradient.addColorStop(1, '#7209b7');

        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = '#d946ef';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    if (selectedCell) {
      const px = selectedCell.x * CELL_SIZE;
      const py = selectedCell.y * CELL_SIZE;
      ctx.strokeStyle = '#00f5d4';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);

      ctx.shadowColor = '#00f5d4';
      ctx.shadowBlur = 10;
      ctx.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
      ctx.shadowBlur = 0;
    }
  }, [cells, selectedCell]);

  const handleSave = () => {
    if (!trackName.trim()) {
      setErrorMessage('请输入赛道名称');
      return;
    }

    const cellsArray = Array.from(cells.values());
    saveTrack(trackName.trim(), cellsArray, GRID_WIDTH, GRID_HEIGHT);
    setShowSaveDialog(false);
    setTrackName('');
    setSuccessMessage('赛道保存成功！');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const handleExport = () => {
    const cellsArray = Array.from(cells.values());
    const trackData = {
      width: GRID_WIDTH,
      height: GRID_HEIGHT,
      cells: cellsArray,
    };
    const json = JSON.stringify(trackData, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      setSuccessMessage('赛道数据已复制到剪贴板！');
      setTimeout(() => setSuccessMessage(''), 2000);
    }).catch(() => {
      setErrorMessage('复制失败，请手动复制');
      setTimeout(() => setErrorMessage(''), 2000);
    });
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importJson);

      if (!data.width || !data.height || !Array.isArray(data.cells)) {
        throw new Error('数据格式不正确');
      }

      const obstacleCount = data.cells.filter((c: TrackCell) => c.type === 'obstacle').length;
      if (obstacleCount > 30) {
        throw new Error('障碍物数量不能超过 30 个');
      }

      const cellMap = new Map<string, TrackCell>();
      data.cells.forEach((cell: TrackCell) => {
        if (cell.type !== 'empty') {
          cellMap.set(`${cell.x},${cell.y}`, cell);
        }
      });
      setCells(cellMap);
      setShowImportDialog(false);
      setImportJson('');
      setSelectedCell(null);
      setSuccessMessage('赛道导入成功！');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '导入失败');
    }
  };

  const handleClear = () => {
    setCells(new Map());
    setSelectedCell(null);
  };

  const handleLoadTrack = (track: TrackData) => {
    const cellMap = new Map<string, TrackCell>();
    track.cells.forEach((cell) => {
      cellMap.set(`${cell.x},${cell.y}`, cell);
    });
    setCells(cellMap);
    setCurrentTrackId(track.id);
    setSelectedCell(null);
    setSuccessMessage(`已加载赛道: ${track.name}`);
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const handleDeleteTrack = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTrack(id);
  };

  const selectedCellData = selectedCell ? getCell(selectedCell.x, selectedCell.y) : null;

  return (
    <div className="flex gap-6 w-full">
      <div className="flex-shrink-0">
        <div
          className="relative neon-border rounded-lg overflow-hidden"
          style={{
            boxShadow: '0 0 10px #00f5d4, 0 0 20px rgba(0, 245, 212, 0.3), inset 0 0 10px rgba(0, 245, 212, 0.1)',
          }}
        >
          <canvas
            ref={canvasRef}
            width={GRID_WIDTH * CELL_SIZE}
            height={GRID_HEIGHT * CELL_SIZE}
            onClick={handleCanvasClick}
            className="cursor-pointer block"
            style={{
              background: 'linear-gradient(180deg, #0a0f24 0%, #070a18 100%)',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.1) 50%)',
              backgroundSize: '100% 4px',
              animation: 'scanline 8s linear infinite',
            }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center mono-text">
          点击格子切换类型: 空白 → 障碍物 → 加速带 → 跳跃平台
        </p>
      </div>

      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {successMessage && (
          <div className="bg-green-900/30 border border-green-500 text-green-400 px-4 py-2 rounded-lg text-sm">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-2 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}

        <div className="glass rounded-lg p-4 neon-border">
          <h3 className="text-lg font-bold text-cyan-400 mb-3 uppercase tracking-wider">参数面板</h3>

          {selectedCellData ? (
            <div className="space-y-4">
              <div className="flex gap-4 text-sm">
                <span className="text-gray-400">坐标:</span>
                <span className="mono-text text-cyan-400">
                  ({selectedCellData.x}, {selectedCellData.y})
                </span>
              </div>

              <div className="flex gap-4 text-sm">
                <span className="text-gray-400">类型:</span>
                <span className="mono-text text-pink-400">{TYPE_LABELS[selectedCellData.type]}</span>
              </div>

              {selectedCellData.type === 'obstacle' && (
                <div className="space-y-2">
                  <label className="text-sm text-gray-400 block">高度: {selectedCellData.height || 1} 格</label>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="1"
                    value={selectedCellData.height || 1}
                    onChange={(e) =>
                      updateCellProperty(selectedCellData.x, selectedCellData.y, {
                        height: parseInt(e.target.value),
                      })
                    }
                    className="w-full accent-pink-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                  </div>
                </div>
              )}

              {selectedCellData.type === 'boost' && (
                <div className="space-y-2">
                  <label className="text-sm text-gray-400 block">
                    倍率: {(selectedCellData.multiplier || 2).toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="1.5"
                    max="3"
                    step="0.1"
                    value={selectedCellData.multiplier || 2}
                    onChange={(e) =>
                      updateCellProperty(selectedCellData.x, selectedCellData.y, {
                        multiplier: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-cyan-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1.5x</span>
                    <span>2.0x</span>
                    <span>3.0x</span>
                  </div>
                </div>
              )}

              {selectedCellData.type === 'platform' && (
                <div className="text-sm text-gray-400 space-y-1">
                  <p className="text-purple-400 font-medium">跳跃平台</p>
                  <p>玩家可以落在平台上，作为跳跃的中继点。</p>
                  <p>平台顶部可站立，底部可穿过。</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">点击左侧格子添加或选择元素</p>
          )}
        </div>

        <div className="glass rounded-lg p-4 neon-border">
          <h3 className="text-lg font-bold text-cyan-400 mb-3 uppercase tracking-wider">工具栏</h3>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setShowSaveDialog(true)} className="neon-button text-sm">
              保存赛道
            </button>
            <button onClick={handleExport} className="neon-button text-sm">
              导出赛道
            </button>
            <button onClick={() => setShowImportDialog(true)} className="neon-button text-sm">
              导入赛道
            </button>
            <button onClick={handleClear} className="neon-button text-sm text-pink-400 border-pink-500/50">
              清空画布
            </button>
          </div>
        </div>

        <div className="glass rounded-lg p-4 neon-border flex-1 overflow-hidden flex flex-col">
          <h3 className="text-lg font-bold text-cyan-400 mb-3 uppercase tracking-wider">赛道列表</h3>
          <div className="flex-1 overflow-y-auto space-y-2">
            {tracks.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">暂无保存的赛道</p>
            ) : (
              tracks.map((track) => (
                <div
                  key={track.id}
                  onClick={() => handleLoadTrack(track)}
                  className="flex items-center justify-between p-3 rounded-lg bg-dark/50 border border-cyan-900/30 hover:border-cyan-500/50 cursor-pointer transition-all group"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{track.name}</p>
                    <p className="text-xs text-gray-500 mono-text">
                      {track.cells.length} 个元素 · {new Date(track.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteTrack(track.id, e)}
                    className="text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity text-sm hover:text-pink-300"
                  >
                    删除
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="glass rounded-lg p-6 neon-border w-96">
            <h3 className="text-lg font-bold text-cyan-400 mb-4 uppercase tracking-wider">保存赛道</h3>
            <input
              type="text"
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              placeholder="输入赛道名称"
              className="w-full bg-dark border border-cyan-900/50 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setTrackName('');
                  setErrorMessage('');
                }}
                className="neon-button text-sm opacity-70"
              >
                取消
              </button>
              <button onClick={handleSave} className="neon-button text-sm">
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="glass rounded-lg p-6 neon-border w-96">
            <h3 className="text-lg font-bold text-cyan-400 mb-4 uppercase tracking-wider">导入赛道</h3>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder="粘贴 JSON 数据..."
              className="w-full bg-dark border border-cyan-900/50 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 mb-4 h-40 resize-none mono-text text-sm"
            />
            {errorMessage && (
              <p className="text-red-400 text-sm mb-4">{errorMessage}</p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowImportDialog(false);
                  setImportJson('');
                  setErrorMessage('');
                }}
                className="neon-button text-sm opacity-70"
              >
                取消
              </button>
              <button onClick={handleImport} className="neon-button text-sm">
                导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
