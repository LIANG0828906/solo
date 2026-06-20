import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  Cell,
  CellType,
  Track,
  GRID_WIDTH,
  GRID_HEIGHT,
  CELL_SIZE,
  COLOR_GRID_LINE,
  COLOR_EMPTY,
  COLOR_OBSTACLE,
  COLOR_SPEED_BOOST,
  COLOR_JUMP_PLATFORM,
  CELL_TYPES,
} from '../types';

const CELL_TYPE_LABELS: Record<CellType, string> = {
  empty: '空白',
  obstacle: '障碍物',
  speed_boost: '加速带',
  jump_platform: '跳跃平台',
};

export default function EditorPage() {
  const tracks = useGameStore((s) => s.tracks);
  const saveTrack = useGameStore((s) => s.saveTrack);
  const deleteTrack = useGameStore((s) => s.deleteTrack);
  const createEmptyTrack = useGameStore((s) => s.createEmptyTrack);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [showTrackList, setShowTrackList] = useState(true);
  const [trackName, setTrackName] = useState('');
  const [importText, setImportText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showNewTrack, setShowNewTrack] = useState(false);

  const MAX_HISTORY = 50;

  interface HistoryChange {
    x: number;
    y: number;
    oldCell: Cell;
    newCell: Cell;
  }

  const historyRef = useRef<HistoryChange[][]>([]);
  const historyIndexRef = useRef(-1);
  const [historyVersion, setHistoryVersion] = useState(0);

  const bumpHistoryVersion = useCallback(() => {
    setHistoryVersion((v) => v + 1);
  }, []);

  const pushToHistory = useCallback((changes: HistoryChange[]) => {
    if (changes.length === 0) return;

    const currentIndex = historyIndexRef.current;
    const history = historyRef.current;

    if (currentIndex >= 0 && currentIndex < history.length) {
      const lastChanges = history[currentIndex];
      if (lastChanges.length === changes.length) {
        const isDuplicate = changes.every((c, i) => {
          const lc = lastChanges[i];
          return (
            c.x === lc.x &&
            c.y === lc.y &&
            c.newCell.type === lc.newCell.type &&
            c.newCell.height === lc.newCell.height &&
            c.newCell.multiplier === lc.newCell.multiplier
          );
        });
        if (isDuplicate) return;
      }
    }

    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(changes);
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    bumpHistoryVersion();
  }, [bumpHistoryVersion]);

  const initializeHistory = useCallback(() => {
    historyRef.current = [];
    historyIndexRef.current = -1;
    bumpHistoryVersion();
  }, [bumpHistoryVersion]);

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current < 0) return;
    const changes = historyRef.current[historyIndexRef.current];
    if (!changes || changes.length === 0) return;

    setCurrentTrack((prevTrack) => {
      if (!prevTrack) return prevTrack;
      const newCells = prevTrack.cells.map((row) => row.map((c) => ({ ...c })));
      for (const change of changes) {
        newCells[change.y][change.x] = { ...change.oldCell };
      }
      return { ...prevTrack, cells: newCells };
    });

    historyIndexRef.current--;
    bumpHistoryVersion();
  }, [bumpHistoryVersion]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const changes = historyRef.current[historyIndexRef.current];
    if (!changes || changes.length === 0) return;

    setCurrentTrack((prevTrack) => {
      if (!prevTrack) return prevTrack;
      const newCells = prevTrack.cells.map((row) => row.map((c) => ({ ...c })));
      for (const change of changes) {
        newCells[change.y][change.x] = { ...change.newCell };
      }
      return { ...prevTrack, cells: newCells };
    });

    bumpHistoryVersion();
  }, [bumpHistoryVersion]);



  const renderEditor = useCallback(
    (track: Track, selected: { x: number; y: number } | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = GRID_WIDTH * CELL_SIZE;
      const h = GRID_HEIGHT * CELL_SIZE;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = COLOR_EMPTY;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = COLOR_GRID_LINE;
      ctx.lineWidth = 1;
      for (let x = 0; x <= GRID_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, 0);
        ctx.lineTo(x * CELL_SIZE, h);
        ctx.stroke();
      }
      for (let y = 0; y <= GRID_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_SIZE);
        ctx.lineTo(w, y * CELL_SIZE);
        ctx.stroke();
      }

      for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
          const cell = track.cells[y][x];
          const px = x * CELL_SIZE;
          const py = y * CELL_SIZE;
          const pad = 2;

          if (cell.type === 'obstacle') {
            const heightScale = cell.height / 3;
            const rectH = CELL_SIZE * (0.5 + 0.5 * heightScale);
            ctx.fillStyle = COLOR_OBSTACLE;
            ctx.fillRect(px + pad, py + CELL_SIZE - rectH, CELL_SIZE - pad * 2, rectH);
            ctx.strokeStyle = 'rgba(255, 0, 110, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + pad, py + CELL_SIZE - rectH, CELL_SIZE - pad * 2, rectH);
          } else if (cell.type === 'speed_boost') {
            const cx = px + CELL_SIZE / 2;
            const cy = py + CELL_SIZE / 2;
            const half = CELL_SIZE / 2 - pad;
            ctx.fillStyle = COLOR_SPEED_BOOST;
            ctx.beginPath();
            ctx.moveTo(cx, cy - half);
            ctx.lineTo(cx + half, cy);
            ctx.lineTo(cx, cy + half);
            ctx.lineTo(cx - half, cy);
            ctx.closePath();
            ctx.fill();
          } else if (cell.type === 'jump_platform') {
            const topInset = CELL_SIZE * 0.25;
            const botInset = CELL_SIZE * 0.1;
            ctx.fillStyle = COLOR_JUMP_PLATFORM;
            ctx.beginPath();
            ctx.moveTo(px + topInset, py + pad);
            ctx.lineTo(px + CELL_SIZE - topInset, py + pad);
            ctx.lineTo(px + CELL_SIZE - botInset, py + CELL_SIZE - pad);
            ctx.lineTo(px + botInset, py + CELL_SIZE - pad);
            ctx.closePath();
            ctx.fill();
          }
        }
      }

      if (selected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          selected.x * CELL_SIZE,
          selected.y * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE
        );
      }
    },
    []
  );

  useEffect(() => {
    if (currentTrack) {
      renderEditor(currentTrack, selectedCell);
    }
  }, [currentTrack, selectedCell, renderEditor]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showTrackList && currentTrack) {
        if (e.ctrlKey && e.key === 'z') {
          e.preventDefault();
          handleUndo();
        } else if (e.ctrlKey && e.key === 'y') {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTrackList, currentTrack, handleUndo, handleRedo]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!currentTrack) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const gx = Math.floor(mx / CELL_SIZE);
      const gy = Math.floor(my / CELL_SIZE);
      if (gx < 0 || gx >= GRID_WIDTH || gy < 0 || gy >= GRID_HEIGHT) return;

      const oldCell = { ...currentTrack.cells[gy][gx] };
      const currentIdx = CELL_TYPES.indexOf(oldCell.type);
      const nextType = CELL_TYPES[(currentIdx + 1) % CELL_TYPES.length];

      const newCell: Cell = {
        ...oldCell,
        type: nextType,
        ...(nextType === 'obstacle' ? { height: 1 } : {}),
        ...(nextType === 'speed_boost' ? { multiplier: 1.5 } : {}),
      };

      const newTrack: Track = {
        ...currentTrack,
        cells: currentTrack.cells.map((row, y) =>
          row.map((c, x) => {
            if (x === gx && y === gy) {
              return newCell;
            }
            return c;
          })
        ),
      };

      pushToHistory([{ x: gx, y: gy, oldCell, newCell }]);
      setCurrentTrack(newTrack);
      setSelectedCell({ x: gx, y: gy });
    },
    [currentTrack, pushToHistory]
  );

  const handleCellTypeChange = (newType: CellType) => {
    if (!currentTrack || !selectedCell) return;
    const { x, y } = selectedCell;
    const oldCell = { ...currentTrack.cells[y][x] };
    const newCell: Cell = {
      ...oldCell,
      type: newType,
      ...(newType === 'obstacle' ? { height: 1 } : {}),
      ...(newType === 'speed_boost' ? { multiplier: 1.5 } : {}),
    };
    const newTrack: Track = {
      ...currentTrack,
      cells: currentTrack.cells.map((row, ry) =>
        row.map((c, cx) => {
          if (cx === x && ry === y) {
            return newCell;
          }
          return c;
        })
      ),
    };
    pushToHistory([{ x, y, oldCell, newCell }]);
    setCurrentTrack(newTrack);
  };

  const handleHeightChange = (height: number) => {
    if (!currentTrack || !selectedCell) return;
    const { x, y } = selectedCell;
    const oldCell = { ...currentTrack.cells[y][x] };
    const newCell: Cell = { ...oldCell, height };
    const newTrack: Track = {
      ...currentTrack,
      cells: currentTrack.cells.map((row, ry) =>
        row.map((c, cx) =>
          cx === x && ry === y ? newCell : c
        )
      ),
    };
    pushToHistory([{ x, y, oldCell, newCell }]);
    setCurrentTrack(newTrack);
  };

  const handleMultiplierChange = (multiplier: number) => {
    if (!currentTrack || !selectedCell) return;
    const { x, y } = selectedCell;
    const oldCell = { ...currentTrack.cells[y][x] };
    const newCell: Cell = { ...oldCell, multiplier };
    const newTrack: Track = {
      ...currentTrack,
      cells: currentTrack.cells.map((row, ry) =>
        row.map((c, cx) =>
          cx === x && ry === y ? newCell : c
        )
      ),
    };
    pushToHistory([{ x, y, oldCell, newCell }]);
    setCurrentTrack(newTrack);
  };

  const handleSave = () => {
    if (!currentTrack) return;
    saveTrack(currentTrack);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 1500);
    initializeHistory();
  };

  const handleExport = () => {
    if (!currentTrack) return;
    navigator.clipboard.writeText(JSON.stringify(currentTrack));
  };

  const handleImport = () => {
    setErrorMessage('');
    try {
      const parsed = JSON.parse(importText) as Track;
      if (!parsed.cells || !Array.isArray(parsed.cells)) {
        setErrorMessage('无效的赛道数据：缺少 cells 数组');
        return;
      }
      if (parsed.cells.length !== GRID_HEIGHT || parsed.cells[0].length !== GRID_WIDTH) {
        setErrorMessage('无效的赛道数据：cells 维度不匹配');
        return;
      }
      let obstacleCount = 0;
      for (const row of parsed.cells) {
        for (const cell of row) {
          if (cell.type === 'obstacle') obstacleCount++;
        }
      }
      if (obstacleCount > 30) {
        setErrorMessage('障碍物数量不能超过30个');
        return;
      }
      setCurrentTrack(parsed);
      setSelectedCell(null);
      setImportText('');
      setShowImport(false);
      initializeHistory();
    } catch {
      setErrorMessage('导入失败：JSON 解析错误');
    }
  };

  const handleCreateTrack = () => {
    if (!trackName.trim()) return;
    const track = createEmptyTrack(trackName.trim());
    saveTrack(track);
    setCurrentTrack(track);
    setSelectedCell(null);
    setShowTrackList(false);
    setTrackName('');
    setShowNewTrack(false);
    initializeHistory();
  };

  const handleDeleteTrack = (id: string) => {
    deleteTrack(id);
  };

  const handleEditTrack = (track: Track) => {
    const newTrack = { ...track, cells: track.cells.map((row) => row.map((c) => ({ ...c }))) };
    setCurrentTrack(newTrack);
    setSelectedCell(null);
    setShowTrackList(false);
    initializeHistory();
  };

  if (showTrackList) {
    return (
      <div className="page-container">
        <h2 style={{ color: '#00f5d4', marginBottom: '20px' }}>赛道编辑器</h2>

        <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn-primary" onClick={() => setShowNewTrack(!showNewTrack)}>
            新建赛道
          </button>
        </div>

        {showNewTrack && (
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              placeholder="赛道名称"
              style={{
                background: '#0a0f24',
                border: '1px solid #00f5d4',
                color: '#e0e0e0',
                padding: '6px 10px',
                borderRadius: '4px',
                fontFamily: "'Courier New', monospace",
                outline: 'none',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateTrack();
              }}
            />
            <button className="btn-primary" onClick={handleCreateTrack}>
              确定
            </button>
            <button className="btn-secondary" onClick={() => { setShowNewTrack(false); setTrackName(''); }}>
              取消
            </button>
          </div>
        )}

        <div className="track-list">
          {tracks.map((track) => (
            <div key={track.id} className="track-card neon-border">
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>{track.name}</div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
                {new Date(track.createdAt).toLocaleDateString()}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '13px' }} onClick={() => handleEditTrack(track)}>
                  编辑
                </button>
                <button className="btn-danger" style={{ padding: '6px 14px', fontSize: '13px' }} onClick={() => handleDeleteTrack(track.id)}>
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>

        {tracks.length === 0 && (
          <div style={{ color: '#666', textAlign: 'center', marginTop: '40px' }}>
            暂无赛道，点击"新建赛道"开始创建
          </div>
        )}
      </div>
    );
  }

  if (!currentTrack) return null;

  const selectedCellData =
    selectedCell && currentTrack
      ? currentTrack.cells[selectedCell.y][selectedCell.x]
      : null;

  const canUndo = historyIndexRef.current >= 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;
  // historyVersion 用于触发重渲染，请勿移除
  void historyVersion;

  return (
    <div className="page-container">
      <div className="editor-layout">
        <div className="canvas-container neon-border">
          <canvas
            ref={canvasRef}
            width={GRID_WIDTH * CELL_SIZE}
            height={GRID_HEIGHT * CELL_SIZE}
            onClick={handleCanvasClick}
            style={{ display: 'block', cursor: 'crosshair' }}
          />
        </div>

        <div className="param-panel neon-border">
          <h3 style={{ color: '#00f5d4', marginBottom: '16px' }}>参数面板</h3>

          {selectedCell && selectedCellData ? (
            <div>
              <label>坐标</label>
              <div style={{ color: '#e0e0e0', marginBottom: '8px' }}>
                ({selectedCell.x}, {selectedCell.y})
              </div>

              <label>类型</label>
              <select
                value={selectedCellData.type}
                onChange={(e) => handleCellTypeChange(e.target.value as CellType)}
              >
                {CELL_TYPES.map((ct) => (
                  <option key={ct} value={ct}>
                    {CELL_TYPE_LABELS[ct]}
                  </option>
                ))}
              </select>

              {selectedCellData.type === 'obstacle' && (
                <>
                  <label>高度</label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={1}
                    value={selectedCellData.height}
                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                  />
                  <div style={{ color: '#e0e0e0', fontSize: '12px', marginBottom: '8px' }}>
                    {selectedCellData.height}
                  </div>
                </>
              )}

              {selectedCellData.type === 'speed_boost' && (
                <>
                  <label>加速倍率</label>
                  <input
                    type="range"
                    min={1.5}
                    max={3.0}
                    step={0.1}
                    value={selectedCellData.multiplier}
                    onChange={(e) => handleMultiplierChange(Number(e.target.value))}
                  />
                  <div style={{ color: '#e0e0e0', fontSize: '12px', marginBottom: '8px' }}>
                    {selectedCellData.multiplier.toFixed(1)}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ color: '#666', fontStyle: 'italic', marginBottom: '16px' }}>
              点击格子选择
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className="undo-redo-btn"
                onClick={handleUndo}
                disabled={!canUndo}
                title="撤销 (Ctrl+Z)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7v6h6" />
                  <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                </svg>
                撤销
              </button>
              <button
                className="undo-redo-btn"
                onClick={handleRedo}
                disabled={!canRedo}
                title="重做 (Ctrl+Y)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 7v6h-6" />
                  <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
                </svg>
                重做
              </button>
            </div>
            <button
              className="btn-primary"
              onClick={handleSave}
              style={{
                boxShadow: '0 0 15px rgba(0, 245, 212, 0.4)',
              }}
            >
              {saveFeedback ? '✓ 已保存' : '保存赛道'}
            </button>
            <button className="btn-secondary" onClick={() => { setCurrentTrack(null); setSelectedCell(null); setShowTrackList(true); }}>
              返回列表
            </button>
            <button className="btn-secondary" onClick={handleExport}>
              导出
            </button>
            <button className="btn-secondary" onClick={() => { setShowImport(!showImport); setErrorMessage(''); }}>
              导入
            </button>

            {showImport && (
              <div style={{ marginTop: '8px' }}>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="粘贴赛道 JSON 数据"
                  rows={4}
                  style={{
                    width: '100%',
                    background: '#0a0f24',
                    border: '1px solid #00f5d4',
                    color: '#e0e0e0',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    fontFamily: "'Courier New', monospace",
                    fontSize: '11px',
                    resize: 'vertical',
                  }}
                />
                <button className="btn-primary" style={{ marginTop: '8px', width: '100%' }} onClick={handleImport}>
                  确认导入
                </button>
                {errorMessage && (
                  <div style={{ color: '#ff006e', fontSize: '12px', marginTop: '6px' }}>
                    {errorMessage}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
