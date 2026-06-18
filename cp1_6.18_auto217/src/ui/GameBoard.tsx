import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BattleCard, Rarity, Element } from '../types/game';
import { useGameStore } from '../store/gameStore';
import { BattleManager } from '../game/manager/BattleManager';
import { getCardStats } from '../data/cards';

const rarityColors: Record<Rarity, { border: string; glow: string }> = {
  gold: { border: '#FFD700', glow: 'rgba(255, 215, 0, 0.8)' },
  purple: { border: '#9C27B0', glow: 'rgba(156, 39, 176, 0.8)' },
  blue: { border: '#2196F3', glow: 'rgba(33, 150, 243, 0.8)' },
  green: { border: '#4CAF50', glow: 'rgba(76, 175, 80, 0.8)' },
};

const elementColors: Record<Element, string> = {
  fire: '#FF4500',
  water: '#1E90FF',
  wind: '#32CD32',
  earth: '#8B4513',
};

interface Projectile {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  currentX: number;
  currentY: number;
  color: string;
  speed: number;
  done: boolean;
}

interface DamageNumber {
  id: number;
  x: number;
  y: number;
  value: number;
  startTime: number;
  isCritical: boolean;
}

interface FxCard {
  instanceId: string;
  flashUntil: number;
  shakeUntil: number;
}

let projectileIdCounter = 0;
let damageIdCounter = 0;

