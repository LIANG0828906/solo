import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useGameStore } from '../store/gameStore';
import {
  BattleState,
  Ship,
  SpaceCoord,
  GRID_WIDTH,
  GRID_HEIGHT,
  BattleLogEntry,
  AttackAnimation
} from '../engine/types';
import { getDistance } from '../engine/battleEngine';

const CELL_SIZE = 60;
const HEX_RADIUS = 28;

function drawHexGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cellSize: number
) {
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.06)';
  ctx.lineWidth = 1;

  const cols = GRID_WIDTH;
  const rows = GRID_HEIGHT;
  const offsetX = (width - cols * cellSize) / 2;
  const offsetY = (height - rows * cellSize) / 2;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = offsetX + col * cellSize + cellSize / 2;
      const cy = offsetY + row * cellSize + cellSize / 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const hx = cx + HEX_RADIUS * Math.cos(angle);
        const hy = cy + HEX_RADIUS * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = 'rgba(0, 212, 255, 0.015)';
      ctx.fill();
    }
  }

  return { offsetX, offsetY };
}

function getGridOffset(width: number, height: number) {
  return {
    offsetX: (width - GRID_WIDTH * CELL_SIZE) / 2,
    offsetY: (height - GRID_HEIGHT * CELL_SIZE) / 2
  };
}

function gridToPixel(coord: SpaceCoord, offsetX: number, offsetY: number) {
  return {
    px: offsetX + coord.x * CELL_SIZE + CELL_SIZE / 2,
    py: offsetY + coord.y * CELL_SIZE + CELL_SIZE / 2
  };
}

function pixelToGrid(px: number, py: number, offsetX: number, offsetY: number): SpaceCoord | null {
  const gx = Math.floor((px - offsetX) / CELL_SIZE);
  const gy = Math.floor((py - offsetY) / CELL_SIZE);
  if (gx < 0 || gx >= GRID_WIDTH || gy < 0 || gy >= GRID_HEIGHT) return null;
  return { x: gx, y: gy };
}

