import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import type { FurnitureType, PetAnimationState, FoodType } from '../types';
import NavBar from '../components/NavBar';
import StatusBar from '../components/StatusBar';
import PetSprite from '../components/PetSprite';
import FurnitureBar from '../components/FurnitureBar';
import FoodPicker from '../components/FoodPicker';
import FloatingTextLayer from '../components/FloatingText';
import LevelUpEffect from '../components/LevelUpEffect';
import { sfx } from '../utils/audio';
import { expProgress, expForLevel } from '../utils/helpers';

const furniturePos: Record<FurnitureType, { x: number; y: number }> = {
  bowl:  { x: 18, y: 78 },
  toy:   { x: 82, y: 78 },
  water: { x: 14, y: 50 },
  bed:   { x: 86, y: 48 },
};

const furnitureEmoji: Record<FurnitureType, string> = {
  bowl: '🥣',
  toy: '🎾',
  water: '🚰',
  bed: '🛏️',
};

const furnitureLabel: Record<FurnitureType, string> = {
  bowl: '食盆',
  toy: '玩具',
  water: '水盆',
  bed: '睡垫',
};

const PetRoom: React.FC = () => {
  const navigate = useNavigate();
  const pet = useGameStore(s => s.currentPet);
  const nickname = useGameStore(s => s.nickname);
  const feedPet = useGameStore(s => s.feedPet);
  const playPet = useGameStore(s => s.playPet);
  const cleanPet = useGameStore(s => s.cleanPet);
  const restPet = useGameStore(s => s.restPet);
  const floatingTexts = useGameStore(s => s.floatingTexts);
  const showLevelUp = useGameStore(s => s.showLevelUp);
  const dismissLevelUp = useGameStore(s => s.dismissLevelUp);
  const addFloatingText = useGameStore(s => s.addFloatingText);
  const decayTick = useGameStore(s => s.decayTick);

  const [foodOpen, setFoodOpen] = useState(false);
  const [animState, setAnimState] = useState<PetAnimationState>('idle');
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [petPos, setPetPos] = useState({ x: 50, y: 72 });
  const [busy, setBusy] = useState(false);
  const [warned, setWarned] = useState<Set<string>>(new Set());
  const [catchMode, setCatchMode] = useState(false);
  const [ballPos, setBallPos] = useState<{ x: number; y: number } | null>(null);
  const roomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pet) {
      const saved = localStorage.getItem('pet_id');
      if (saved) {
        import('../api').then(({ petApi }) => {
          petApi.getPet(saved).then((p) => {
            useGameStore.getState().restorePet(p);
            const nn = localStorage.getItem('pet_nickname');
            if (nn) useGameStore.getState().registerUser(nn);
          }).catch(() => navigate('/', { replace: true }));
        });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [pet, navigate]);

  useEffect(() => {
    const t = setInterval(decayTick, 4000);
    return () => clearInterval(t);
  }, [decayTick]);

  useEffect(() => {
    if (!pet) return;
    const check = (key: string, val: number, msg: string, color: string) => {
      if (val <= 20 && !warned.has(key)) {
        setWarned(w => new Set(w).add(key));
        sfx.warning();
        addFloatingText(msg, color, 50, 35);
      } else if (val > 35 && warned.has(key)) {
        setWarned(w => {
          const n = new Set(w);
          n.delete(key);
          return n;
        });
      }
    };
    check('hunger', pet.hunger, '肚子饿了...', '#E53935');
    check('happy', pet.happiness, '心情低落...', '#1E88E5');
    check('clean', pet.cleanliness, '该洗澡了...', '#8E24AA');
    check('energy', pet.energy, '有点累了...', '#43A047');
  }, [pet?.hunger, pet?.happiness, pet?.cleanliness, pet?.energy]);

  const walkTo = useCallback((targetX: number, targetY: number, duration = 700): Promise<void> => {
    return new Promise(resolve => {
      setFacing(targetX > petPos.x ? 'right' : 'left');
      setAnimState('walking');
      const startX = petPos.x;
      const startY = petPos.y;
      const start = performance.now();
      let raf = 0;
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / duration);
        const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        setPetPos({ x: startX + (targetX - startX) * ease, y: startY + (targetY - startY) * ease });
        if (p < 1) raf = requestAnimationFrame(tick);
        else {
          setAnimState('idle');
          resolve();
        }
      };
      raf = requestAnimationFrame(tick);
    });
  }, [petPos]);

  const floatText = (txt: string, color: string) => addFloatingText(txt, color, petPos.x, petPos.y - 12);

  const handleFood = async (type: FoodType) => {
    if (!pet || busy) return;
    setBusy(true);
    setFoodOpen(false);
    await walkTo(furniturePos.bowl.x, furniturePos.bowl.y);
    setAnimState('eating');
    const leveled = await feedPet(type);
    const effects: Record<FoodType, { h: number; hp: number; e: number }> = {
      dry: { h: 25, hp: 5, e: 5 },
      can: { h: 40, hp: 15, e: 10 },
      snack: { h: 10, hp: 25, e: 8 },
    };
    const eff = effects[type];
    setTimeout(() => floatText(`+${eff.h} 饥饿`, '#FB8C00'), 150);
    setTimeout(() => floatText(`+${eff.hp} 快乐`, '#1E88E5'), 400);
    setTimeout(() => floatText(`+${eff.e} 经验`, '#FBC02D'), 650);
    setTimeout(() => {
      setAnimState('idle');
      if (!leveled) setBusy(false);
    }, 1600);
  };

  const startCatchGame = async () => {
    if (!pet || busy) return;
    setBusy(true);
    await walkTo(50, 70);
    setCatchMode(true);
    setBallPos({ x: 50, y: 55 });
    const doRound = async () => {
      if (!roomRef.current) return;
      const rect = roomRef.current.getBoundingClientRect();
      for (let round = 0; round < 3; round++) {
        const targetX = 20 + Math.random() * 60;
        const targetY = 45 + Math.random() * 25;
        setBallPos({ x: targetX, y: targetY });
        setFacing(targetX > petPos.x ? 'right' : 'left');
        await walkTo(targetX, Math.min(targetY + 10, 82), 500);
        setAnimState('playing');
        sfx.play();
        floatText('+快乐!', '#29B6F6');
        await new Promise(r => setTimeout(r, 450));
        setAnimState('idle');
      }
    };
    await doRound();
    setBallPos(null);
    setCatchMode(false);
    const leveled = await playPet();
    setTimeout(() => floatText(`+${20} 快乐`, '#1E88E5'), 100);
    setTimeout(() => floatText(`${-15} 体力`, '#E53935'), 350);
    setTimeout(() => floatText(`+${12} 经验`, '#FBC02D'), 600);
    setTimeout(() => {
      walkTo(50, 72, 600);
      if (!leveled) setBusy(false);
    }, 900);
  };

  const handleDrink = async () => {
    if (!pet || busy) return;
    setBusy(true);
    await walkTo(furniturePos.water.x, furniturePos.water.y);
    setAnimState('drinking');
    sfx.drink();
    const leveled = await cleanPet();
    setTimeout(() => floatText(`+${30} 清洁`, '#AB47BC'), 250);
    setTimeout(() => floatText(`+${6} 经验`, '#FBC02D'), 500);
    setTimeout(() => {
      setAnimState('idle');
      walkTo(50, 72, 600);
      if (!leveled) setBusy(false);
    }, 1500);
  };

  const handleRest = async () => {
    if (!pet || busy) return;
    setBusy(true);
    await walkTo(furniturePos.bed.x, furniturePos.bed.y);
    setAnimState('sleeping');
    sfx.sleep();
    await restPet();
    setTimeout(() => floatText(`+${40} 体力`, '#43A047'), 400);
    setTimeout(async () => {
      setAnimState('idle');
      await walkTo(50, 72, 600);
      setBusy(false);
    }, 3200);
  };

  const handleFurniture = (t: FurnitureType) => {
    if (busy) return;
    if (t === 'bowl') { setFoodOpen(true); return; }
    if (t === 'toy') { startCatchGame(); return; }
    if (t === 'water') { handleDrink(); return; }
    if (t === 'bed') { handleRest(); return; }
  };

  if (!pet) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 18, color: '#8D6E63' }}>加载中...</div>
      </div>
    );
  }

  const expProg = expProgress(pet.level, pet.exp);
  const nextExp = expForLevel(Math.min(pet.level + 1, 10));
  const curExp = expForLevel(pet.level);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-cream)' }}>
      <NavBar petName={pet.name} level={pet.level} />

      <div style={{ maxWidth: 820, margin: '0 auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <StatusBar pet={pet} />

        <div
          ref={roomRef}
          style={{
            position: 'relative',
            height: 'min(68vh, 560px)',
            minHeight: 420,
            borderRadius: 28,
            overflow: 'hidden',
            background: 'linear-gradient(180deg, #BBDEFB 0%, #E1BEE7 40%, #FFCCBC 100%)',
            boxShadow: 'var(--shadow-float)',
            border: '3px solid rgba(255,255,255,0.8)',
          }}
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '55%',
            background: 'linear-gradient(180deg, #90CAF9 0%, #CE93D8 100%)',
            opacity: 0.7,
          }} />
          <div style={{
            position: 'absolute', left: '8%', top: '18%',
            fontSize: 42, opacity: 0.85, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))',
          }}>☁️</div>
          <div style={{
            position: 'absolute', right: '10%', top: '10%',
            fontSize: 50, opacity: 0.9, filter: 'drop-shadow(0 4px 6px rgba(255,193,7,0.4))',
          }}>🌤️</div>
          <div style={{
            position: 'absolute', right: '30%', top: '22%',
            fontSize: 34, opacity: 0.75,
          }}>☁️</div>

          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '52%',
            background: 'linear-gradient(180deg, rgba(255,204,188,0.2) 0%, #FFE0B2 30%, #FFCC80 100%)',
            borderTop: '3px dashed rgba(255,152,0,0.3)',
          }} />

          <div style={{
            position: 'absolute', left: '5%', bottom: '12%',
            fontSize: 56, filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.2))',
          }}>🪴</div>
          <div style={{
            position: 'absolute', right: '4%', bottom: '14%',
            fontSize: 58, filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.2))',
          }}>🖼️</div>

          {(Object.keys(furniturePos) as FurnitureType[]).map(k => (
            <button
              key={k}
              onClick={() => handleFurniture(k)}
              disabled={busy || (k === 'bowl' && foodOpen)}
              title={furnitureLabel[k]}
              style={{
                position: 'absolute',
                left: `${furniturePos[k].x}%`,
                top: `${furniturePos[k].y}%`,
                transform: 'translate(-50%, -50%)',
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(255,255,255,0.7)',
                border: '3px solid rgba(255,255,255,0.9)',
                boxShadow: '0 6px 14px rgba(0,0,0,0.15)',
                fontSize: 38,
                transition: 'var(--transition-mid)',
                zIndex: 5,
              }}
              onMouseEnter={(e) => {
                if (busy) return;
                e.currentTarget.style.transform = 'translate(-50%, -55%) scale(1.08)';
                e.currentTarget.style.boxShadow = '0 10px 22px rgba(0,0,0,0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
                e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.15)';
              }}
            >{furnitureEmoji[k]}</button>
          ))}

          {ballPos && (
            <div style={{
              position: 'absolute',
              left: `${ballPos.x}%`,
              top: `${ballPos.y}%`,
              transform: 'translate(-50%, -50%)',
              fontSize: 40,
              transition: 'left 0.45s cubic-bezier(0.34,1.56,0.64,1), top 0.45s cubic-bezier(0.34,1.56,0.64,1)',
              zIndex: 25,
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
              animation: 'bob 0.5s ease-in-out infinite',
            }}>🎾</div>
          )}

          <div style={{
            position: 'absolute',
            left: `${petPos.x}%`,
            top: `${petPos.y}%`,
            transform: 'translate(-50%, -100%)',
            zIndex: 20,
            pointerEvents: 'none',
          }}>
            <PetSprite pet={pet} animState={animState} facing={facing} size={180} />
          </div>

          <FloatingTextLayer items={floatingTexts} />

          <FoodPicker
            open={foodOpen}
            onClose={() => setFoodOpen(false)}
            onPick={handleFood}
            busy={busy}
          />

          <div style={{
            position: 'absolute',
            left: 12, top: 12,
            background: 'rgba(255,255,255,0.85)',
            borderRadius: 12,
            padding: '8px 12px',
            boxShadow: 'var(--shadow-soft)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>⭐</span>
              <span style={{ fontWeight: 800, color: '#FF6F00', fontSize: 12 }}>Lv.{pet.level}</span>
              <div style={{
                width: 110, height: 8, background: '#FFF3E0',
                borderRadius: 999, overflow: 'hidden', border: '1px solid #FFCC80',
              }}>
                <div style={{
                  height: '100%', width: `${Math.round(expProg * 100)}%`,
                  background: 'linear-gradient(90deg, #FFEB3B, #FF9800)',
                  borderRadius: 999, transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',
                }} />
              </div>
              <span style={{ fontSize: 10, color: '#8D6E63', fontVariantNumeric: 'tabular-nums' }}>
                {pet.exp - curExp}/{nextExp - curExp}
              </span>
            </div>
          </div>

          <div style={{
            position: 'absolute',
            right: 12, top: 12,
            background: 'rgba(255,255,255,0.85)',
            borderRadius: 12,
            padding: '6px 12px',
            boxShadow: 'var(--shadow-soft)',
            fontSize: 12,
            color: '#5D4037',
            fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span>👤</span>{nickname || '主人'}
          </div>

          {catchMode && (
            <div style={{
              position: 'absolute', left: '50%', top: 80,
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg,#FFD54F,#FF8A65)',
              color: '#fff', padding: '6px 18px', borderRadius: 999,
              fontWeight: 800, fontSize: 13,
              boxShadow: '0 6px 18px rgba(255,112,67,0.4)',
              animation: 'bob 1s ease-in-out infinite',
            }}>🎾 抛接球游戏中!</div>
          )}
        </div>

        <FurnitureBar onSelect={handleFurniture} disabled={busy} />

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
        }}>
          <button
            className="cartoon-btn"
            onClick={() => { sfx.click(); navigate('/square'); }}
            style={{ background: 'linear-gradient(135deg,#81C784,#388E3C)', padding: '12px' }}
          >🌳 去广场逛逛</button>
          <button
            onClick={() => {
              sfx.click();
              if (confirm('确定重新领养新宠物吗？当前宠物将被清除~')) {
                localStorage.clear();
                navigate('/', { replace: true });
              }
            }}
            style={{
              padding: '12px', borderRadius: 16,
              background: 'linear-gradient(135deg,#F48FB1,#EC407A)',
              color: '#fff', fontWeight: 700, fontSize: 14,
              boxShadow: '0 4px 12px rgba(236,64,122,0.25)',
              border: '2px solid rgba(255,255,255,0.5)',
            }}
          >🔄 重新领养</button>
        </div>
      </div>

      <LevelUpEffect open={showLevelUp} level={pet.level} onClose={() => { dismissLevelUp(); setBusy(false); }} />
    </div>
  );
};

export default PetRoom;