export const GameBoard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const battleManagerRef = useRef<BattleManager | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [fxCards, setFxCards] = useState<Map<string, FxCard>>(new Map());
  const lastLogLenRef = useRef(0);

  const {
    teamSlots,
    playerTeam,
    enemyTeam,
    battleLog,
    currentRound,
    isInBattle,
    showResultModal,
    battleResult,
    stats,
    setCurrentView,
    startBattle,
    updateBattleState,
    endBattle,
    retreat,
    resetBattle,
    goToCollection,
    ownedCards,
  } = useGameStore();

  useEffect(() => {
    if (!battleManagerRef.current) {
      battleManagerRef.current = new BattleManager();
    }
    return () => {
      battleManagerRef.current?.destroy();
      battleManagerRef.current = null;
    };
  }, []);

  const startBattleFn = useCallback(() => {
    if (!battleManagerRef.current) return;
    const validCards = teamSlots.filter((c): c is NonNullable<typeof c> => c !== null);
    if (validCards.length === 0) return;

    const enemyPool = ownedCards.filter(
      (c) => !validCards.some((v) => v.id === c.id)
    );
    const shuffled = [...enemyPool].sort(() => Math.random() - 0.5);
    const enemyCount = Math.min(validCards.length, shuffled.length, 6);
    const enemyCards = shuffled.slice(0, Math.max(1, enemyCount));

    battleManagerRef.current.initBattle(
      teamSlots,
      enemyCards,
      (data) => {
        updateBattleState(
          data.playerTeam,
          data.enemyTeam,
          data.logs,
          data.stats,
          data.round
        );
      },
      (result, battleStats) => {
        endBattle(result, battleStats);
      }
    );

    setTimeout(() => {
      setHasStarted(true);
      battleManagerRef.current?.startBattle();
    }, 300);
  }, [teamSlots, ownedCards, startBattle, updateBattleState, endBattle]);

  useEffect(() => {
    if (battleLog.length > lastLogLenRef.current && battleLog.length > 0) {
      const newLogs = battleLog.slice(lastLogLenRef.current);
      lastLogLenRef.current = battleLog.length;

      newLogs.forEach((log) => {
        if (log.type === 'attack' || log.type === 'skill' || log.type === 'critical') {
          triggerAttackFx(log.attacker, log.target, log.type === 'critical');
        }
      });
    }
  }, [battleLog, playerTeam, enemyTeam]);

  const triggerAttackFx = (attackerName?: string, targetName?: string, isCrit?: boolean) => {
    if (!attackerName || !targetName) return;
    const attacker =
      [...playerTeam, ...enemyTeam].find((c) => c.name === attackerName);
    const target =
      [...playerTeam, ...enemyTeam].find((c) => c.name === targetName);
    if (!attacker || !target || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const cardW = 90;
    const cardH = 120;
    const gap = 16;

    const getCardCenter = (card: BattleCard) => {
      const cols = 3;
      const teamWidth = cols * cardW + (cols - 1) * gap;
      const startX =
        card.side === 'player'
          ? rect.width * 0.25 - teamWidth / 2
          : rect.width * 0.75 - teamWidth / 2;
      const rows = 3;
      const teamHeight = rows * cardH + (rows - 1) * gap;
      const startY = rect.height / 2 - teamHeight / 2;
      const x = startX + card.position.col * (cardW + gap) + cardW / 2;
      const y = startY + card.position.row * (cardH + gap) + cardH / 2;
      return { x, y };
    };

    const from = getCardCenter(attacker);
    const to = getCardCenter(target);

    setFxCards((prev) => {
      const next = new Map(prev);
      next.set(attacker.instanceId, {
        instanceId: attacker.instanceId,
        flashUntil: Date.now() + 200,
        shakeUntil: 0,
      });
      next.set(target.instanceId, {
        instanceId: target.instanceId,
        flashUntil: 0,
        shakeUntil: Date.now() + 150,
      });
      return next;
    });

    const projectile: Projectile = {
      id: ++projectileIdCounter,
      fromX: from.x,
      fromY: from.y,
      toX: to.x,
      toY: to.y,
      currentX: from.x,
      currentY: from.y,
      color: elementColors[attacker.element],
      speed: 500,
      done: false,
    };
    setProjectiles((prev) => [...prev, projectile]);

    setTimeout(() => {
      setDamageNumbers((prev) => [
        ...prev,
        {
          id: ++damageIdCounter,
          x: to.x,
          y: to.y - 40,
          value: 0,
          startTime: Date.now(),
          isCritical: !!isCrit,
        },
      ]);
    }, 300);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const resize = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        canvas.width = r.width;
        canvas.height = r.height;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cardW = 90;
      const cardH = 120;
      const gap = 16;

      const drawTeam = (team: BattleCard[]) => {
        const cols = 3;
        const side = team[0]?.side || 'player';
        const teamWidth = cols * cardW + (cols - 1) * gap;
        const startX =
          side === 'player'
            ? canvas.width * 0.25 - teamWidth / 2
            : canvas.width * 0.75 - teamWidth / 2;
        const rows = 3;
        const teamHeight = rows * cardH + (rows - 1) * gap;
        const startY = canvas.height / 2 - teamHeight / 2;

        team.forEach((card) => {
          const x = startX + card.position.col * (cardW + gap);
          const y = startY + card.position.row * (cardH + gap);
          const rarity = rarityColors[card.rarity];
          const fx = fxCards.get(card.instanceId);
          const now = Date.now();

          let drawX = x;
          let drawY = y;
          if (fx && fx.shakeUntil > now) {
            drawX += (Math.random() - 0.5) * 6;
            drawY += (Math.random() - 0.5) * 6;
          }

          const isFlashing = fx && fx.flashUntil > now;

          ctx.save();
          ctx.shadowColor = rarity.glow;
          ctx.shadowBlur = isFlashing ? 25 : 8;
          ctx.fillStyle = isFlashing ? 'rgba(255,255,255,0.3)' : 'rgba(11,12,16,0.9)';
          ctx.strokeStyle = rarity.border;
          ctx.lineWidth = 2;
          roundRect(ctx, drawX, drawY, cardW, cardH, 8);
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          if (!card.isAlive) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            roundRect(ctx, drawX, drawY, cardW, cardH, 8);
            ctx.fill();
          }

          ctx.fillStyle = '#fff';
          ctx.font = '28px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(card.avatar, drawX + cardW / 2, drawY + cardH / 2 - 10);

          ctx.font = 'bold 12px sans-serif';
          ctx.fillStyle = '#fff';
          ctx.fillText(card.name, drawX + cardW / 2, drawY + cardH - 25);

          const hpRatio = Math.max(0, card.currentHp / card.maxHp);
          const hpW = cardW - 12;
          const hpX = drawX + 6;
          const hpY = drawY + cardH - 14;
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(hpX, hpY, hpW, 6);
          ctx.fillStyle = hpRatio > 0.5 ? '#4CAF50' : hpRatio > 0.25 ? '#FF9800' : '#F44336';
          ctx.fillRect(hpX, hpY, hpW * hpRatio, 6);

          ctx.font = '10px sans-serif';
          ctx.fillStyle = '#66FCF1';
          ctx.textAlign = 'left';
          ctx.fillText(`${card.currentHp}/${card.maxHp}`, hpX, hpY - 2);

          ctx.textAlign = 'right';
          ctx.fillStyle = '#FFD700';
          ctx.fillText(`E:${card.currentEnergy}`, drawX + cardW - 6, hpY - 2);

          ctx.fillStyle = rarity.border;
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`Lv.${card.level}`, drawX + 4, drawY + 12);

          const activeSkill = card.skills.find((s) => s.type === 'active');
          if (activeSkill) {
            const cd = card.cooldowns[activeSkill.name] || 0;
            if (cd > 0) {
              ctx.fillStyle = 'rgba(0,0,0,0.7)';
              ctx.fillRect(drawX, drawY, cardW, cardH);
              ctx.fillStyle = 'rgba(255,255,255,0.85)';
              ctx.font = 'bold 12px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(`${cd}`, drawX + cardW / 2, drawY + cardH / 2);
            }
          }
        });
      };

      if (playerTeam.length > 0) drawTeam(playerTeam);
      if (enemyTeam.length > 0) drawTeam(enemyTeam);

      ctx.strokeStyle = 'rgba(102, 252, 241, 0.2)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 40);
      ctx.lineTo(canvas.width / 2, canvas.height - 40);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(102, 252, 241, 0.6)';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('我方队伍', canvas.width * 0.25, 30);
      ctx.fillText('敌方队伍', canvas.width * 0.75, 30);

      setProjectiles((prev) => {
        const updated: Projectile[] = [];
        prev.forEach((p) => {
          if (p.done) return;
          const dx = p.toX - p.currentX;
          const dy = p.toY - p.currentY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 5) {
            p.done = true;
            return;
          }
          const vx = (dx / dist) * p.speed * 0.016;
          const vy = (dy / dist) * p.speed * 0.016;
          p.currentX += vx;
          p.currentY += vy;
          updated.push(p);

          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(p.currentX, p.currentY, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        });
        return updated;
      });

      setDamageNumbers((prev) => {
        const now = Date.now();
        return prev.filter((d) => {
          const elapsed = now - d.startTime;
          if (elapsed > 1000) return false;
          const progress = elapsed / 1000;
          const alpha = 1 - progress;
          const offsetY = progress * 50;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = d.isCritical ? '#FFD700' : '#FF0000';
          ctx.font = d.isCritical ? 'bold 24px sans-serif' : 'bold 18px sans-serif';
          ctx.textAlign = 'center';
          ctx.shadowColor = '#000';
          ctx.shadowBlur = 4;
          ctx.fillText(d.isCritical ? '暴击!' : '💥', d.x, d.y - offsetY);
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
          return true;
        });
      });

      setFxCards((prev) => {
        const now = Date.now();
        const next = new Map<string, FxCard>();
        prev.forEach((v) => {
          if (v.flashUntil > now || v.shakeUntil > now) {
            next.set(v.instanceId, v);
          }
        });
        return next;
      });

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [playerTeam, enemyTeam, fxCards]);

  const logEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [battleLog]);

  const handleReset = () => {
    resetBattle();
    setHasStarted(false);
    lastLogLenRef.current = 0;
    setProjectiles([]);
    setDamageNumbers([]);
    setFxCards(new Map());
  };

  const handleReplay = () => {
    handleReset();
    setTimeout(startBattleFn, 200);
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          right: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <div
          style={{
            padding: '8px 16px',
            background: 'rgba(11, 12, 16, 0.8)',
            borderRadius: 12,
            border: '1px solid rgba(102, 252, 241, 0.3)',
            color: '#66FCF1',
            fontWeight: 'bold',
          }}
        >
          ⚔️ 回合 {currentRound || '-'}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
            pointerEvents: 'auto',
          }}
        >
          {!hasStarted && (
            <button
              onClick={startBattleFn}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #66FCF1, #45A29E)',
                color: '#0B0C10',
                fontWeight: 'bold',
              }}
            >
              ▶️ 开始战斗
            </button>
          )}
          <button
            onClick={retreat}
            disabled={!isInBattle}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              background: 'rgba(255, 107, 107, 0.2)',
              border: '1px solid rgba(255, 107, 107, 0.5)',
              color: '#FF6B6B',
              fontWeight: 'bold',
            }}
          >
            🏳️ 撤退
          </button>
          <button
            onClick={() => setCurrentView('collection')}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(102, 252, 241, 0.3)',
              color: '#66FCF1',
              fontWeight: 'bold',
            }}
          >
            📚 返回卡牌
          </button>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          width: 400,
          height: 200,
          background: 'rgba(11, 12, 16, 0.9)',
          borderRadius: 12,
          border: '1px solid rgba(102, 252, 241, 0.3)',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 'bold',
            color: '#66FCF1',
            marginBottom: 8,
          }}
        >
          📜 战斗日志
        </div>
        <div
          className="custom-scrollbar"
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {battleLog.map((log) => (
            <div
              key={log.id}
              className="log-fade-in"
              style={{
                fontSize: 12,
                padding: '4px 8px',
                borderRadius: 4,
                background:
                  log.type === 'critical'
                    ? 'rgba(255, 215, 0, 0.15)'
                    : log.type === 'skill'
                    ? 'rgba(156, 39, 176, 0.15)'
                    : log.type === 'death'
                    ? 'rgba(255, 71, 87, 0.15)'
                    : log.type === 'info'
                    ? 'rgba(102, 252, 241, 0.1)'
                    : 'rgba(255, 255, 255, 0.03)',
                color:
                  log.type === 'critical'
                    ? '#FFD700'
                    : log.type === 'skill'
                    ? '#CE93D8'
                    : log.type === 'death'
                    ? '#FF6B6B'
                    : log.type === 'info'
                    ? '#66FCF1'
                    : 'rgba(255,255,255,0.85)',
                lineHeight: 1.4,
              }}
            >
              {log.message}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

      {showResultModal && (
        <ResultModal
          result={battleResult}
          stats={stats}
          onReplay={handleReplay}
          onBack={goToCollection}
        />
      )}
    </div>
  );
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

const ResultModal: React.FC<{
  result: 'win' | 'lose' | null;
  stats: { totalDamage: number; maxSingleDamage: number; critCount: number; totalRounds: number };
  onReplay: () => void;
  onBack: () => void;
}> = ({ result, stats, onReplay, onBack }) => {
  const isWin = result === 'win';
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        className="modal-bounce-in"
        style={{
          padding: 40,
          borderRadius: 24,
          background: isWin
            ? 'linear-gradient(135deg, #FFD700 0%, #FF6B00 100%)'
            : 'linear-gradient(135deg, #303030 0%, #1A1A1A 100%)',
          boxShadow: isWin
            ? '0 0 60px rgba(255, 215, 0, 0.5)'
            : '0 0 30px rgba(0, 0, 0, 0.8)',
          minWidth: 400,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 48,
            marginBottom: 12,
          }}
        >
          {isWin ? '🎉' : '💀'}
        </div>
        <h1
          style={{
            fontSize: 36,
            color: isWin ? '#0B0C10' : '#fff',
            fontWeight: 'bold',
            marginBottom: 24,
          }}
        >
          {isWin ? '胜利！' : '失败...'}
        </h1>
        <div
          style={{
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}
        >
          <StatItem label="总回合数" value={stats.totalRounds || 0} dark={!isWin} />
          <StatItem label="总伤害" value={stats.totalDamage} dark={!isWin} />
          <StatItem label="最高单次伤害" value={stats.maxSingleDamage} dark={!isWin} />
          <StatItem label="暴击次数" value={stats.critCount} dark={!isWin} />
        </div>
        {isWin && (
          <div
            style={{
              fontSize: 18,
              color: '#0B0C10',
              fontWeight: 'bold',
              marginBottom: 20,
            }}
          >
            💰 获得 100 金币
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={onReplay}
            style={{
              padding: '12px 28px',
              borderRadius: 12,
              background: isWin ? '#0B0C10' : 'rgba(102,252,241,0.2)',
              color: isWin ? '#FFD700' : '#66FCF1',
              border: isWin ? 'none' : '1px solid rgba(102,252,241,0.5)',
              fontWeight: 'bold',
              fontSize: 15,
            }}
          >
            🔄 重新开始
          </button>
          <button
            onClick={onBack}
            style={{
              padding: '12px 28px',
              borderRadius: 12,
              background: isWin ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.1)',
              color: isWin ? '#0B0C10' : '#fff',
              border: `1px solid ${isWin ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)'}`,
              fontWeight: 'bold',
              fontSize: 15,
            }}
          >
            📚 返回卡牌
          </button>
        </div>
      </div>
    </div>
  );
};

const StatItem: React.FC<{ label: string; value: number; dark?: boolean }> = ({ label, value, dark }) => (
  <div style={{ textAlign: 'center' }}>
    <div
      style={{
        fontSize: 11,
        color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
        marginBottom: 4,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 24,
        fontWeight: 'bold',
        color: dark ? '#fff' : '#0B0C10',
      }}
    >
      {value}
    </div>
  </div>
);