const BattleGrid: React.FC<{
  battleState: BattleState;
  onSelectShip: (id: string | null) => void;
  onAttackTarget: (targetId: string) => void;
  animations: AttackAnimation[];
}> = ({ battleState, onSelectShip, onAttackTarget, animations }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<SpaceCoord | null>(null);
  const animFrameRef = useRef<number>(0);
  const animProgressRef = useRef<Map<string, number>>(new Map());

  const selectedShip = battleState.playerShips.find(s => s.id === battleState.selectedShipId);

  const getAttackableTargets = useCallback(() => {
    if (!selectedShip) return [];
    return battleState.enemyShips.filter(s => s.stats.hp > 0);
  }, [selectedShip, battleState.enemyShips]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);
    const { offsetX, offsetY } = drawHexGrid(ctx, w, h, CELL_SIZE);

    if (selectedShip) {
      const targets = getAttackableTargets();
      targets.forEach(target => {
        const { px, py } = gridToPixel(target.position, offsetX, offsetY);
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 200);
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 51, 85, ${0.3 + pulse * 0.4})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px, py, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 51, 85, 0.6)';
        ctx.fill();
      });
    }

    if (selectedShip && hoveredCell) {
      const hoveredShip = battleState.enemyShips.find(
        s => s.position.x === hoveredCell.x && s.position.y === hoveredCell.y && s.stats.hp > 0
      );
      if (hoveredShip) {
        const from = gridToPixel(selectedShip.position, offsetX, offsetY);
        const to = gridToPixel(hoveredShip.position, offsetX, offsetY);
        ctx.beginPath();
        ctx.setLineDash([6, 4]);
        ctx.moveTo(from.px, from.py);
        ctx.lineTo(to.px, to.py);
        ctx.strokeStyle = 'rgba(255, 51, 85, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    battleState.playerShips.forEach(ship => {
      if (ship.stats.hp <= 0) return;
      const { px, py } = gridToPixel(ship.position, offsetX, offsetY);

      if (ship.id === battleState.selectedShipId) {
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 150);
        ctx.beginPath();
        ctx.arc(px, py, 22, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 212, 255, ${0.4 + pulse * 0.4})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowColor = 'rgba(0, 212, 255, 0.5)';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.save();
      ctx.translate(px, py);
      const scale = ship.type === 'cruiser' ? 0.9 : ship.type === 'destroyer' ? 0.8 : 0.65;
      ctx.scale(scale, scale);

      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(12, 14);
      ctx.lineTo(4, 10);
      ctx.lineTo(0, 16);
      ctx.lineTo(-4, 10);
      ctx.lineTo(-12, 14);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, -20, 0, 16);
      gradient.addColorStop(0, '#00d4ff');
      gradient.addColorStop(1, '#005588');
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      const hpRatio = ship.stats.hp / ship.stats.maxHp;
      const shieldRatio = ship.stats.shield.value / ship.stats.shield.maxValue;
      const barW = 24;
      const barH = 3;
      const barY = py + 18;

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(px - barW / 2, barY, barW, barH);
      ctx.fillStyle = hpRatio > 0.5 ? '#00ff88' : hpRatio > 0.25 ? '#ffaa44' : '#ff3355';
      ctx.fillRect(px - barW / 2, barY, barW * hpRatio, barH);

      if (shieldRatio > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(px - barW / 2, barY + 4, barW, 2);
        ctx.fillStyle = '#44ddff';
        ctx.fillRect(px - barW / 2, barY + 4, barW * shieldRatio, 2);
      }
    });

    battleState.enemyShips.forEach(ship => {
      if (ship.stats.hp <= 0) return;
      const { px, py } = gridToPixel(ship.position, offsetX, offsetY);

      ctx.save();
      ctx.translate(px, py);
      const scale = ship.type === 'cruiser' ? 0.9 : ship.type === 'destroyer' ? 0.8 : 0.65;
      ctx.scale(-scale, scale);

      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(12, 14);
      ctx.lineTo(4, 10);
      ctx.lineTo(0, 16);
      ctx.lineTo(-4, 10);
      ctx.lineTo(-12, 14);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, -20, 0, 16);
      gradient.addColorStop(0, '#ff3355');
      gradient.addColorStop(1, '#881133');
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = '#ff3355';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      const hpRatio = ship.stats.hp / ship.stats.maxHp;
      const shieldRatio = ship.stats.shield.value / ship.stats.shield.maxValue;
      const barW = 24;
      const barH = 3;
      const barY = py + 18;

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(px - barW / 2, barY, barW, barH);
      ctx.fillStyle = hpRatio > 0.5 ? '#00ff88' : hpRatio > 0.25 ? '#ffaa44' : '#ff3355';
      ctx.fillRect(px - barW / 2, barY, barW * hpRatio, barH);

      if (shieldRatio > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(px - barW / 2, barY + 4, barW, 2);
        ctx.fillStyle = '#ff6644';
        ctx.fillRect(px - barW / 2, barY + 4, barW * shieldRatio, 2);
      }
    });

    animations.forEach(anim => {
      const progress = animProgressRef.current.get(anim.id) || 0;
      if (progress >= 1) return;

      const from = gridToPixel(anim.from, offsetX, offsetY);
      const to = gridToPixel(anim.to, offsetX, offsetY);
      const cx = from.px + (to.px - from.px) * progress;
      const cy = from.py + (to.py - from.py) * progress;

      const glowSize = anim.isCrit ? 12 : 8;
      const color = anim.isCrit ? '#c9a84c' : '#00d4ff';

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowSize);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, glowSize, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.setLineDash([4, 3]);
      ctx.moveTo(from.px, from.py);
      ctx.lineTo(cx, cy);
      ctx.strokeStyle = `${color}88`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
    });

    animFrameRef.current = requestAnimationFrame(draw);
  }, [battleState, animations, selectedShip, hoveredCell, getAttackableTargets]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  useEffect(() => {
    const animLoop = () => {
      let needsUpdate = false;
      animProgressRef.current.forEach((val, key) => {
        if (val < 1) {
          animProgressRef.current.set(key, Math.min(1, val + 0.06));
          needsUpdate = true;
        }
      });
      if (needsUpdate) requestAnimationFrame(animLoop);
    };
    requestAnimationFrame(animLoop);
  }, [animations]);

  useEffect(() => {
    animations.forEach(a => {
      if (!animProgressRef.current.has(a.id)) {
        animProgressRef.current.set(a.id, 0);
      }
    });
  }, [animations]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { offsetX, offsetY } = getGridOffset(rect.width, rect.height);
    const coord = pixelToGrid(x, y, offsetX, offsetY);
    if (!coord) return;

    const clickedPlayer = battleState.playerShips.find(
      s => s.position.x === coord.x && s.position.y === coord.y && s.stats.hp > 0
    );
    const clickedEnemy = battleState.enemyShips.find(
      s => s.position.x === coord.x && s.position.y === coord.y && s.stats.hp > 0
    );

    if (battleState.turnPhase === 'select' && clickedPlayer && !clickedPlayer.hasActed) {
      onSelectShip(clickedPlayer.id);
    } else if (battleState.turnPhase === 'target' && clickedEnemy) {
      if (battleState.selectedShipId) {
        onAttackTarget(clickedEnemy.id);
      }
    } else {
      onSelectShip(null);
    }
  }, [battleState, onSelectShip, onAttackTarget]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { offsetX, offsetY } = getGridOffset(rect.width, rect.height);
    const coord = pixelToGrid(x, y, offsetX, offsetY);
    setHoveredCell(coord);
  }, []);

  return (
    <div className="battle-grid-wrapper" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="battle-grid-canvas"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
      />
    </div>
  );
};

