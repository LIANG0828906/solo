import { useEffect, useRef, useCallback, useState } from 'react';
import { GameRenderer } from './renderer/gameRenderer';
import { useGameStore } from './stores/gameStore';
import type { Equipment, EquipmentSlot } from './game/types';

const QUALITY_COLORS: Record<string, string> = {
  white: '#AAAAAA',
  blue: '#3498DB',
  purple: '#9B59B6',
  orange: '#FF6B35',
};

const QUALITY_LABELS: Record<string, string> = {
  white: '普通',
  blue: '精良',
  purple: '史诗',
  orange: '传说',
};

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  weapon: '武器',
  helmet: '头盔',
  armor: '铠甲',
  boots: '靴子',
};

const SLOT_ICONS: Record<EquipmentSlot, string> = {
  weapon: '⚔',
  helmet: '🪖',
  armor: '🛡',
  boots: '👢',
};

function EquipmentSlotComp({ slot, equipment, onEquip, onUnequip }: {
  slot: EquipmentSlot;
  equipment: Equipment | null;
  onEquip: (eq: Equipment) => void;
  onUnequip: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData('equipment')) as Equipment;
      if (data.slot === slot) {
        onEquip(data);
      }
    } catch { /* ignore */ }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        width: 52,
        height: 52,
        border: `2px solid ${equipment ? QUALITY_COLORS[equipment.quality] : dragOver ? '#66FCF1' : '#45A29E44'}`,
        borderRadius: 8,
        background: equipment ? `${QUALITY_COLORS[equipment.quality]}15` : '#1A1A2E',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: equipment ? 'pointer' : 'default',
        transition: 'all 0.2s',
        position: 'relative',
        boxShadow: equipment ? `0 0 8px ${QUALITY_COLORS[equipment.quality]}40` : 'none',
      }}
      onClick={() => equipment && onUnequip()}
      title={equipment ? `${equipment.name} (点击卸下)` : SLOT_LABELS[slot]}
    >
      <span style={{ fontSize: 20 }}>{equipment ? SLOT_ICONS[slot] : SLOT_ICONS[slot]}</span>
      <span style={{ fontSize: 9, color: equipment ? QUALITY_COLORS[equipment.quality] : '#555' }}>
        {equipment ? equipment.name.slice(0, 2) : SLOT_LABELS[slot]}
      </span>
    </div>
  );
}

function BackpackItem({ equipment, onEquip }: {
  equipment: Equipment;
  onEquip: (eq: Equipment) => void;
}) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('equipment', JSON.stringify(equipment));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onEquip(equipment)}
      style={{
        width: 52,
        height: 52,
        border: `1px solid ${QUALITY_COLORS[equipment.quality]}`,
        borderRadius: 6,
        background: `${QUALITY_COLORS[equipment.quality]}10`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
        transition: 'all 0.15s',
        position: 'relative',
      }}
      title={`${equipment.name}\n${QUALITY_LABELS[equipment.quality]}\n攻击+${equipment.attackBonus} 防御+${equipment.defenseBonus}`}
    >
      <span style={{ fontSize: 16 }}>{SLOT_ICONS[equipment.slot]}</span>
      <span style={{ fontSize: 8, color: QUALITY_COLORS[equipment.quality], textAlign: 'center', lineHeight: 1.1 }}>
        {equipment.name.slice(0, 3)}
      </span>
    </div>
  );
}

