import React, { useState, useEffect, useRef, useCallback, useId } from 'react';
import type { Pet, ElementType, BattleLogEntry, FightAction, FightRoundResult } from '../types';
import { ELEMENT_COLORS, ELEMENT_NAMES, SKILL_COLORS } from '../types';
import { fightRound, generateEnemySkill, createBattleLogEntries, gainExp, generateEnemyTeam } from '../gameEngine';

interface BattleArenaProps {
  playerTeam: Pet[];
  onBattleEnd: (winner: 'player' | 'enemy', updatedPlayerTeam: Pet[]) => void;
  onFlee: () => void;
}

type Phase = 'countdown' | 'selectSkill' | 'animating' | 'ended' | 'result';

interface DamageNumber {
  id: string;
  side: 'player' | 'enemy';
  amount: number;
  isCritical: boolean;
  startX: number;
  startY: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  element: ElementType;
  angle?: number;
}

const BattleArena: React.FC<BattleArenaProps> = ({ playerTeam, onBattleEnd, onFlee }) => {
  const scopeId = useId().replace(/:/g, '');

  const [phase, setPhase] = useState<Phase>('countdown');
  const [countdown, setCountdown] = useState<number | string>(3);
  const [countdownFade, setCountdownFade] = useState(false);

  const [playerPets, setPlayerPets] = useState<Pet[]>(() => playerTeam.map(p => ({ ...p })));
  const [enemyPets, setEnemyPets] = useState<Pet[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [currentEnemyIdx, setCurrentEnemyIdx] = useState(0);
  const [turn, setTurn] = useState(1);
  const [log, setLog] = useState<BattleLogEntry[]>([]);
  const [winner, setWinner] = useState<'player' | 'enemy' | null>(null);
  const [expGained, setExpGained] = useState<Record<string, number>>({});
  const [cooldowns, setCooldowns] = useState<Record<number, number>>({});
  const [cooldownTimers, setCooldownTimers] = useState<Record<number, number>>({});

  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [redFlash, setRedFlash] = useState<{ player: boolean; enemy: boolean }>({ player: false, enemy: false });
  const [knockback, setKnockback] = useState<{ player: number; enemy: number }>({ player: 0, enemy: 0 });
  const [defeatedText, setDefeatedText] = useState<{ side: 'player' | 'enemy'; show: boolean } | null>(null);
  const [fadeDead, setFadeDead] = useState<{ player: boolean; enemy: boolean }>({ player: false, enemy: false });
  const [switchSlide, setSwitchSlide] = useState<{ player: boolean; enemy: boolean }>({ player: false, enemy: false });

  const [logDrawerOpen, setLogDrawerOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const arenaRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const dmgIdRef = useRef(0);

  useEffect(() => {
    setEnemyPets(generateEnemyTeam(playerTeam[0]?.level ?? 1));
  }, [playerTeam]);

  useEffect(() => {
    if (phase !== 'countdown') return;
    const runCountdown = async () => {
      for (const n of [3, 2, 1]) {
        setCountdownFade(false);
        setCountdown(n);
        await new Promise(r => setTimeout(r, 500));
        setCountdownFade(true);
        await new Promise(r => setTimeout(r, 500));
      }
      setCountdownFade(false);
      setCountdown('开战!');
      await new Promise(r => setTimeout(r, 800));
      setPhase('selectSkill');
      pushLog({ text: `第 1 回合开始`, type: 'info' });
    };
    runCountdown();
  }, [phase]);

  const pushLog = useCallback((entry: BattleLogEntry) => {
    setLog(prev => {
      const next = [...prev, entry];
      return next.length > 30 ? next.slice(next.length - 30) : next;
    });
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [log]);

  useEffect(() => {
    const keys = Object.keys(cooldownTimers).map(Number);
    if (keys.length === 0) return;
    const interval = setInterval(() => {
      setCooldownTimers(prev => {
        const next: Record<number, number> = {};
        for (const k of keys) {
          const v = prev[k];
          if (v !== undefined && v > 0.05) next[k] = Math.max(0, v - 0.05);
        }
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [cooldowns]);

  const currentPlayerPet = playerPets[currentPlayerIdx];
  const currentEnemyPet = enemyPets[currentEnemyIdx];

  const spawnParticles = useCallback((element: ElementType) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const count = 60 + Math.floor(Math.random() * 41);
    const newParticles: Particle[] = [];
    const colors = getElementColors(element);
    for (let i = 0; i < count; i++) {
      const base: Particle = {
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        life: 0.8,
        maxLife: 0.8,
        size: 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        element,
      };
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      switch (element) {
        case 'fire':
          base.vx = Math.cos(angle) * speed * 1.5;
          base.vy = -Math.abs(Math.sin(angle)) * (1 + Math.random() * 3) - 1;
          break;
        case 'water':
          base.vx = Math.cos(angle) * speed * 2;
          base.vy = Math.sin(angle) * speed * 1.5 + 0.5;
          break;
        case 'grass':
          base.angle = Math.random() * Math.PI * 2;
          base.vx = (Math.random() - 0.5) * 1.5;
          base.vy = -(1 + Math.random() * 2);
          break;
        case 'electric':
          base.vx = Math.cos(angle) * speed * 3;
          base.vy = Math.sin(angle) * speed * 3;
          break;
        case 'wind':
          base.angle = Math.random() * Math.PI * 2;
          base.vx = Math.cos(angle) * 0.5;
          base.vy = Math.sin(angle) * 0.5 - 0.3;
          break;
        case 'earth':
          base.vx = (Math.random() - 0.5) * speed * 2;
          base.vy = -(2 + Math.random() * 2);
          break;
      }
      newParticles.push(base);
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const arena = arenaRef.current;
      if (!arena) return;
      const rect = arena.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener('resize', resize);
    const ro = new ResizeObserver(resize);
    if (arenaRef.current) ro.observe(arenaRef.current);

    const loop = () => {
      const dt = 1 / 60;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const alive: Particle[] = [];
      for (const p of particlesRef.current) {
        p.life -= dt;
        if (p.life <= 0) continue;
        switch (p.element) {
          case 'water':
            p.vy += 0.1;
            break;
          case 'grass':
            if (p.angle !== undefined) {
              p.angle += 0.15;
              p.vx += Math.cos(p.angle) * 0.08;
            }
            break;
          case 'electric':
            p.vx += (Math.random() - 0.5) * 0.6;
            p.vy += (Math.random() - 0.5) * 0.6;
            break;
          case 'wind':
            if (p.angle !== undefined) {
              p.angle += 0.1;
              const r = 2;
              p.vx = Math.cos(p.angle) * r;
              p.vy = Math.sin(p.angle) * r - 0.5;
            }
            break;
          case 'earth':
            p.vy += 0.25;
            if (p.y > canvas.height - 10 && p.vy > 0) {
              p.vy = -p.vy * 0.4;
              p.vx *= 0.8;
              if (Math.abs(p.vy) < 0.5) p.life = 0;
            }
            break;
        }
        p.x += p.vx;
        p.y += p.vy;
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        alive.push(p);
      }
      ctx.globalAlpha = 1;
      particlesRef.current = alive;
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      ro.disconnect();
    };
  }, []);

  const triggerDamage = useCallback((side: 'player' | 'enemy', amount: number, isCritical: boolean) => {
    setRedFlash(prev => ({ ...prev, [side]: true }));
    setTimeout(() => setRedFlash(prev => ({ ...prev, [side]: false })), 300);
    const kbDir = side === 'player' ? -1 : 1;
    setKnockback(prev => ({ ...prev, [side]: kbDir * 10 }));
    setTimeout(() => setKnockback(prev => ({ ...prev, [side]: 0 })), 300);
    const id = `dmg-${++dmgIdRef.current}`;
    const arena = arenaRef.current;
    let sx = 0, sy = 0;
    if (arena) {
      const rect = arena.getBoundingClientRect();
      sx = side === 'player' ? rect.width * 0.22 : rect.width * 0.78;
      sy = rect.height * 0.45;
    }
    const dn: DamageNumber = { id, side, amount, isCritical, startX: sx, startY: sy };
    setDamageNumbers(prev => [...prev, dn]);
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(d => d.id !== id));
    }, 1200);
  }, []);

  const findNextPetIdx = (team: Pet[], currentIdx: number): number => {
    for (let i = 0; i < team.length; i++) {
      if (i !== currentIdx && team[i].currentHp > 0) return i;
    }
    return -1;
  };

  const executeAction = useCallback(async (action: FightAction): Promise<{ defenderDied: boolean }> => {
    const defenderSide: 'player' | 'enemy' = action.defender;
    const attackerSide: 'player' | 'enemy' = action.attacker;

    const attackerPet = attackerSide === 'player' ? currentPlayerPet : currentEnemyPet;
    spawnParticles(attackerPet.element);
    await new Promise(r => setTimeout(r, 300));

    triggerDamage(defenderSide, action.damage, action.isCritical);

    let defenderDied = false;
    if (defenderSide === 'player') {
      setPlayerPets(prev => {
        const next = [...prev];
        const updated = { ...next[currentPlayerIdx] };
        updated.currentHp = Math.max(0, updated.currentHp - action.damage);
        updated.rage = Math.min(100, updated.rage + action.defenderRageGain);
        if (updated.currentHp <= 0) {
          updated.rage = 0;
          defenderDied = true;
        }
        next[currentPlayerIdx] = updated;
        return next;
      });
      setEnemyPets(prev => {
        const next = [...prev];
        const updated = { ...next[currentEnemyIdx] };
        updated.rage = Math.min(100, updated.rage + action.attackerRageGain);
        next[currentEnemyIdx] = updated;
        return next;
      });
    } else {
      setEnemyPets(prev => {
        const next = [...prev];
        const updated = { ...next[currentEnemyIdx] };
        updated.currentHp = Math.max(0, updated.currentHp - action.damage);
        updated.rage = Math.min(100, updated.rage + action.defenderRageGain);
        if (updated.currentHp <= 0) {
          updated.rage = 0;
          defenderDied = true;
        }
        next[currentEnemyIdx] = updated;
        return next;
      });
      setPlayerPets(prev => {
        const next = [...prev];
        const updated = { ...next[currentPlayerIdx] };
        updated.rage = Math.min(100, updated.rage + action.attackerRageGain);
        next[currentPlayerIdx] = updated;
        return next;
      });
    }

    await new Promise(r => setTimeout(r, 700));
    return { defenderDied };
  }, [currentPlayerIdx, currentEnemyIdx, currentPlayerPet, currentEnemyPet, spawnParticles, triggerDamage]);

  const handlePetDeath = useCallback(async (side: 'player' | 'enemy'): Promise<{ battleEnded: boolean; newWinner: 'player' | 'enemy' | null }> => {
    setDefeatedText({ side, show: true });
    setFadeDead(prev => ({ ...prev, [side]: true }));
    await new Promise(r => setTimeout(r, 1000));
    setDefeatedText(null);

    const team = side === 'player' ? playerPets : enemyPets;
    const currentIdx = side === 'player' ? currentPlayerIdx : currentEnemyIdx;
    const nextIdx = findNextPetIdx(team, currentIdx);

    if (nextIdx === -1) {
      const battleEnded = true;
      const newWinner: 'player' | 'enemy' = side === 'player' ? 'enemy' : 'player';
      return { battleEnded, newWinner };
    }

    const newPetName = team[nextIdx].name;
    pushLog({ text: `替换为【${newPetName}】`, type: 'switch' });

    setSwitchSlide(prev => ({ ...prev, [side]: true }));
    if (side === 'player') {
      setPlayerPets(prev => {
        const next = [...prev];
        next[nextIdx] = { ...next[nextIdx], rage: 0 };
        return next;
      });
      setCurrentPlayerIdx(nextIdx);
    } else {
      setEnemyPets(prev => {
        const next = [...prev];
        next[nextIdx] = { ...next[nextIdx], rage: 0 };
        return next;
      });
      setCurrentEnemyIdx(nextIdx);
    }
    await new Promise(r => setTimeout(r, 500));
    setFadeDead(prev => ({ ...prev, [side]: false }));
    setSwitchSlide(prev => ({ ...prev, [side]: false }));
    return { battleEnded: false, newWinner: null };
  }, [playerPets, enemyPets, currentPlayerIdx, currentEnemyIdx, pushLog]);

  const handleSkillClick = useCallback(async (skillIndex: number) => {
    if (phase !== 'selectSkill') return;
    if (cooldowns[skillIndex]) return;
    if (!currentPlayerPet || !currentEnemyPet) return;

    setPhase('animating');
    setCooldowns(prev => ({ ...prev, [skillIndex]: 800 }));
    setCooldownTimers(prev => ({ ...prev, [skillIndex]: 0.8 }));
    const cdKey = skillIndex;
    setTimeout(() => {
      setCooldowns(prev => {
        const next = { ...prev };
        delete next[cdKey];
        return next;
      });
      setCooldownTimers(prev => {
        const next = { ...prev };
        delete next[cdKey];
        return next;
      });
    }, 800);

    const enemySkillIndex = generateEnemySkill(currentEnemyPet);
    const result: FightRoundResult = fightRound(currentPlayerPet, currentEnemyPet, skillIndex, enemySkillIndex);
    const logEntries = createBattleLogEntries(result);
    for (const entry of logEntries) pushLog(entry);

    for (let i = 0; i < result.actions.length; i++) {
      const action = result.actions[i];
      const { defenderDied } = await executeAction(action);

      if (defenderDied) {
        const { battleEnded, newWinner } = await handlePetDeath(action.defender);
        if (battleEnded) {
          setWinner(newWinner);
          setPhase('ended');
          await new Promise(r => setTimeout(r, 1500));
          if (newWinner === 'player') {
            const totalExp: Record<string, number> = {};
            const updatedTeam = playerPets.map(p => {
              if (p.currentHp <= 0) return p;
              let updated = p;
              let totalPetExp = 0;
              for (const ep of enemyPets) {
                totalPetExp += (ep.level * 10 + 50);
                updated = gainExp(updated, ep.level);
              }
              totalExp[updated.id] = totalPetExp;
              return updated;
            });
            setExpGained(totalExp);
            setPlayerPets(updatedTeam);
          }
          setPhase('result');
          return;
        }
        if (result.actions.length > 1 && i === 0) break;
      }
      if (i < result.actions.length - 1) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    setTurn(prev => prev + 1);
    setTimeout(() => {
      pushLog({ text: `第 ${turn + 1} 回合开始`, type: 'info' });
    }, 50);
    setPhase('selectSkill');
  }, [phase, cooldowns, currentPlayerPet, currentEnemyPet, executeAction, handlePetDeath, pushLog, turn, playerPets, enemyPets]);

  const handleReturn = useCallback(() => {
    onBattleEnd(winner ?? 'enemy', playerPets);
  }, [winner, playerPets, onBattleEnd]);

  const renderPetSvg = (element: ElementType, id: string) => {
    const color = ELEMENT_COLORS[element];
    const decorations: Record<ElementType, React.ReactNode> = {
      fire: (<><polygon points="30,55 40,25 50,55" fill={color} opacity="0.9" /><polygon points="50,55 58,30 66,55" fill={color} opacity="0.7" /><polygon points="15,58 22,35 29,58" fill={color} opacity="0.5" /></>),
      water: (<><path d="M25,45 Q45,35 65,45" fill="none" stroke="#ffffff60" strokeWidth="2" /><path d="M20,55 Q45,45 70,55" fill="none" stroke="#ffffff40" strokeWidth="2" /><path d="M25,65 Q45,55 65,65" fill="none" stroke="#ffffff30" strokeWidth="2" /></>),
      grass: (<><ellipse cx="45" cy="18" rx="8" ry="16" fill="#2d6a4f" opacity="0.8" /><ellipse cx="55" cy="22" rx="6" ry="13" fill="#40916c" opacity="0.7" /><ellipse cx="38" cy="24" rx="5" ry="11" fill="#52b788" opacity="0.6" /></>),
      electric: (<><polyline points="52,30 42,52 55,48 45,70" fill="none" stroke="#fff8" strokeWidth="3" strokeLinejoin="round" /></>),
      wind: (<><path d="M30,42 Q50,38 60,44 Q70,50 55,52" fill="none" stroke="#ffffff60" strokeWidth="2" /><path d="M25,55 Q45,50 65,56 Q72,60 60,62" fill="none" stroke="#ffffff40" strokeWidth="2" /><path d="M32,65 Q48,62 58,66" fill="none" stroke="#ffffff30" strokeWidth="2" /></>),
      earth: (<><line x1="30" y1="40" x2="50" y2="55" stroke="#00000040" strokeWidth="2" /><line x1="50" y1="55" x2="42" y2="70" stroke="#00000030" strokeWidth="2" /><line x1="50" y1="55" x2="65" y2="65" stroke="#00000030" strokeWidth="2" /></>),
    };
    return (
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'relative', zIndex: 1 }}>
        <defs>
          <radialGradient id={`grad-ba-${element}-${id}-${scopeId}`} cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.95" />
            <stop offset="100%" stopColor={color} stopOpacity="0.55" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="45" fill={`url(#grad-ba-${element}-${id}-${scopeId})`} stroke={color} strokeWidth="2" opacity="0.95" />
        {decorations[element]}
        <circle cx="50" cy="55" r="4" fill="#ffffff" />
        <circle cx="70" cy="55" r="4" fill="#ffffff" />
        <circle cx="51" cy="55" r="2" fill="#1a1a2e" />
        <circle cx="71" cy="55" r="2" fill="#1a1a2e" />
      </svg>
    );
  };

  const renderPetDisplay = (pet: Pet | undefined, side: 'player' | 'enemy') => {
    if (!pet) return null;
    const petDead = pet.currentHp <= 0;
    const color = ELEMENT_COLORS[pet.element];
    const hpPct = Math.max(0, (pet.currentHp / pet.maxHp) * 100);
    const ragePct = Math.min(100, pet.rage);
    const rageFull = ragePct >= 100;
    const kb = side === 'player' ? knockback.player : knockback.enemy;
    const rf = side === 'player' ? redFlash.player : redFlash.enemy;
    const fd = side === 'player' ? fadeDead.player : fadeDead.enemy;
    const ss = side === 'player' ? switchSlide.player : switchSlide.enemy;
    const slideFrom = side === 'player' ? -200 : 200;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: '12px', fontWeight: 700, color: '#ffd700', background: '#ffd70020', padding: '2px 10px', borderRadius: '8px', border: '1px solid #ffd70050' }}>
          LV.{pet.level}
        </div>
        <div style={{ fontSize: '16px', fontWeight: 800, color: '#e0e1dd', letterSpacing: '1px' }}>
          {pet.name}
        </div>
        <div style={{ fontSize: '11px', color, fontWeight: 700, marginBottom: '4px' }}>
          {ELEMENT_NAMES[pet.element]}
        </div>
        <div
          className={`${rf ? `rf-${scopeId}` : ''}`}
          style={{
            position: 'relative',
            width: '120px',
            height: '120px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `translateX(${ss ? slideFrom : kb}px)`,
            opacity: fd ? 0 : 1,
            transition: 'transform 0.3s ease-out, opacity 0.5s ease',
            filter: petDead ? 'grayscale(100%) brightness(0.4)' : 'none',
          }}
        >
          {rageFull && !petDead && (
            <div
              className={`rg-${scopeId}`}
              style={{
                position: 'absolute',
                inset: '-10px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #ffd70060 0%, transparent 70%)',
                zIndex: 0,
              }}
            />
          )}
          <div className={`breath-${scopeId}`} style={{ position: 'relative' }}>
            {renderPetSvg(pet.element, `${side}-${pet.id}`)}
          </div>
        </div>
        <div style={{ width: '160px' }}>
          <div style={{ position: 'relative', width: '160px', height: '12px', background: '#333', borderRadius: '6px', overflow: 'hidden', border: '1px solid #ffffff20' }}>
            <div style={{ width: `${hpPct}%`, height: '100%', background: '#e63946', borderRadius: '6px', transition: 'width 0.5s ease', boxShadow: `0 0 6px #e6394680` }} />
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#fff', textShadow: '0 0 2px #000' }}>
              HP: {pet.currentHp}/{pet.maxHp}
            </span>
          </div>
          <div style={{ height: '4px' }} />
          <div style={{ position: 'relative', width: '160px', height: '6px', background: '#333', borderRadius: '3px', overflow: 'hidden', border: '1px solid #ffffff20' }}>
            <div style={{
              width: `${ragePct}%`, height: '100%', borderRadius: '3px', transition: 'width 0.3s ease',
              background: rageFull ? '#ffd700' : '#c9a227',
              boxShadow: rageFull ? '0 0 8px #ffd700' : 'none',
            }} />
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff', textShadow: '0 0 2px #000' }}>
              怒气 {Math.floor(ragePct)}/100
            </span>
          </div>
        </div>
      </div>
    );
  };

  const logColors: Record<BattleLogEntry['type'], string> = {
    damage: '#ff9a9a', effect: '#a0d2ff', rage: '#ffd700', info: '#c0c0c0', death: '#e63946', switch: '#a8dadc',
  };

  const renderLog = () => (
    <div ref={logContainerRef} style={{
      background: '#0d1b2a', borderRadius: '12px', padding: '12px', overflowY: 'auto',
      maxHeight: '360px', display: 'flex', flexDirection: 'column', gap: '4px',
    }}>
      <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffd700', marginBottom: '6px', letterSpacing: '2px', borderBottom: '1px solid #ffffff20', paddingBottom: '6px' }}>
        战斗日志
      </div>
      {log.map((entry, i) => (
        <div key={i} style={{ fontSize: '11px', color: logColors[entry.type], lineHeight: '1.5' }}>{entry.text}</div>
      ))}
    </div>
  );

  const breathingClass = `breath-${scopeId}`;
  const redFlashClass = `rf-${scopeId}`;
  const rageGlowClass = `rg-${scopeId}`;

  return (
    <>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Nunito:wght@400;600;700;800&display=swap');
@keyframes breath-${scopeId} {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.03); filter: brightness(1.12); }
}
.${breathingClass} { animation: breath-${scopeId} 3s ease-in-out infinite; }
@keyframes rf-${scopeId} {
  0%, 100% { filter: none; }
  20%, 60% { filter: drop-shadow(0 0 10px red) brightness(1.4) saturate(2); }
  40%, 80% { filter: none; }
}
.${redFlashClass} { animation: rf-${scopeId} 0.3s ease-in-out; }
@keyframes rg-${scopeId} {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}
.${rageGlowClass} { animation: rg-${scopeId} 0.5s ease-in-out infinite; }
@keyframes fade-${scopeId} {
  0% { opacity: 0; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1); }
}
.cd-${scopeId} { animation: fade-${scopeId} 0.5s ease forwards; }
.cdf-${scopeId} { opacity: 0; transition: opacity 0.5s ease; }
@keyframes dmgFloat-${scopeId} {
  0% { transform: translate(-50%, 0); opacity: 1; }
  100% { transform: translate(-50%, -60px); opacity: 0; }
}
.dn-${scopeId} { animation: dmgFloat-${scopeId} 1.2s ease-out forwards; }
@keyframes defeatFlash-${scopeId} {
  0%, 100% { text-shadow: 0 0 20px #e63946; }
  50% { text-shadow: 0 0 40px #e63946, 0 0 60px #e63946; }
}
.dt-${scopeId} { animation: defeatFlash-${scopeId} 0.5s ease-in-out infinite; }
@keyframes resultIn-${scopeId} {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
.ro-${scopeId} { animation: resultIn-${scopeId} 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
@media (min-width: 1024px) {
  #ba-main-${scopeId} { display: grid; grid-template-columns: 1fr 200px; grid-template-rows: auto 1fr auto; gap: 12px; }
  #ba-topbar-${scopeId} { grid-column: 1 / 3; }
  #ba-arena-${scopeId} { grid-column: 1; }
  #ba-skills-${scopeId} { grid-column: 1; }
  #ba-log-${scopeId} { grid-column: 2; grid-row: 2 / 4; }
  #ba-logbtn-${scopeId} { display: none !important; }
  #ba-drawer-${scopeId} { display: none !important; }
}
@media (min-width: 768px) and (max-width: 1023px) {
  #ba-main-${scopeId} { display: flex; flex-direction: column; gap: 12px; }
  #ba-mid-${scopeId} { display: grid; grid-template-columns: 1fr 200px; gap: 12px; }
  #ba-logbtn-${scopeId} { display: none !important; }
  #ba-drawer-${scopeId} { display: none !important; }
}
@media (max-width: 767px) {
  #ba-main-${scopeId} { display: flex; flex-direction: column; gap: 12px; }
  #ba-log-${scopeId} { display: none !important; }
}
`}</style>

      <div id={`ba-main-${scopeId}`} style={{
        minHeight: '100vh',
        background: `radial-gradient(circle at 20% 10%, #16213e40 0%, transparent 50%), radial-gradient(circle at 80% 90%, #0f346040 0%, transparent 50%), linear-gradient(135deg, #0d1117 0%, #1a1a2e 50%, #16213e 100%)`,
        padding: '16px',
        fontFamily: 'Nunito, sans-serif',
        color: '#e0e1dd',
        boxSizing: 'border-box',
      }}>
        <div id={`ba-topbar-${scopeId}`} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 16px', background: '#0d1b2a80', borderRadius: '12px',
          border: '1px solid #ffffff20', backdropFilter: 'blur(4px)',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '2px' }}>
            <span style={{ color: '#a0a0b0' }}>回合</span>
            <span style={{ color: '#ffd700', marginLeft: '8px' }}>{turn}</span>
          </div>
          <button
            onClick={onFlee}
            style={{
              background: 'linear-gradient(135deg, #e6394630, #0d1117)',
              color: '#ff6b6b',
              border: '1px solid #e6394660',
              borderRadius: '8px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Nunito, sans-serif',
              letterSpacing: '2px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 12px #e6394640'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            逃跑
          </button>
        </div>

        <div id={`ba-mid-${scopeId}`}>
          <div id={`ba-arena-${scopeId}`} ref={arenaRef} style={{
            position: 'relative',
            minHeight: '380px',
            background: `linear-gradient(180deg, #0f346030 0%, #16213e30 100%)`,
            borderRadius: '16px',
            border: '1px solid #ffffff15',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 40px',
          }}>
            <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3 }} />

            {phase === 'countdown' && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 20, background: '#00000080', backdropFilter: 'blur(2px)',
              }}>
                <div
                  className={countdownFade ? `cdf-${scopeId}` : `cd-${scopeId}`}
                  style={{
                    fontFamily: 'Cinzel, serif',
                    fontWeight: 900,
                    fontSize: typeof countdown === 'number' ? '120px' : '80px',
                    color: typeof countdown === 'number' ? '#e0e1dd' : '#ffd700',
                    textShadow: '0 0 40px #ffd70060',
                    letterSpacing: '8px',
                  }}
                >
                  {countdown}
                </div>
              </div>
            )}

            {defeatedText && (
              <div style={{
                position: 'absolute',
                top: '35%',
                [defeatedText.side]: '15%',
                zIndex: 15,
              } as React.CSSProperties}>
                <div className={`dt-${scopeId}`} style={{
                  fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: '32px',
                  color: '#e63946', letterSpacing: '4px',
                }}>
                  战败!
                </div>
              </div>
            )}

            {damageNumbers.map(d => (
              <div
                key={d.id}
                className={`dn-${scopeId}`}
                style={{
                  position: 'absolute',
                  left: d.startX,
                  top: d.startY,
                  zIndex: 10,
                  pointerEvents: 'none',
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 900,
                  fontSize: '24px',
                  color: d.isCritical ? '#ff3333' : '#ffffff',
                  textShadow: d.isCritical ? '0 0 12px #ff0000, 2px 2px 4px #000' : '2px 2px 4px #000',
                  whiteSpace: 'nowrap',
                }}
              >
                {d.isCritical && <span style={{ fontSize: '18px', marginRight: '4px' }}>暴击!</span>}
                {d.amount}
              </div>
            ))}

            <div style={{ width: '45%', display: 'flex', justifyContent: 'center', zIndex: 2 }}>
              {renderPetDisplay(currentPlayerPet, 'player')}
            </div>

            <div style={{ width: '10%', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2 }}>
              <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: '40px', color: '#e63946', textShadow: '0 0 20px #e6394660', letterSpacing: '4px' }}>
                VS
              </div>
            </div>

            <div style={{ width: '45%', display: 'flex', justifyContent: 'center', zIndex: 2 }}>
              {renderPetDisplay(currentEnemyPet, 'enemy')}
            </div>

            {phase === 'result' && (
              <div className={`ro-${scopeId}`} style={{
                position: 'absolute', left: '50%', top: '50%',
                background: 'linear-gradient(135deg, #0d1117, #1a1a2e)',
                border: `2px solid ${winner === 'player' ? '#ffd70060' : '#e6394660'}`,
                borderRadius: '20px', padding: '32px 48px',
                minWidth: '320px', maxWidth: '90%',
                zIndex: 30,
                boxShadow: winner === 'player' ? '0 0 40px #ffd70040' : '0 0 40px #e6394640',
              }}>
                <div style={{
                  fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: '48px',
                  color: winner === 'player' ? '#ffd700' : '#e63946',
                  textAlign: 'center', letterSpacing: '6px',
                  marginBottom: '20px',
                  textShadow: `0 0 30px ${winner === 'player' ? '#ffd70060' : '#e6394660'}`,
                }}>
                  {winner === 'player' ? '胜利!' : '失败...'}
                </div>
                {winner === 'player' && (
                  <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {playerPets.filter(p => p.currentHp > 0).map(p => (
                      <div key={p.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 12px', background: `${ELEMENT_COLORS[p.element]}15`,
                        borderRadius: '8px', border: `1px solid ${ELEMENT_COLORS[p.element]}40`,
                      }}>
                        <span style={{ fontWeight: 700 }}>{p.name} LV.{p.level}</span>
                        <span style={{ color: '#a8dadc', fontWeight: 700, fontSize: '13px' }}>
                          获得经验 +{expGained[p.id] ?? 0}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={handleReturn}
                  style={{
                    width: '100%',
                    background: winner === 'player'
                      ? 'linear-gradient(135deg, #ffd70030, #0f3460, #ffd70030)'
                      : 'linear-gradient(135deg, #e6394630, #0f3460, #e6394630)',
                    color: winner === 'player' ? '#ffd700' : '#ff6b6b',
                    border: `2px solid ${winner === 'player' ? '#ffd70060' : '#e6394660'}`,
                    borderRadius: '12px',
                    padding: '12px 32px',
                    fontSize: '16px',
                    fontWeight: 800,
                    fontFamily: 'Nunito, sans-serif',
                    cursor: 'pointer',
                    letterSpacing: '3px',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = winner === 'player'
                      ? '0 8px 24px #ffd70040'
                      : '0 8px 24px #e6394640';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  返回管理
                </button>
              </div>
            )}
          </div>

          <div id={`ba-log-${scopeId}`}>
            {renderLog()}
          </div>
        </div>

        <div id={`ba-skills-${scopeId}`} style={{
          display: 'flex', justifyContent: 'center', gap: '16px',
          padding: '16px', background: '#0d1b2a80', borderRadius: '12px',
          border: '1px solid #ffffff15', flexWrap: 'wrap',
        }}>
          {currentPlayerPet?.skills.map((skill, idx) => {
            const bgColor = SKILL_COLORS[idx] ?? SKILL_COLORS[0];
            const onCd = !!cooldowns[idx];
            const cdTimer = cooldownTimers[idx];
            const disabled = phase !== 'selectSkill' || currentPlayerPet.currentHp <= 0 || onCd;
            return (
              <button
                key={idx}
                onClick={() => handleSkillClick(idx)}
                disabled={disabled}
                style={{
                  width: '80px', height: '80px', borderRadius: '12px',
                  background: `linear-gradient(135deg, ${bgColor}, ${bgColor}cc)`,
                  border: `2px solid ${bgColor}`,
                  color: '#ffffff',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: '4px', cursor: disabled ? 'not-allowed' : 'pointer',
                  fontFamily: 'Nunito, sans-serif',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  filter: onCd ? 'grayscale(100%)' : 'none',
                  opacity: disabled ? 0.5 : 1,
                  boxShadow: !disabled ? `0 0 0 ${bgColor}00` : undefined,
                }}
                onMouseEnter={e => {
                  if (!disabled) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = `0 0 16px ${bgColor}80`;
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 800, lineHeight: '1.2', textAlign: 'center', padding: '0 4px' }}>{skill.name}</span>
                <span style={{ fontSize: '13px', fontWeight: 900, opacity: '0.95' }}>×{skill.coefficient.toFixed(1)}</span>
                {onCd && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: '#00000080',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 800, color: '#fff',
                    backdropFilter: 'blur(1px)',
                  }}>
                    冷却中 {cdTimer?.toFixed(1) ?? '0.0'}s
                  </div>
                )}
              </button>
            );
          })}
          {!currentPlayerPet?.skills.length && (
            <div style={{ color: '#a0a0b0', fontSize: '14px' }}>无可用技能</div>
          )}
        </div>

        <button
          id={`ba-logbtn-${scopeId}`}
          onClick={() => setLogDrawerOpen(v => !v)}
          style={{
            position: 'fixed', right: '16px', bottom: '16px', zIndex: 50,
            width: '48px', height: '48px', borderRadius: '50%',
            background: '#0d1b2a', border: '2px solid #ffd70060',
            color: '#ffd700', fontSize: '16px', fontWeight: 800,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px #00000060',
          }}
        >
          📜
        </button>

        <div
          id={`ba-drawer-${scopeId}`}
          style={{
            position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 49,
            height: logDrawerOpen ? '150px' : '0px',
            background: '#0d1b2a',
            borderTop: logDrawerOpen ? '1px solid #ffffff20' : 'none',
            overflow: 'hidden',
            transition: 'height 0.3s ease',
            padding: logDrawerOpen ? '8px 12px' : '0',
            boxSizing: 'border-box',
          }}
        >
          {renderLog()}
        </div>
      </div>
    </>
  );
};

function getElementColors(element: ElementType): string[] {
  const palettes: Record<ElementType, string[]> = {
    fire: ['#ff6b35', '#ff9f1c', '#ffd60a', '#e63946'],
    water: ['#48cae4', '#00b4d8', '#0077b6', '#90e0ef'],
    grass: ['#52b788', '#40916c', '#2d6a4f', '#95d5b2'],
    electric: ['#ffd60a', '#fff3b0', '#ffffff', '#ffb703'],
    wind: ['#a8dadc', '#caf0f8', '#90e0ef', '#ade8f4'],
    earth: ['#bc6c25', '#dda15e', '#a47148', '#c19a6b'],
  };
  return palettes[element];
}

export default BattleArena;
