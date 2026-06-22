import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { useGame } from '../context/GameContext';
import { BUILDING_CONFIGS, GRID_SIZE, TILE_W, TILE_H, PARTICLE_COUNT } from '../utils/constants';
import type { BuildingType, Building, LeaderboardEntry, SaveData } from '../types';

const CANVAS_W = 960;
const CANVAS_H = 600;
const CANVAS_OFFSET_X = CANVAS_W / 2;
const CANVAS_OFFSET_Y = 80;

type Particle = { x: number; y: number; vx: number; vy: number; life: number };

const gridToScreen = (gx: number, gy: number) => ({
  x: (gx - gy) * TILE_W / 2 + CANVAS_OFFSET_X,
  y: (gx + gy) * TILE_H / 2 + CANVAS_OFFSET_Y,
});

const screenToGrid = (sx: number, sy: number) => {
  const dx = sx - CANVAS_OFFSET_X;
  const dy = sy - CANVAS_OFFSET_Y;
  const gx = (dx / (TILE_W / 2) + dy / (TILE_H / 2)) / 2;
  const gy = (dy / (TILE_H / 2) - dx / (TILE_W / 2)) / 2;
  return { gx: Math.floor(gx), gy: Math.floor(gy) };
};

const formatDate = (t: number) => {
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const MainUI: React.FC = () => {
  const game = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const buildingAnimRef = useRef<Map<string, { t: number; nx: number; ny: number }>>(new Map());
  const invalidFlashRef = useRef<{ x: number; y: number; size: number; t: number } | null>(null);

  const [panelOpen, setPanelOpen] = useState(true);
  const [draggingType, setDraggingType] = useState<BuildingType | null>(null);
  const [dragPos, setDragPos] = useState<{ gx: number; gy: number; screenX: number; screenY: number } | null>(null);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSubmitScore, setShowSubmitScore] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [saves, setSaves] = useState<Array<{ id: string; timestamp: number; survivalDays: number }>>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const prevResRef = useRef({ oxy: 100, eng: 100, met: 150 });
  const [resAnim, setResAnim] = useState({ oxy: false, eng: false, met: false });
  const [endDaysDisplay, setEndDaysDisplay] = useState(0);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2000);
  }, []);

  useEffect(() => {
    const p = prevResRef.current;
    if (Math.abs(game.resources.oxygen - p.oxy) > 0.5) {
      setResAnim(a => ({ ...a, oxy: true }));
      setTimeout(() => setResAnim(a => ({ ...a, oxy: false })), 300);
    }
    if (Math.abs(game.resources.energy - p.eng) > 0.5) {
      setResAnim(a => ({ ...a, eng: true }));
      setTimeout(() => setResAnim(a => ({ ...a, eng: false })), 300);
    }
    if (Math.abs(game.resources.metal - p.met) > 0.5) {
      setResAnim(a => ({ ...a, met: true }));
      setTimeout(() => setResAnim(a => ({ ...a, met: false })), 300);
    }
    prevResRef.current = { oxy: game.resources.oxygen, eng: game.resources.energy, met: game.resources.metal };
  }, [game.resources.oxygen, game.resources.energy, game.resources.metal]);

  useEffect(() => {
    if (game.gameOver) {
      let start = 0;
      const target = game.survivalDays;
      const dur = 1000;
      const t0 = performance.now();
      const step = (t: number) => {
        const elapsed = t - t0;
        const p = Math.min(1, elapsed / dur);
        const ease = 1 - Math.pow(1 - p, 3);
        setEndDaysDisplay(Math.round(target * ease));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }, [game.gameOver, game.survivalDays]);

  useEffect(() => {
    if (game.sandstorm.active && particlesRef.current.length === 0) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particlesRef.current.push(makeParticle());
      }
    }
    if (!game.sandstorm.active) {
      particlesRef.current = [];
    }
  }, [game.sandstorm.active]);

  const makeParticle = (): Particle => {
    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0, vx = 0, vy = 0;
    const cx = CANVAS_W / 2;
    const cy = CANVAS_H / 2;
    const speed = 0.5 + Math.random() * 1.5;
    if (side === 0) { x = Math.random() * CANVAS_W; y = 0; }
    else if (side === 1) { x = CANVAS_W; y = Math.random() * CANVAS_H; }
    else if (side === 2) { x = Math.random() * CANVAS_W; y = CANVAS_H; }
    else { x = 0; y = Math.random() * CANVAS_H; }
    const ang = Math.atan2(cy - y, cx - x) + (Math.random() - 0.5) * 0.4;
    vx = Math.cos(ang) * speed;
    vy = Math.sin(ang) * speed;
    return { x, y, vx, vy, life: 1 };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      drawBackground(ctx);
      drawGrid(ctx);

      const sortedBuildings = [...game.buildings].sort((a, b) => (a.gridX + a.gridY) - (b.gridX + b.gridY));
      for (const b of sortedBuildings) {
        drawBuilding(ctx, b);
      }

      if (invalidFlashRef.current) {
        const f = invalidFlashRef.current;
        f.t -= 1;
        if (f.t > 0 && f.t % 10 < 5) {
          const tl = gridToScreen(f.x, f.y);
          const br = gridToScreen(f.x + f.size, f.y + f.size);
          ctx.save();
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 2;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
          ctx.beginPath();
          ctx.moveTo(tl.x, tl.y);
          ctx.lineTo(br.x, tl.y + (br.x - tl.x) * 0.5);
          ctx.lineTo(tl.x, br.y);
          ctx.lineTo(tl.x - (br.x - tl.x) * 0.5, tl.y + (br.x - tl.x) * 0.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        if (f.t <= 0) invalidFlashRef.current = null;
      }

      if (draggingType && dragPos) {
        drawDragPreview(ctx);
      }

      if (game.sandstorm.active) {
        ctx.save();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.restore();
        for (const p of particlesRef.current) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > CANVAS_W || p.y < 0 || p.y > CANVAS_H) {
            Object.assign(p, makeParticle());
          }
          ctx.fillStyle = '#94A3B8';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [game.buildings, game.sandstorm.active, draggingType, dragPos, game.builder]);

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    const grad = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, 100, CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.7);
    grad.addColorStop(0, '#1E293B');
    grad.addColorStop(1, '#0F172A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    for (let i = 0; i < 80; i++) {
      const sx = (i * 73) % CANVAS_W;
      const sy = (i * 131) % CANVAS_H;
      const r = (i % 3 === 0) ? 1.2 : 0.7;
      ctx.fillStyle = `rgba(148,163,184,${0.2 + (i % 5) * 0.1})`;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for (let g = 0; g <= GRID_SIZE; g++) {
      const tl1 = gridToScreen(g, 0);
      const br1 = gridToScreen(g, GRID_SIZE);
      ctx.beginPath();
      ctx.moveTo(tl1.x, tl1.y);
      ctx.lineTo(br1.x, br1.y);
      ctx.stroke();

      const tl2 = gridToScreen(0, g);
      const br2 = gridToScreen(GRID_SIZE, g);
      ctx.beginPath();
      ctx.moveTo(tl2.x, tl2.y);
      ctx.lineTo(br2.x, br2.y);
      ctx.stroke();
    }
  };

  const drawBuilding = (ctx: CanvasRenderingContext2D, b: Building) => {
    const cfg = BUILDING_CONFIGS[b.type];
    if (!cfg) return;

    let ox = 0, oy = 0;
    const anim = buildingAnimRef.current.get(b.id);
    if (anim && anim.t > 0) {
      anim.t -= 1;
      const p = anim.t / 30;
      ox = Math.sin((1 - p) * Math.PI * 2) * anim.nx * p;
      oy = Math.sin((1 - p) * Math.PI * 2) * anim.ny * p;
      if (anim.t <= 0) buildingAnimRef.current.delete(b.id);
    }

    const tl = gridToScreen(b.gridX, b.gridY);
    const tr = gridToScreen(b.gridX + b.size, b.gridY);
    const bl = gridToScreen(b.gridX, b.gridY + b.size);
    const br = gridToScreen(b.gridX + b.size, b.gridY + b.size);
    const cx = (tl.x + br.x) / 2 + ox;
    const cy = (tl.y + br.y) / 2 + oy;

    const depth = b.size * 18;
    const topY = tl.y - depth;

    ctx.save();
    ctx.translate(ox, oy);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.moveTo(tl.x + 4, tl.y + 6);
    ctx.lineTo(tr.x + 4, tr.y + 6);
    ctx.lineTo(br.x + 4, br.y + 6);
    ctx.lineTo(bl.x + 4, bl.y + 6);
    ctx.closePath();
    ctx.fill();

    // Left face
    ctx.fillStyle = shade(cfg.color, -20);
    ctx.beginPath();
    ctx.moveTo(bl.x, bl.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(br.x, br.y - depth);
    ctx.lineTo(bl.x, bl.y - depth);
    ctx.closePath();
    ctx.fill();

    // Right face
    ctx.fillStyle = shade(cfg.color, -35);
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.lineTo(bl.x, bl.y - depth);
    ctx.lineTo(tl.x, tl.y - depth);
    ctx.closePath();
    ctx.fill();

    // Top face
    ctx.fillStyle = cfg.color;
    ctx.beginPath();
    ctx.moveTo(tl.x, topY);
    ctx.lineTo(tr.x, tr.y - depth);
    ctx.lineTo(br.x, br.y - depth);
    ctx.lineTo(bl.x, bl.y - depth);
    ctx.closePath();
    ctx.fill();

    // Top edge
    ctx.strokeStyle = shade(cfg.color, 40);
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Icon
    ctx.font = `${20 + (b.size - 2) * 6}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cfg.icon, cx, (tl.y + topY) / 2 + 4);

    ctx.restore();
  };

  const drawDragPreview = (ctx: CanvasRenderingContext2D) => {
    if (!draggingType || !dragPos) return;
    const cfg = BUILDING_CONFIGS[draggingType];
    if (!cfg) return;
    const size = cfg.size;
    const gx = dragPos.gx;
    const gy = dragPos.gy;

    let valid = gx >= 0 && gy >= 0 && gx + size <= GRID_SIZE && gy + size <= GRID_SIZE;
    if (valid && game.builder) {
      valid = game.builder.canPlace(draggingType, gx, gy, game.resources).valid;
    }

    const tl = gridToScreen(gx, gy);
    const tr = gridToScreen(gx + size, gy);
    const bl = gridToScreen(gx, gy + size);
    const br = gridToScreen(gx + size, gy + size);
    const depth = size * 18;

    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = valid ? '#3B82F6' : '#EF4444';
    ctx.fillStyle = valid ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)';

    const topY = tl.y - depth;

    ctx.beginPath();
    ctx.moveTo(tl.x, topY);
    ctx.lineTo(tr.x, tr.y - depth);
    ctx.lineTo(br.x, br.y - depth);
    ctx.lineTo(bl.x, bl.y - depth);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.font = `${20 + (size - 2) * 6}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.8;
    const cx = (tl.x + br.x) / 2;
    ctx.fillText(cfg.icon, cx, (tl.y + topY) / 2 + 4);
    ctx.restore();
  };

  const shade = (hex: string, percent: number) => {
    const n = parseInt(hex.replace('#', ''), 16);
    let r = (n >> 16) & 0xff;
    let g = (n >> 8) & 0xff;
    let b = n & 0xff;
    r = Math.max(0, Math.min(255, r + Math.round(2.55 * percent)));
    g = Math.max(0, Math.min(255, g + Math.round(2.55 * percent)));
    b = Math.max(0, Math.min(255, b + Math.round(2.55 * percent)));
    return `rgb(${r},${g},${b})`;
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!draggingType) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (CANVAS_W / rect.width);
    const sy = (e.clientY - rect.top) * (CANVAS_H / rect.height);
    const { gx, gy } = screenToGrid(sx, sy);
    setDragPos({ gx, gy, screenX: sx, screenY: sy });
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (!draggingType || !dragPos || !game.builder) {
      setDraggingType(null);
      setDragPos(null);
      return;
    }
    const result = game.placeBuilding(draggingType, dragPos.gx, dragPos.gy);
    if (!result.success) {
      const cfg = BUILDING_CONFIGS[draggingType];
      invalidFlashRef.current = {
        x: Math.max(0, Math.min(GRID_SIZE - cfg.size, dragPos.gx)),
        y: Math.max(0, Math.min(GRID_SIZE - cfg.size, dragPos.gy)),
        size: cfg.size,
        t: 30,
      };
      showToast(result.reason || '放置失败', 'error');
    } else {
      const cfg = BUILDING_CONFIGS[draggingType];
      const neighbors = game.builder.findNeighbors(dragPos.gx, dragPos.gy, cfg.size);
      for (const nb of neighbors) {
        const dx = nb.gridX - dragPos.gx;
        const dy = nb.gridY - dragPos.gy;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        buildingAnimRef.current.set(nb.id, {
          t: 30,
          nx: dx / dist * 3,
          ny: dy / dist * 3,
        });
      }
      showToast(`${cfg.name} 已建造！`);
    }
    setDraggingType(null);
    setDragPos(null);
  };

  const onCanvasMouseLeave = () => {
    if (draggingType) {
      setDragPos(null);
    }
  };

  const startDragBuilding = (type: BuildingType) => {
    setDraggingType(type);
    setDragPos({ gx: -1, gy: -1, screenX: 0, screenY: 0 });
  };

  const handleSave = async () => {
    try {
      await axios.post('/api/save', {
        buildings: game.buildings,
        resources: game.resources,
        survivalDays: game.survivalDays,
      });
      showToast('存档成功！');
    } catch (err) {
      showToast('存档失败', 'error');
    }
  };

  const handleLoadSave = async () => {
    try {
      const res = await axios.get('/api/saves');
      setSaves(res.data);
      setShowLoadModal(true);
    } catch (err) {
      showToast('加载存档列表失败', 'error');
    }
  };

  const loadSaveById = async (id: string) => {
    try {
      const res = await axios.get<SaveData>(`/api/load/${id}`);
      game.loadSave(res.data);
      setShowLoadModal(false);
      showToast('存档已加载！');
    } catch (err) {
      showToast('加载存档失败', 'error');
    }
  };

  const deleteSave = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await axios.delete(`/api/delete/${id}`);
      setSaves(s => s.filter(x => x.id !== id));
      showToast('存档已删除');
    } catch (err) {
      showToast('删除失败', 'error');
    }
  };

  const handleOpenLeaderboard = async () => {
    try {
      const res = await axios.get('/api/leaderboard');
      setLeaderboard(res.data);
      setShowLeaderboard(true);
    } catch (err) {
      showToast('加载排行榜失败', 'error');
    }
  };

  const handleSubmitScore = async () => {
    if (!playerName.trim()) {
      showToast('请输入名称', 'error');
      return;
    }
    try {
      await axios.post('/api/leaderboard', {
        playerName: playerName.trim(),
        survivalDays: game.survivalDays,
      });
      showToast('分数已提交！');
      setShowSubmitScore(false);
      setPlayerName('');
      handleOpenLeaderboard();
    } catch (err) {
      showToast('提交失败', 'error');
    }
  };

  return (
    <div style={styles.app}>
      {game.showFlash && (
        <div style={{
          position: 'absolute', inset: 0, background: '#10B981', opacity: 0.35,
          pointerEvents: 'none', zIndex: 50,
          animation: 'fadeFlash 1s ease-out forwards',
        }} />
      )}
      {game.sandstorm.active && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(239, 68, 68, 0.08)',
          pointerEvents: 'none', zIndex: 10,
        }} />
      )}

      <TopResourceBar
        resources={game.resources}
        survivalDays={game.survivalDays}
        resAnim={resAnim}
      />

      <BuildingPanel
        open={panelOpen}
        onToggle={() => setPanelOpen(v => !v)}
        resources={game.resources}
        onPick={startDragBuilding}
        dragging={draggingType}
      />

      <div style={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={styles.canvas}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={onCanvasMouseLeave}
        />
      </div>

      <BottomActionBar
        onSave={handleSave}
        onLoad={handleLoadSave}
        onLeaderboard={handleOpenLeaderboard}
      />

      {toast && (
        <div style={{
          position: 'fixed', top: 100, left: '50%', transform: 'translateX(-50%)',
          padding: '12px 24px', borderRadius: 8, zIndex: 200,
          background: toast.type === 'success' ? '#065F46' : '#7F1D1D',
          color: '#E2E8F0', fontSize: 14, fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          animation: 'fadeInDown 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}>{toast.msg}</div>
      )}

      {showLoadModal && (
        <Modal title="加载存档" onClose={() => setShowLoadModal(false)}>
          {saves.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>暂无存档</div>
          ) : (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {saves.map(s => (
                <div
                  key={s.id}
                  onClick={() => loadSaveById(s.id)}
                  style={styles.saveItem}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#E2E8F0' }}>
                      生存天数：<span style={{ color: '#F59E0B' }}>{s.survivalDays}</span> 天
                    </div>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>{formatDate(s.timestamp)}</div>
                  </div>
                  <button
                    onClick={(e) => deleteSave(s.id, e)}
                    style={{
                      ...styles.btnSmall, background: 'transparent',
                      border: '1px solid #EF4444', color: '#EF4444',
                    }}
                  >删除</button>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {showLeaderboard && (
        <Modal title="全球排行榜" onClose={() => setShowLeaderboard(false)}>
          <div style={{ maxHeight: 480, overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px', padding: '12px 16px', background: '#1E293B', borderRadius: 8, marginBottom: 8, fontWeight: 600, fontSize: 13, color: '#94A3B8' }}>
              <div>排名</div>
              <div>玩家</div>
              <div style={{ textAlign: 'right' }}>生存天数</div>
            </div>
            {leaderboard.map(e => (
              <div key={e.rank + e.playerName} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px', padding: '12px 16px', alignItems: 'center', borderBottom: '1px solid #334155', fontSize: 14 }}>
                <div style={{
                  fontWeight: 700,
                  color: e.rank === 1 ? '#F59E0B' : e.rank === 2 ? '#94A3B8' : e.rank === 3 ? '#D97706' : '#CBD5E1',
                  fontSize: e.rank! <= 3 ? 18 : 14,
                }}>#{e.rank}</div>
                <div style={{ color: '#E2E8F0' }}>{e.playerName}</div>
                <div style={{ textAlign: 'right', color: '#F59E0B', fontWeight: 600 }}>{e.survivalDays} 天</div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {game.gameOver && (
        <GameOverPanel
          days={endDaysDisplay}
          targetDays={game.survivalDays}
          onRestart={game.resetGame}
          onSubmit={() => setShowSubmitScore(true)}
        />
      )}

      {showSubmitScore && (
        <Modal title="提交分数" onClose={() => setShowSubmitScore(false)}>
          <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: '#CBD5E1', marginBottom: 8 }}>你的名称</div>
              <input
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="输入名称（最多20字）"
                maxLength={20}
                style={{
                  width: '100%', padding: '10px 14px', background: '#0F172A',
                  border: '1px solid #334155', borderRadius: 8, color: '#E2E8F0',
                  fontSize: 14, outline: 'none',
                }}
              />
            </div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 16 }}>
              将以 <span style={{ color: '#F59E0B', fontWeight: 600 }}>{game.survivalDays}</span> 天提交到全球排行榜
            </div>
            <button onClick={handleSubmitScore} style={{
              ...styles.btn, width: '100%', background: '#F59E0B', color: '#0F172A',
              fontWeight: 700,
            }}>提交分数</button>
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes fadeFlash { from { opacity: 0.45; } to { opacity: 0; } }
        @keyframes fadeInDown { from { opacity: 0; transform: translate(-50%, -10px);} to { opacity: 1; transform: translate(-50%, 0);} }
        @keyframes slideIn { from { transform: translateX(-280px); opacity: 0;} to { transform: translateX(0); opacity: 1;} }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95);} to { opacity: 1; transform: scale(1);} }
      `}</style>
    </div>
  );
};

const TopResourceBar: React.FC<{
  resources: ReturnType<typeof useGame>['resources'];
  survivalDays: number;
  resAnim: { oxy: boolean; eng: boolean; met: boolean };
}> = ({ resources, survivalDays, resAnim }) => {
  const ResourceItem = ({
    icon, label, color, value, max, anim,
  }: { icon: string; label: string; color: string; value: number; max: number; anim: boolean }) => {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, fontSize: 18, filter: 'drop-shadow(0 0 4px ' + color + '60)',
        }}>{icon}</div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>{label}</span>
            <span
              style={{
                fontSize: 14, fontWeight: 700, color: '#E2E8F0',
                display: 'inline-block',
                transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                transform: anim ? 'scale(1.15)' : 'scale(1)',
              }}
            >{Math.floor(value)} <span style={{ fontWeight: 400, fontSize: 11, color: '#64748B' }}>/{max}</span></span>
          </div>
          <div style={{ width: 120, height: 10, background: '#0F172A', borderRadius: 6, overflow: 'hidden', border: '1px solid #334155' }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: `linear-gradient(90deg, ${color}, ${pct > 50 ? color : pct > 25 ? '#F59E0B' : '#EF4444'})`,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 20, background: '#1E293B', borderRadius: 12, padding: '12px 24px',
      display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      border: '1px solid #334155',
    }}>
      <ResourceItem icon="💧" label="氧气" color="#3B82F6" value={resources.oxygen} max={resources.oxygenMax} anim={resAnim.oxy} />
      <div style={{ width: 1, height: 32, background: '#334155' }} />
      <ResourceItem icon="⚡" label="能源" color="#F59E0B" value={resources.energy} max={resources.energyMax} anim={resAnim.eng} />
      <div style={{ width: 1, height: 32, background: '#334155' }} />
      <ResourceItem icon="⬡" label="金属" color="#10B981" value={resources.metal} max={resources.metalMax} anim={resAnim.met} />
      <div style={{ width: 1, height: 32, background: '#334155' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 8 }}>
        <div style={{ fontSize: 20 }}>🪐</div>
        <div>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>生存天数</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#F59E0B' }}>{survivalDays} <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 400 }}>天</span></div>
        </div>
      </div>
    </div>
  );
};

const BuildingPanel: React.FC<{
  open: boolean;
  onToggle: () => void;
  resources: ReturnType<typeof useGame>['resources'];
  onPick: (type: BuildingType) => void;
  dragging: BuildingType | null;
}> = ({ open, onToggle, resources, onPick, dragging }) => {
  const items = Object.values(BUILDING_CONFIGS);
  return (
    <div style={{
      position: 'absolute', top: 120, left: open ? 16 : -260, zIndex: 15,
      width: 240, background: '#1E293B', borderRadius: 12, padding: 16,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: '1px solid #334155',
      transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
    }}>
      <div onClick={onToggle} style={{
        position: 'absolute', right: -28, top: 16, width: 28, height: 48,
        background: '#1E293B', borderRadius: '0 8px 8px 0', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#94A3B8', fontSize: 14, border: '1px solid #334155',
        borderLeft: 'none', transition: 'color 0.2s',
      }}
        onMouseEnter={e => (e.currentTarget.style.color = '#E2E8F0')}
        onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
      >{open ? '◀' : '▶'}</div>

      <div style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🏗️</span> 建筑面板
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(cfg => {
          const canAfford = resources.oxygen >= cfg.cost.oxygen && resources.energy >= cfg.cost.energy && resources.metal >= cfg.cost.metal;
          const isActive = dragging === cfg.type;
          return (
            <div
              key={cfg.type}
              onMouseDown={() => canAfford && onPick(cfg.type)}
              style={{
                padding: 10, background: isActive ? '#334155' : '#0F172A',
                borderRadius: 8, cursor: canAfford ? 'grab' : 'not-allowed',
                opacity: canAfford ? 1 : 0.45, display: 'flex', gap: 12,
                alignItems: 'center', border: isActive ? `1px solid ${cfg.color}` : '1px solid #334155',
                transition: 'all 0.2s ease',
                transform: isActive ? 'scale(1.03)' : 'scale(1)',
              }}
              onMouseEnter={e => canAfford && (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={e => canAfford && (e.currentTarget.style.transform = isActive ? 'scale(1.03)' : 'scale(1)')}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 8, display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 28,
                background: cfg.color + '22', border: `1px solid ${cfg.color}66`,
                flexShrink: 0,
              }}>{cfg.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', marginBottom: 4 }}>
                  {cfg.name} <span style={{ fontSize: 10, color: '#64748B', fontWeight: 400 }}>({cfg.size}×{cfg.size})</span>
                </div>
                <div style={{ fontSize: 10, display: 'flex', gap: 8, flexWrap: 'wrap', color: '#94A3B8' }}>
                  {cfg.cost.oxygen > 0 && <span style={{ color: resources.oxygen >= cfg.cost.oxygen ? '#3B82F6' : '#EF4444' }}>💧{cfg.cost.oxygen}</span>}
                  {cfg.cost.energy > 0 && <span style={{ color: resources.energy >= cfg.cost.energy ? '#F59E0B' : '#EF4444' }}>⚡{cfg.cost.energy}</span>}
                  {cfg.cost.metal > 0 && <span style={{ color: resources.metal >= cfg.cost.metal ? '#10B981' : '#EF4444' }}>⬡{cfg.cost.metal}</span>}
                </div>
                <div style={{ fontSize: 10, marginTop: 3, color: '#64748B' }}>
                  {cfg.production.oxygen !== 0 && <span style={{ color: cfg.production.oxygen > 0 ? '#3B82F6' : '#EF4444', marginRight: 6 }}>💧{cfg.production.oxygen > 0 ? '+' : ''}{cfg.production.oxygen}/s</span>}
                  {cfg.production.energy !== 0 && <span style={{ color: cfg.production.energy > 0 ? '#F59E0B' : '#EF4444', marginRight: 6 }}>⚡{cfg.production.energy > 0 ? '+' : ''}{cfg.production.energy}/s</span>}
                  {cfg.production.metal !== 0 && <span style={{ color: cfg.production.metal > 0 ? '#10B981' : '#EF4444' }}>⬡{cfg.production.metal > 0 ? '+' : ''}{cfg.production.metal}/s</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const BottomActionBar: React.FC<{
  onSave: () => void;
  onLoad: () => void;
  onLeaderboard: () => void;
}> = ({ onSave, onLoad, onLeaderboard }) => {
  const btns = [
    { label: '💾 保存存档', onClick: onSave },
    { label: '📂 加载存档', onClick: onLoad },
    { label: '🏆 排行榜', onClick: onLeaderboard },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      height: 64, background: '#1E293B', borderRadius: 12, padding: 12,
      display: 'flex', alignItems: 'center', gap: 16, zIndex: 20,
      border: '1px solid #334155', boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
    }}>
      {btns.map(b => (
        <button
          key={b.label}
          onClick={b.onClick}
          style={styles.btn}
          onMouseEnter={e => (e.currentTarget.style.background = '#475569')}
          onMouseLeave={e => (e.currentTarget.style.background = '#334155')}
        >{b.label}</button>
      ))}
    </div>
  );
};

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 300, backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 520, maxWidth: '90vw', background: '#1E293B', borderRadius: 16,
          border: '1px solid #334155', boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          animation: 'modalIn 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid #334155',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#E2E8F0' }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: 8, background: 'transparent',
              border: 'none', color: '#94A3B8', fontSize: 18, cursor: 'pointer',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
          >✕</button>
        </div>
        <div style={{ padding: 16 }}>{children}</div>
      </div>
    </div>
  );
};

const GameOverPanel: React.FC<{
  days: number;
  targetDays: number;
  onRestart: () => void;
  onSubmit: () => void;
}> = ({ days, onRestart, onSubmit }) => {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 400,
    }}>
      <div style={{
        width: 480, maxWidth: '90vw', background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        borderRadius: 24, border: '1px solid #334155',
        boxShadow: '0 32px 96px rgba(0,0,0,0.7)', padding: 40, textAlign: 'center',
        animation: 'modalIn 0.4s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>💀</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#EF4444', marginBottom: 8 }}>殖民地陷落</div>
        <div style={{ fontSize: 14, color: '#94A3B8', marginBottom: 32 }}>资源耗尽，生存终结……</div>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 12, color: '#64748B', letterSpacing: 2, marginBottom: 8 }}>最终生存天数</div>
          <div style={{
            fontSize: 48, fontWeight: 900, color: '#F59E0B',
            textShadow: '0 0 20px rgba(245, 158, 11, 0.5)', lineHeight: 1,
          }}>{days}</div>
          <div style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>天</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onRestart}
            style={{
              flex: 1, padding: '14px 20px', borderRadius: 8, cursor: 'pointer',
              background: '#3B82F6', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2563EB')}
            onMouseLeave={e => (e.currentTarget.style.background = '#3B82F6')}
          >🚀 再来一局</button>
          <button
            onClick={onSubmit}
            style={{
              flex: 1, padding: '14px 20px', borderRadius: 8, cursor: 'pointer',
              background: '#F59E0B', color: '#0F172A', border: 'none', fontSize: 14, fontWeight: 700,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#D97706')}
            onMouseLeave={e => (e.currentTarget.style.background = '#F59E0B')}
          >🏆 提交分数</button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: { position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#0F172A' },
  canvasWrap: {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  },
  canvas: {
    display: 'block', borderRadius: 16, border: '1px solid #334155',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 0 80px rgba(59,130,246,0.05)',
    background: '#0F172A', cursor: 'crosshair', maxWidth: '100%', maxHeight: '100%',
  },
  btn: {
    padding: '10px 20px', borderRadius: 8, cursor: 'pointer', background: '#334155',
    color: '#E2E8F0', border: 'none', fontSize: 14, fontWeight: 600,
    transition: 'background 0.2s', whiteSpace: 'nowrap',
  },
  btnSmall: {
    padding: '6px 12px', borderRadius: 6, cursor: 'pointer', border: 'none',
    fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
  },
  saveItem: {
    padding: '14px 16px', borderRadius: 8, cursor: 'pointer',
    background: '#0F172A', border: '1px solid #334155', marginBottom: 8,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    transition: 'all 0.2s',
  },
};

export default MainUI;