function SidePanel() {
  const player = useGameStore((s) => s.player);
  const combat = useGameStore((s) => s.combat);
  const currentFloor = useGameStore((s) => s.currentFloor);
  const gameOver = useGameStore((s) => s.gameOver);
  const victory = useGameStore((s) => s.victory);
  const equipItem = useGameStore((s) => s.equipItem);
  const unequipItem = useGameStore((s) => s.unequipItem);
  const goToNextFloor = useGameStore((s) => s.goToNextFloor);

  const handleEquip = useCallback((eq: Equipment) => {
    equipItem(eq, eq.slot);
  }, [equipItem]);

  const handleUnequip = useCallback((slot: EquipmentSlot) => {
    unequipItem(slot);
  }, [unequipItem]);

  const currentRoom = useGameStore((s) => {
    if (!s.dungeon || s.dungeon.length === 0) return null;
    return s.dungeon[s.player.y]?.[s.player.x] ?? null;
  });

  const canGoNext = currentRoom?.type === 'exit' && !combat.inCombat && !gameOver && !victory.show;

  return (
    <div style={{
      width: 240,
      height: '100%',
      background: '#1E1E2ECC',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      borderRadius: '12px 0 0 12px',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      overflowY: 'auto',
      borderLeft: '1px solid #45A29E33',
    }}>
      <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#66FCF1' }}>
        第 {currentFloor + 1} 层
      </div>

      <div style={{
        background: '#0B0C1088',
        borderRadius: 8,
        padding: 12,
      }}>
        <div style={{ fontSize: 14, fontWeight: 'bold', color: '#66FCF1', marginBottom: 8 }}>角色属性</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 13 }}>
          <div>
            <span style={{ color: '#2ECC71' }}>❤ HP</span>
            <span style={{ float: 'right' }}>{player.hp}/{player.maxHp}</span>
          </div>
          <div>
            <span style={{ color: '#3498DB' }}>◆ MP</span>
            <span style={{ float: 'right' }}>{player.mp}/{player.maxMp}</span>
          </div>
          <div>
            <span style={{ color: '#E74C3C' }}>⚔ 攻击</span>
            <span style={{ float: 'right' }}>{player.attack}</span>
          </div>
          <div>
            <span style={{ color: '#F39C12' }}>🛡 防御</span>
            <span style={{ float: 'right' }}>{player.defense}</span>
          </div>
        </div>

        <div style={{ marginTop: 6 }}>
          <div style={{ height: 6, background: '#333', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(player.hp / player.maxHp) * 100}%`, background: '#2ECC71', borderRadius: 3, transition: 'width 0.3s' }} />
          </div>
          <div style={{ height: 6, background: '#333', borderRadius: 3, overflow: 'hidden', marginTop: 3 }}>
            <div style={{ height: '100%', width: `${(player.mp / player.maxMp) * 100}%`, background: '#3498DB', borderRadius: 3, transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>

      <div style={{
        background: '#0B0C1088',
        borderRadius: 8,
        padding: 12,
      }}>
        <div style={{ fontSize: 14, fontWeight: 'bold', color: '#66FCF1', marginBottom: 8 }}>装备栏</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, justifyContent: 'center' }}>
          {(['weapon', 'helmet', 'armor', 'boots'] as EquipmentSlot[]).map((slot) => (
            <EquipmentSlotComp
              key={slot}
              slot={slot}
              equipment={player.equipment[slot]}
              onEquip={handleEquip}
              onUnequip={() => handleUnequip(slot)}
            />
          ))}
        </div>
      </div>

      <div style={{
        background: '#0B0C1088',
        borderRadius: 8,
        padding: 12,
        flex: 1,
        minHeight: 0,
      }}>
        <div style={{ fontSize: 14, fontWeight: 'bold', color: '#66FCF1', marginBottom: 8 }}>
          背包 ({player.backpack.length}/16)
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 4,
          maxHeight: 220,
          overflowY: 'auto',
        }}>
          {player.backpack
            .sort((a, b) => {
              const order: Record<string, number> = { orange: 0, purple: 1, blue: 2, white: 3 };
              return order[a.quality] - order[b.quality];
            })
            .map((eq) => (
              <BackpackItem key={eq.id} equipment={eq} onEquip={handleEquip} />
            ))}
        </div>
      </div>

      {canGoNext && (
        <button
          className="game-btn"
          onClick={goToNextFloor}
          style={{ width: '100%', fontSize: 16, padding: 10 }}
        >
          🚪 进入下一层
        </button>
      )}

      <div style={{ fontSize: 11, color: '#555', textAlign: 'center' }}>
        WASD移动 · 点击战斗按钮攻击
      </div>
    </div>
  );
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const initGame = useGameStore((s) => s.initGame);
  const movePlayer = useGameStore((s) => s.movePlayer);
  const performNormalAttack = useGameStore((s) => s.performNormalAttack);
  const performSkillAttack = useGameStore((s) => s.performSkillAttack);
  const updateParticles = useGameStore((s) => s.updateParticles);
  const updateFloatingTexts = useGameStore((s) => s.updateFloatingTexts);
  const updateLootAnimations = useGameStore((s) => s.updateLootAnimations);
  const updateCombatCooldowns = useGameStore((s) => s.updateCombatCooldowns);
  const goToNextFloor = useGameStore((s) => s.goToNextFloor);
  const gameOver = useGameStore((s) => s.gameOver);
  const victory = useGameStore((s) => s.victory);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    rendererRef.current = new GameRenderer(canvas);

    const handleResize = () => {
      const container = canvas.parentElement;
      if (!container || !rendererRef.current) return;
      const rect = container.getBoundingClientRect();
      rendererRef.current.resize(rect.width, rect.height);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver || victory.show) return;
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': movePlayer(0, -1); break;
        case 's': case 'arrowdown': movePlayer(0, 1); break;
        case 'a': case 'arrowleft': movePlayer(-1, 0); break;
        case 'd': case 'arrowright': movePlayer(1, 0); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer, gameOver, victory.show]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rendererRef.current) return;

    const handleClick = (e: MouseEvent) => {
      if (gameOver) {
        initGame();
        return;
      }
      if (victory.show) {
        goToNextFloor();
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const scaleX = rendererRef.current!.width / rect.width;
      const scaleY = rendererRef.current!.height / rect.height;
      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;

      const target = rendererRef.current!.getCanvasClickTarget(canvasX, canvasY);
      if (target === 'normal') {
        performNormalAttack();
      } else if (target === 'skill') {
        performSkillAttack();
      }
    };

    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [gameOver, victory.show, initGame, performNormalAttack, performSkillAttack, goToNextFloor]);

  useEffect(() => {
    if (!rendererRef.current) return;

    const gameLoop = (time: number) => {
      const dt = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = time;

      if (dt > 0 && dt < 0.5) {
        updateParticles(dt);
        updateCombatCooldowns(dt);
      }

      const now = performance.now();
      updateFloatingTexts(now);
      updateLootAnimations(now);

      const renderer = rendererRef.current!;
      const state = useGameStore.getState();

      renderer.clear();
      renderer.drawStars(state.stars, time);
      renderer.drawDungeon(state.dungeon, state.player, time);
      renderer.drawTrail(state.trailPoints, time);
      renderer.drawPlayer(state.player, time);
      renderer.drawLootAnimations(state.lootAnimations, time);
      renderer.drawFloatingTexts(state.floatingTexts, time);
      renderer.drawCombatOverlay(state.combat, state.player, time);
      renderer.drawParticles(state.particles);
      renderer.drawFloorIndicator(state.currentFloor);

      if (state.victory.show) {
        renderer.drawVictory(state.victory, state.stats, time);
      }

      if (state.gameOver) {
        renderer.drawGameOver(state.player);
      }

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [updateParticles, updateFloatingTexts, updateLootAnimations, updateCombatCooldowns]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #0B0C10 0%, #1F2833 100%)',
      overflow: 'hidden',
    }}>
      <div style={{
        flex: 1,
        position: 'relative',
        minWidth: 320,
      }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />
      </div>
      <SidePanel />
    </div>
  );
}
