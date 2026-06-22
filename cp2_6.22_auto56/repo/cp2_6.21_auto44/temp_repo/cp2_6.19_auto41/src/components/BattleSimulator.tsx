import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { simulateBattle, SKILL_LIST, BattleRound } from '../utils/battleEngine';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: [number, number, number];
}

const SKILL_LABEL: Record<string, string> = SKILL_LIST.reduce(
  (acc, s) => ({ ...acc, [s.value]: s.label }),
  {} as Record<string, string>,
);

export default function BattleSimulator() {
  const redCard = useGameStore((s) => s.redCard);
  const blueCard = useGameStore((s) => s.blueCard);
  const battleLogs = useGameStore((s) => s.battleLogs);
  const isBattling = useGameStore((s) => s.isBattling);
  const winner = useGameStore((s) => s.winner);
  const startBattle = useGameStore((s) => s.startBattle);
  const resetBattle = useGameStore((s) => s.resetBattle);
  const clearLogs = useGameStore((s) => s.clearLogs);
  const appendLog = useGameStore((s) => s.appendLog);
  const setCardHp = useGameStore((s) => s.setCardHp);
  const setIsBattling = useGameStore((s) => s.setIsBattling);
  const setWinner = useGameStore((s) => s.setWinner);
  const setCurrentRound = useGameStore((s) => s.setCurrentRound);

  const [attackerAnim, setAttackerAnim] = useState<'red' | 'blue' | null>(null);
  const [hitAnim, setHitAnim] = useState<'red' | 'blue' | null>(null);
  const [resetting, setResetting] = useState(false);
  const [displayRound, setDisplayRound] = useState(0);
  const [damageFloat, setDamageFloat] = useState<{
    side: 'red' | 'blue';
    amount: number;
    key: number;
  } | null>(null);

  const arenaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const battleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logListRef = useRef<HTMLDivElement>(null);

  const resizeCanvas = useCallback(() => {
    const arena = arenaRef.current;
    const canvas = canvasRef.current;
    if (!arena || !canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = arena.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  const drawParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);

    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.vx *= 0.99;
      p.life -= 1;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      const alpha = p.life / p.maxLife;
      const [r, g, b] = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.shadowColor = `rgba(${r},${g},${b},${alpha})`;
      ctx.shadowBlur = 8 * alpha;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    rafRef.current = requestAnimationFrame(drawParticles);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(drawParticles);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [drawParticles]);

  const spawnExplosion = useCallback((side: 'red' | 'blue') => {
    const arena = arenaRef.current;
    if (!arena) return;
    const rect = arena.getBoundingClientRect();
    const cx = side === 'red' ? rect.width * 0.75 : rect.width * 0.25;
    const cy = rect.height * 0.5;
    const count = 50 + Math.floor(Math.random() * 31);
    const baseColor: [number, number, number] =
      side === 'red' ? [255, 71, 87] : [74, 158, 255];
    const altColor: [number, number, number] =
      side === 'red' ? [255, 160, 60] : [120, 200, 255];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      const useAlt = Math.random() < 0.4;
      particlesRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 30 + Math.random() * 40,
        maxLife: 60,
        size: 2 + Math.random() * 4,
        color: useAlt ? altColor : baseColor,
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (battleTimerRef.current) clearTimeout(battleTimerRef.current);
    };
  }, []);

  const runBattle = useCallback(async () => {
    startBattle();
    setDisplayRound(0);
    setWinner(null);
    await new Promise((r) => setTimeout(r, 50));
    const result = simulateBattle(
      { ...redCard, hp: redCard.maxHp },
      { ...blueCard, hp: blueCard.maxHp },
    );
    const rounds: BattleRound[] = result.rounds;
    let liveRed = redCard.maxHp;
    let liveBlue = blueCard.maxHp;

    let idx = 0;
    const step = () => {
      if (idx >= rounds.length) {
        setIsBattling(false);
        setWinner(result.winner);
        setAttackerAnim(null);
        setHitAnim(null);
        setCurrentRound(rounds.length);
        battleTimerRef.current = null;
        return;
      }
      const round = rounds[idx];
      appendLog(round);
      setDisplayRound(Math.ceil(round.round));
      setCurrentRound(Math.ceil(round.round));

      if (round.burnDamage === undefined) {
        const atk = round.attacker;
        const def: 'red' | 'blue' = atk === 'red' ? 'blue' : 'red';
        setAttackerAnim(atk);
        setHitAnim(null);
        setDamageFloat({ side: def, amount: round.damage, key: Date.now() + idx });

        if (atk === 'red') {
          liveRed = round.attackerHpAfter;
          liveBlue = round.defenderHpAfter;
          setCardHp('red', liveRed);
          setCardHp('blue', liveBlue);
        } else {
          liveBlue = round.attackerHpAfter;
          liveRed = round.defenderHpAfter;
          setCardHp('blue', liveBlue);
          setCardHp('red', liveRed);
        }

        battleTimerRef.current = setTimeout(() => {
          setHitAnim(def);
          spawnExplosion(def);
        }, 500);
      } else {
        const actualDef: 'red' | 'blue' =
          round.defenderHpBefore === liveRed ? 'red' : 'blue';
        setDamageFloat({ side: actualDef, amount: round.damage, key: Date.now() + idx });
        if (actualDef === 'red') {
          liveRed = round.defenderHpAfter;
          setCardHp('red', liveRed);
        } else {
          liveBlue = round.defenderHpAfter;
          setCardHp('blue', liveBlue);
        }
        setHitAnim(actualDef);
        spawnExplosion(actualDef);
        battleTimerRef.current = setTimeout(() => {
          setHitAnim(null);
        }, 500);
      }

      idx++;
      battleTimerRef.current = setTimeout(step, 800);
    };
    step();
  }, [
    redCard, blueCard, startBattle, appendLog, setCardHp, setIsBattling,
    setWinner, setCurrentRound, spawnExplosion,
  ]);

  const handleReset = () => {
    if (battleTimerRef.current) clearTimeout(battleTimerRef.current);
    setResetting(true);
    setAttackerAnim(null);
    setHitAnim(null);
    setDamageFloat(null);
    setDisplayRound(0);
    setTimeout(() => {
      resetBattle();
      setResetting(false);
    }, 800);
  };

  useEffect(() => {
    if (logListRef.current) {
      logListRef.current.scrollTop = logListRef.current.scrollHeight;
    }
  }, [battleLogs]);

  const redHpPct = useMemo(
    () => Math.max(0, Math.min(100, (redCard.hp / redCard.maxHp) * 100)),
    [redCard.hp, redCard.maxHp],
  );
  const blueHpPct = useMemo(
    () => Math.max(0, Math.min(100, (blueCard.hp / blueCard.maxHp) * 100)),
    [blueCard.hp, blueCard.maxHp],
  );

  const battlingOrDone = isBattling || winner;

  return (
    <div className="battle-sim-wrap">
      <div className="battle-controls">
        <button
          type="button"
          className="btn btn-primary"
          onClick={runBattle}
          disabled={isBattling}
        >
          {isBattling ? '对战进行中…' : winner ? '再来一局' : '⚔ 开始对战'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleReset}
          disabled={resetting}
        >
          ↻ 重置对战
        </button>
      </div>

      <div className="battle-arena glass-card" ref={arenaRef}>
        <canvas id="particle-canvas" ref={canvasRef} />
        {battlingOrDone && (
          <div className="round-indicator">回合 {displayRound}</div>
        )}

        <div
          className={[
            'arena-card',
            'glass-card',
            'side-red',
            attackerAnim === 'red' ? 'attack-red' : '',
            hitAnim === 'red' ? 'hit' : '',
            resetting ? 'resetting' : '',
            redCard.hp <= 0 ? 'dead' : '',
          ].filter(Boolean).join(' ')}
        >
          <div className="arena-card-name" style={{ color: 'var(--color-red)' }}>
            {redCard.name}
          </div>
          <div className="hp-bar-wrap">
            <div className={`hp-bar ${redHpPct < 30 ? 'low' : ''}`} style={{ width: `${redHpPct}%` }} />
          </div>
          <div className="hp-text">
            HP <span className="current">{redCard.hp}</span> / {redCard.maxHp}
          </div>
          <div className="arena-stat-row">
            <span>攻击: <span className="val-atk">{redCard.attack}</span></span>
          </div>
          <div className={`arena-skill skill-${redCard.skill}`}>
            {SKILL_LABEL[redCard.skill] ?? '无技能'}
          </div>
        </div>

        <div
          className={[
            'arena-card',
            'glass-card',
            'side-blue',
            attackerAnim === 'blue' ? 'attack-blue' : '',
            hitAnim === 'blue' ? 'hit' : '',
            resetting ? 'resetting' : '',
            blueCard.hp <= 0 ? 'dead' : '',
          ].filter(Boolean).join(' ')}
        >
          <div className="arena-card-name" style={{ color: 'var(--color-blue)' }}>
            {blueCard.name}
          </div>
          <div className="hp-bar-wrap">
            <div className={`hp-bar ${blueHpPct < 30 ? 'low' : ''}`} style={{ width: `${blueHpPct}%` }} />
          </div>
          <div className="hp-text">
            HP <span className="current">{blueCard.hp}</span> / {blueCard.maxHp}
          </div>
          <div className="arena-stat-row">
            <span>攻击: <span className="val-atk">{blueCard.attack}</span></span>
          </div>
          <div className={`arena-skill skill-${blueCard.skill}`}>
            {SKILL_LABEL[blueCard.skill] ?? '无技能'}
          </div>
        </div>

        {damageFloat && (
          <div
            key={damageFloat.key}
            className={`damage-float ${damageFloat.side}`}
          >
            -{damageFloat.amount}
          </div>
        )}

        {winner && (
          <div className={`winner-banner ${winner}`}>
            🏆 {winner === 'red' ? redCard.name : blueCard.name} 获胜！
          </div>
        )}
      </div>

      <div className="battle-log-wrap glass-card" style={{ padding: 12 }}>
        <div className="log-header">
          <span className="log-title">对战日志</span>
          <button type="button" className="log-clear-btn" onClick={clearLogs}>
            清除日志
          </button>
        </div>
        <div className="log-list" ref={logListRef}>
          {battleLogs.length === 0 ? (
            <div className="empty-log">暂无对战记录，点击"开始对战"开启模拟～</div>
          ) : (
            battleLogs.map((log) => (
              <div
                key={log.id}
                className={`log-item ${log.burnDamage !== undefined ? 'burn' : log.attacker}`}
              >
                <span className="log-round">
                  {Number.isInteger(log.round) ? `R${log.round}` : `R${Math.ceil(log.round)}·灼烧`}
                </span>
                <strong style={{ color: log.burnDamage !== undefined ? 'var(--color-burn)' : (log.attacker === 'red' ? 'var(--color-red)' : 'var(--color-blue)') }}>
                  {log.attackerName}
                </strong>
                {' → '}
                <span>{log.defenderName}</span>
                <span style={{ marginLeft: 8, color: 'var(--color-text-dim)' }}>
                  造成 <strong style={{ color: '#fb7185' }}>{log.damage}</strong> 伤害
                  &nbsp;·&nbsp; 剩余 HP: {log.defenderHpAfter}
                </span>
                {log.skillEffect && (
                  <span className="log-skill">{log.skillEffect}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
