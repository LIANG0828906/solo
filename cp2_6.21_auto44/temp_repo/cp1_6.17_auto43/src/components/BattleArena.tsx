import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGameStore, Card, BattleAction } from '../stores/gameStore';
import { runBattleTurn } from '../utils/battleEngine';
import { CardComponent } from './CardComponent';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

interface AnimatedCard {
  card: Card;
  side: 'player' | 'enemy';
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  scale: number;
  targetScale: number;
  opacity: number;
  hp: number;
}

interface AttackEffect {
  active: boolean;
  progress: number;
  attackerSide: 'player' | 'enemy';
  attackIndex: number;
  damage: number;
}

interface ShieldFlash {
  active: boolean;
  side: 'player' | 'enemy';
  progress: number;
}

const ARENA_WIDTH = 1200;
const ARENA_HEIGHT = 700;

export const BattleArena: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const battleState = useGameStore((s) => s.battle);
  const leftSlots = useGameStore((s) => s.leftSlots);
  const rightSlots = useGameStore((s) => s.rightSlots);
  const updateBattleState = useGameStore((s) => s.updateBattleState);
  const setShowResult = useGameStore((s) => s.setShowResult);
  const draggedCard = useGameStore((s) => s.draggedCard);
  const placeCardToSlot = useGameStore((s) => s.placeCardToSlot);
  const removeCardFromSlot = useGameStore((s) => s.removeCardFromSlot);
  const setDraggedCard = useGameStore((s) => s.setDraggedCard);

  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [animatedCards, setAnimatedCards] = useState<AnimatedCard[]>([]);
  const [attackEffect, setAttackEffect] = useState<AttackEffect>({
    active: false,
    progress: 0,
    attackerSide: 'player',
    attackIndex: 0,
    damage: 0,
  });
  const [shieldFlash, setShieldFlash] = useState<ShieldFlash>({
    active: false,
    side: 'player',
    progress: 0,
  });
  const [enteringIndex, setEnteringIndex] = useState(0);
  const [pendingActions, setPendingActions] = useState<BattleAction[]>([]);
  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const actionTimerRef = useRef<number>(0);

  const spawnParticle = useCallback((canvas: HTMLCanvasElement) => {
    const particle: Particle = {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 0.3 + Math.random() * 0.5,
      size: 1 + Math.random() * 3,
      alpha: 0,
      life: 0,
      maxLife: 120 + Math.random() * 180,
      color: `rgba(${138 + Math.random() * 60}, ${43 + Math.random() * 40}, ${226}, `,
    };
    particlesRef.current.push(particle);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      ctx.fillStyle = '#0B0C10';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2
      );
      gradient.addColorStop(0, 'rgba(106, 27, 154, 0.08)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (particlesRef.current.length < 150 && Math.random() < 0.5) {
        spawnParticle(canvas);
      }

      particlesRef.current = particlesRef.current.filter((p) => {
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;

        if (p.life < p.maxLife * 0.2) {
          p.alpha = p.life / (p.maxLife * 0.2);
        } else if (p.life > p.maxLife * 0.8) {
          p.alpha = (p.maxLife - p.life) / (p.maxLife * 0.2);
        } else {
          p.alpha = 0.6 + Math.sin(p.life * 0.05) * 0.2;
        }

        ctx.beginPath();
        ctx.fillStyle = p.color + p.alpha + ')';
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (p.size > 1.5) {
          ctx.beginPath();
          ctx.fillStyle = p.color + p.alpha * 0.3 + ')';
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        return p.life < p.maxLife && p.y < canvas.height + 10;
      });

      if (attackEffect.active) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const startX = attackEffect.attackerSide === 'player' ? centerX - 200 : centerX + 200;
        const endX = attackEffect.attackerSide === 'player' ? centerX + 200 : centerX - 200;
        const currentX = startX + (endX - startX) * attackEffect.progress;
        const currentY = centerY + Math.sin(attackEffect.progress * Math.PI) * -30;

        ctx.save();
        ctx.strokeStyle = attackEffect.attackerSide === 'player'
          ? `rgba(255, 100, 100, ${0.8 * (1 - attackEffect.progress)})`
          : `rgba(255, 150, 50, ${0.8 * (1 - attackEffect.progress)})`;
        ctx.lineWidth = 4;
        ctx.shadowColor = attackEffect.attackerSide === 'player' ? '#ff4444' : '#ff8800';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(startX, centerY);
        ctx.quadraticCurveTo((startX + endX) / 2, currentY - 50, currentX, currentY);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = attackEffect.attackerSide === 'player' ? '#ff6666' : '#ffaa44';
        ctx.arc(currentX, currentY, 8 + attackEffect.progress * 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (attackEffect.progress > 0.7) {
          const textAlpha = (attackEffect.progress - 0.7) / 0.3;
          ctx.save();
          ctx.font = 'bold 32px sans-serif';
          ctx.fillStyle = `rgba(255, 215, 0, ${textAlpha})`;
          ctx.textAlign = 'center';
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 10;
          const defenderX = attackEffect.attackerSide === 'player' ? centerX + 200 : centerX - 200;
          ctx.fillText(`-${attackEffect.damage}`, defenderX, centerY - 60 - textAlpha * 30);
          ctx.restore();
        }
      }

      if (shieldFlash.active) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const shieldX = shieldFlash.side === 'player' ? centerX - 200 : centerX + 200;
        const radius = 60 + shieldFlash.progress * 30;
        ctx.save();
        ctx.strokeStyle = `rgba(100, 200, 255, ${(1 - shieldFlash.progress) * 0.8})`;
        ctx.lineWidth = 4;
        ctx.shadowColor = '#64C8FF';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(shieldX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = `rgba(100, 200, 255, ${(1 - shieldFlash.progress) * 0.15})`;
        ctx.beginPath();
        ctx.arc(shieldX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [spawnParticle, attackEffect, shieldFlash]);

  useEffect(() => {
    if (battleState.phase !== 'entering') return;

    const allPlayerCards = battleState.playerCards;
    const allEnemyCards = battleState.enemyCards;
    const totalCards = allPlayerCards.length + allEnemyCards.length;

    if (enteringIndex < totalCards) {
      const timer = setTimeout(() => {
        const isPlayer = enteringIndex < allPlayerCards.length;
        const card = isPlayer
          ? allPlayerCards[enteringIndex]
          : allEnemyCards[enteringIndex - allPlayerCards.length];
        const side: 'player' | 'enemy' = isPlayer ? 'player' : 'enemy';
        const startX = isPlayer ? 150 : ARENA_WIDTH - 150;
        const startY = 100 + (isPlayer ? enteringIndex : enteringIndex - allPlayerCards.length) * 50;
        const targetX = isPlayer ? ARENA_WIDTH / 2 - 200 : ARENA_WIDTH / 2 + 200;
        const targetY = ARENA_HEIGHT / 2;

        setAnimatedCards((prev) => [
          ...prev,
          {
            card,
            side,
            x: startX,
            y: startY,
            targetX,
            targetY,
            scale: 0.5,
            targetScale: 1,
            opacity: 1,
            hp: card.hp,
          },
        ]);
        setEnteringIndex((i) => i + 1);
      }, 500 / (battleState.replaySpeed || 1));

      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        updateBattleState({ phase: 'fighting' });
      }, 600 / (battleState.replaySpeed || 1));
      return () => clearTimeout(timer);
    }
  }, [battleState.phase, enteringIndex, battleState.playerCards, battleState.enemyCards, battleState.replaySpeed, updateBattleState]);

  useEffect(() => {
    let rafId = 0;
    const animate = () => {
      setAnimatedCards((prev) =>
        prev.map((ac) => {
          const speed = 0.08 * (battleState.replaySpeed || 1);
          const newX = ac.x + (ac.targetX - ac.x) * speed;
          const newY = ac.y + (ac.targetY - ac.y) * speed;
          const newScale = ac.scale + (ac.targetScale - ac.scale) * speed;
          return { ...ac, x: newX, y: newY, scale: newScale };
        })
      );
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [battleState.replaySpeed]);

  useEffect(() => {
    if (battleState.phase !== 'fighting') return;

    if (pendingActions.length === 0 || currentActionIndex >= pendingActions.length) {
      const result = runBattleTurn(battleState);
      updateBattleState(result.newState);
      if (battleState.isReplaying && battleState.battleLog.length > 0) {
        setPendingActions(
          battleState.battleLog.filter((a) => a.turn === result.newState.currentTurn)
        );
      } else {
        setPendingActions(result.actions);
      }
      setCurrentActionIndex(0);
      actionTimerRef.current = 0;

      if (result.battleEnded) {
        setTimeout(() => {
          updateBattleState({ phase: 'finished', winner: result.winner });
          setShowResult(true);
        }, 1000);
      }
      return;
    }

    const action = pendingActions[currentActionIndex];
    if (!action) return;

    const actionDuration = 400 / (battleState.replaySpeed || 1);
    const startTime = performance.now();

    const animateAction = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / actionDuration, 1);

      setAttackEffect({
        active: progress < 1,
        progress,
        attackerSide: action.attacker,
        attackIndex: action.attackIndex,
        damage: action.damage,
      });

      if (progress > 0.4 && progress < 0.8) {
        setShieldFlash({
          active: true,
          side: action.attacker === 'player' ? 'enemy' : 'player',
          progress: (progress - 0.4) / 0.4,
        });
      } else if (progress >= 0.8) {
        setShieldFlash((prev) => ({ ...prev, active: false }));
      }

      if (progress < 1) {
        requestAnimationFrame(animateAction);
      } else {
        setAnimatedCards((prev) =>
          prev.map((ac) => {
            const isDefender =
              (action.attacker === 'player' && ac.side === 'enemy') ||
              (action.attacker === 'enemy' && ac.side === 'player');
            if (isDefender && ac.card.hp > action.defenderHpAfter) {
              return { ...ac, hp: action.defenderHpAfter, card: { ...ac.card, hp: action.defenderHpAfter } };
            }
            return ac;
          })
        );

        setTimeout(() => {
          setAttackEffect({ active: false, progress: 0, attackerSide: 'player', attackIndex: 0, damage: 0 });
          setCurrentActionIndex((i) => i + 1);
        }, 100 / (battleState.replaySpeed || 1));
      }
    };

    requestAnimationFrame(animateAction);
  }, [
    battleState.phase,
    battleState,
    pendingActions,
    currentActionIndex,
    updateBattleState,
    setShowResult,
  ]);

  useEffect(() => {
    if (battleState.phase === 'idle') {
      setAnimatedCards([]);
      setEnteringIndex(0);
      setPendingActions([]);
      setCurrentActionIndex(0);
    }
  }, [battleState.phase]);

  const handleSlotDrop = (slotIndex: number) => {
    if (draggedCard && battleState.phase === 'idle') {
      placeCardToSlot(draggedCard, slotIndex);
    }
  };

  const handleArenaMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggedCard) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const slotWidth = 140;
    const slotHeight = 190;
    const slotsStartX = 30;
    const slotsStartY = (ARENA_HEIGHT - slotHeight * 3 - 40) / 2;

    let foundSlot: number | null = null;
    for (let i = 0; i < 3; i++) {
      const slotX = slotsStartX;
      const slotY = slotsStartY + i * (slotHeight + 20);
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      if (
        mouseX >= slotX &&
        mouseX <= slotX + slotWidth &&
        mouseY >= slotY &&
        mouseY <= slotY + slotHeight
      ) {
        foundSlot = i;
        break;
      }
    }
    setHoveredSlot(foundSlot);
  };

  const handleArenaMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggedCard) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const slotWidth = 140;
    const slotHeight = 190;
    const slotsStartX = 30;
    const slotsStartY = (ARENA_HEIGHT - slotHeight * 3 - 40) / 2;

    for (let i = 0; i < 3; i++) {
      const slotX = slotsStartX;
      const slotY = slotsStartY + i * (slotHeight + 20);
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      if (
        mouseX >= slotX &&
        mouseX <= slotX + slotWidth &&
        mouseY >= slotY &&
        mouseY <= slotY + slotHeight &&
        !leftSlots[i].card
      ) {
        handleSlotDrop(i);
        return;
      }
    }
    setDraggedCard(null);
    setHoveredSlot(null);
  };

  const renderHexSlot = (index: number, side: 'left' | 'right') => {
    const slotWidth = 140;
    const slotHeight = 190;
    const isLeft = side === 'left';
    const slotsStartX = isLeft ? 30 : ARENA_WIDTH - slotWidth - 30;
    const slotsStartY = (ARENA_HEIGHT - slotHeight * 3 - 40) / 2;
    const slotY = slotsStartY + index * (slotHeight + 20);
    const slot = isLeft ? leftSlots[index] : rightSlots[index];
    const isHovered = isLeft && hoveredSlot === index && !slot?.card;
    const hasCard = !!slot?.card;

    const hexPath = (cx: number, cy: number, w: number, h: number) => {
      const points = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        points.push(`${cx + Math.cos(angle) * w / 2},${cy + Math.sin(angle) * h / 2}`);
      }
      return `M${points.join(' L')} Z`;
    };

    return (
      <div
        key={`${side}-${index}`}
        onMouseEnter={() => isLeft && setHoveredSlot(index)}
        onMouseLeave={() => isLeft && setHoveredSlot(null)}
        style={{
          position: 'absolute',
          left: slotsStartX,
          top: slotY,
          width: slotWidth,
          height: slotHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width={slotWidth} height={slotHeight} style={{ position: 'absolute' }}>
          <defs>
            <filter id={`glow-${side}-${index}`}>
              <feGaussianBlur stdDeviation={isHovered ? 6 : 3} result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d={hexPath(slotWidth / 2, slotHeight / 2, slotWidth - 10, slotHeight - 10)}
            fill="rgba(69, 162, 158, 0.08)"
            stroke="#45A29E"
            strokeWidth="2"
            filter={`url(#glow-${side}-${index})`}
            style={{
              transition: 'all 0.3s ease',
              opacity: hasCard ? 1 : isHovered ? 1 : 0.6,
              strokeWidth: isHovered ? 3 : 2,
            }}
          />
        </svg>

        {slot?.card && battleState.phase === 'idle' && (
          <div onClick={() => isLeft && removeCardFromSlot(index)} style={{ zIndex: 2 }}>
            <CardComponent card={slot.card} floating />
          </div>
        )}

        {!slot?.card && (
          <div
            style={{
              color: 'rgba(69, 162, 158, 0.5)',
              fontSize: 12,
              zIndex: 1,
            }}
          >
            {isLeft ? '拖拽卡牌' : '敌方槽位'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'relative',
        width: ARENA_WIDTH,
        height: ARENA_HEIGHT,
        margin: '0 auto',
      }}
      onMouseMove={handleArenaMouseMove}
      onMouseUp={handleArenaMouseUp}
      onMouseLeave={() => setHoveredSlot(null)}
    >
      <canvas
        ref={canvasRef}
        width={ARENA_WIDTH}
        height={ARENA_HEIGHT}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          borderRadius: 12,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: ARENA_WIDTH,
          height: ARENA_HEIGHT,
          pointerEvents: 'none',
        }}
      >
        {[0, 1, 2].map((i) => (
          <React.Fragment key={`slots-${i}`}>
            {renderHexSlot(i, 'left')}
            {renderHexSlot(i, 'right')}
          </React.Fragment>
        ))}

        {animatedCards.map((ac, i) => (
          <div
            key={`animated-${i}-${ac.card.id}`}
            style={{
              position: 'absolute',
              left: ac.x - 60,
              top: ac.y - 85,
              transform: `scale(${ac.scale})`,
              opacity: ac.opacity,
              pointerEvents: 'none',
              filter: ac.card.hp <= 0 ? 'grayscale(1) brightness(0.5)' : 'none',
              transition: 'filter 0.3s ease',
            }}
          >
            <CardComponent card={{ ...ac.card, hp: ac.hp }} small />
          </div>
        ))}

        {battleState.phase === 'fighting' && (
          <div
            style={{
              position: 'absolute',
              top: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              color: '#66FCF1',
              fontSize: 18,
              fontWeight: 600,
              textShadow: '0 0 10px rgba(102, 252, 241, 0.5)',
            }}
          >
            回合 {battleState.currentTurn}
          </div>
        )}
      </div>
    </div>
  );
};
