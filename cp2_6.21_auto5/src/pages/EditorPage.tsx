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

      const cell = currentTrack.cells[gy][gx];
      const currentIdx = CELL_TYPES.indexOf(cell.type);
      const nextType = CELL_TYPES[(currentIdx + 1) % CELL_TYPES.length];

      const newTrack: Track = {
        ...currentTrack,
        cells: currentTrack.cells.map((row, y) =>
          row.map((c, x) => {
            if (x === gx && y === gy) {
              return {
                ...c,
                type: nextType,
                ...(nextType === 'obstacle' ? { height: 1 } : {}),
                ...(nextType === 'speed_boost' ? { multiplier: 1.5 } : {}),
              };
            }
            return c;
          })
        ),
      };

      setCurrentTrack(newTrack);
      setSelectedCell({ x: gx, y: gy });
    },
    [currentTrack]
  );

  const handleCellTypeChange = (newType: CellType) => {
    if (!currentTrack || !selectedCell) return;
    const { x, y } = selectedCell;
    const newTrack: Track = {
      ...currentTrack,
      cells: currentTrack.cells.map((row, ry) =>
        row.map((c, cx) => {
          if (cx === x && ry === y) {
            return {
              ...c,
              type: newType,
              ...(newType === 'obstacle' ? { height: 1 } : {}),
              ...(newType === 'speed_boost' ? { multiplier: 1.5 } : {}),
            };
          }
          return c;
        })
      ),
    };
    setCurrentTrack(newTrack);
  };

  const handleHeightChange = (height: number) => {
    if (!currentTrack || !selectedCell) return;
    const { x, y } = selectedCell;
    const newTrack: Track = {
      ...currentTrack,
      cells: currentTrack.cells.map((row, ry) =>
        row.map((c, cx) =>
          cx === x && ry === y ? { ...c, height } : c
        )
      ),
    };
    setCurrentTrack(newTrack);
  };

  const handleMultiplierChange = (multiplier: number) => {
    if (!currentTrack || !selectedCell) return;
    const { x, y } = selectedCell;
    const newTrack: Track = {
      ...currentTrack,
      cells: currentTrack.cells.map((row, ry) =>
        row.map((c, cx) =>
          cx === x && ry === y ? { ...c, multiplier } : c
        )
      ),
    };
    setCurrentTrack(newTrack);
  };

  const handleSave = () => {
    if (!currentTrack) return;
    saveTrack(currentTrack);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 1500);
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
  };

  const handleDeleteTrack = (id: string) => {
    deleteTrack(id);
  };

  const handleEditTrack = (track: Track) => {
    setCurrentTrack({ ...track, cells: track.cells.map((row) => row.map((c) => ({ ...c }))) });
    setSelectedCell(null);
    setShowTrackList(false);
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
            <button className="btn-primary" onClick={handleSave}>
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