const BattleLogPanel: React.FC<{ log: BattleLogEntry[]; isEnemy: boolean }> = ({ log, isEnemy }) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [log.length]);

  return (
    <div className="battle-log-container">
      <div className="battle-log-header">
        <span>战斗日志</span>
        <span style={{ fontSize: '0.55rem', color: 'var(--text-dim)' }}>
          {log.length} 条记录
        </span>
      </div>
      <div className="battle-log-list" ref={listRef}>
        {log.map(entry => {
          let cls = entry.isHit ? 'player-action' : 'miss';
          if (entry.isCrit) cls = 'crit';
          if (entry.remainingHp <= 0) cls = 'kill';
          if (isEnemy) cls = 'enemy-action';

          return (
            <div key={entry.id} className={`battle-log-entry ${cls}`}>
              <span className="battle-log-time">
                {new Date(entry.timestamp).toLocaleTimeString('zh-CN', { hour12: false })}{' '}
              </span>
              {entry.message}
              {entry.isHit && (
                <span style={{ color: 'var(--accent)', marginLeft: 4 }}>
                  [{entry.damage}DMG{entry.shieldAbsorbed > 0 ? ` 盾挡${entry.shieldAbsorbed}` : ''} HP:${entry.remainingHp} 盾:${entry.remainingShield}]
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RestOverlay: React.FC = () => {
  const battleState = useGameStore(s => s.battleState);
  const battleStats = useGameStore(s => s.battleStats);
  const proceedToNextWave = useGameStore(s => s.proceedToNextWave);

  if (!battleState || !battleState.isResting) return null;

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}分${sec}秒`;
  };

  return (
    <div className="rest-overlay">
      <div className="rest-panel">
        <div className="rest-title">波次 {battleState.waveNumber} 胜利！</div>
        <div className="rest-stats">
          <div className="rest-stat">
            <div className="rest-stat-value">
              {battleStats?.enemiesDestroyed ?? 0}
            </div>
            <div className="rest-stat-label">歼敌数</div>
          </div>
          <div className="rest-stat">
            <div className="rest-stat-value">
              {battleStats?.shipsLost ?? 0}
            </div>
            <div className="rest-stat-label">损失数</div>
          </div>
          <div className="rest-stat">
            <div className="rest-stat-value">
              {formatDuration(battleStats?.duration ?? 0)}
            </div>
            <div className="rest-stat-label">耗时</div>
          </div>
        </div>
        <button className="battle-btn primary" onClick={proceedToNextWave}>
          下一波 →
        </button>
      </div>
    </div>
  );
};

const BattlePage: React.FC = () => {
  const battleState = useGameStore(s => s.battleState);
  const battleStats = useGameStore(s => s.battleStats);
  const startBattle = useGameStore(s => s.startBattle);
  const selectShip = useGameStore(s => s.selectShip);
  const playerAttack = useGameStore(s => s.playerAttack);
  const endPlayerTurn = useGameStore(s => s.endPlayerTurn);
  const endBattle = useGameStore(s => s.endBattle);
  const waveNumber = useGameStore(s => s.waveNumber);

  const [currentAnimations, setCurrentAnimations] = useState<AttackAnimation[]>([]);

  const handleAttack = useCallback((targetId: string) => {
    if (!battleState || !battleState.selectedShipId) return;
    playerAttack(battleState.selectedShipId, targetId);
  }, [battleState, playerAttack]);

  if (!battleState) {
    return (
      <div className="battle-start-area">
        <div className="battle-start-title">准备战斗</div>
        <div className="wave-info">当前波次: 第 {waveNumber} 波</div>
        <button className="battle-btn" onClick={startBattle}>
          开始战斗
        </button>
        <div style={{ color: 'var(--text-dim)', fontSize: '0.65rem', marginTop: 8 }}>
          请先在舰队管理页面配置编队
        </div>
      </div>
    );
  }

  const phaseText = battleState.phase === 'player'
    ? '我方行动'
    : battleState.phase === 'enemy'
    ? '敌方行动'
    : '战斗结束';
  const phaseClass = battleState.phase === 'player'
    ? 'player-phase'
    : battleState.phase === 'enemy'
    ? 'enemy-phase'
    : 'ended-phase';

  const allActed = battleState.playerShips
    .filter(s => s.stats.hp > 0)
    .every(s => s.hasActed);

  return (
    <div className="battle-page" style={{ position: 'relative' }}>
      <div className="battle-grid-container">
        <div className="battle-info-bar">
          <span className={`battle-phase ${phaseClass}`}>{phaseText}</span>
          <span className="battle-turn">回合 {battleState.currentTurn}</span>
          <span className="battle-wave">波次 {battleState.waveNumber}</span>
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          <BattleGrid
            battleState={battleState}
            onSelectShip={selectShip}
            onAttackTarget={handleAttack}
            animations={currentAnimations}
          />
          <RestOverlay />
          {battleState.phase === 'ended' && !battleState.isResting && (
            <div className="rest-overlay">
              <div className="rest-panel">
                <div className="rest-title" style={{ color: 'var(--danger)' }}>战斗失败</div>
                <button className="battle-btn danger" onClick={endBattle} style={{ marginTop: 16 }}>
                  返回舰队管理
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="battle-controls">
          <button
            className="battle-btn"
            disabled={battleState.phase !== 'player' || !allActed}
            onClick={endPlayerTurn}
          >
            结束回合
          </button>
          <button
            className="battle-btn danger"
            onClick={endBattle}
          >
            撤退
          </button>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', alignSelf: 'center' }}>
            {battleState.turnPhase === 'select' && '点击己方飞船选择'}
            {battleState.turnPhase === 'target' && '点击敌方飞船攻击'}
            {battleState.turnPhase === 'animating' && '战斗动画播放中...'}
          </div>
        </div>
      </div>
      <BattleLogPanel log={battleState.log} isEnemy={battleState.phase === 'enemy'} />
    </div>
  );
};

export default BattlePage;
