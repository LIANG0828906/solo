import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import type { Pet, GiftType, SquarePetData } from '../types';
import NavBar from '../components/NavBar';
import SquarePet from '../components/SquarePet';
import PetDetailModal from '../components/PetDetailModal';
import LevelUpEffect from '../components/LevelUpEffect';
import { socialApi, petApi } from '../api';
import { sfx } from '../utils/audio';
import { randRange } from '../utils/helpers';

const CARD_W = 10;
const CARD_H = 18;

interface PetState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function rectsOverlap(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return dx < CARD_W && dy < CARD_H;
}

const SocialSquare: React.FC = () => {
  const navigate = useNavigate();
  const pet = useGameStore(s => s.currentPet);
  const showLevelUp = useGameStore(s => s.showLevelUp);
  const dismissLevelUp = useGameStore(s => s.dismissLevelUp);
  const sendGiftAction = useGameStore(s => s.sendGift);
  const addFloatingText = useGameStore(s => s.addFloatingText);

  const [squarePets, setSquarePets] = useState<SquarePetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailPet, setDetailPet] = useState<Pet | null>(null);
  const [myPetState, setMyPetState] = useState<PetState>({
    x: 50, y: 75, vx: randRange(0.3, 0.8) * (Math.random() > 0.5 ? 1 : -1), vy: randRange(0.15, 0.4) * (Math.random() > 0.5 ? 1 : -1)
  });
  const sceneRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const lastTick = useRef<number>(0);
  const dirChangeTimer = useRef<number>(0);
  const nextDirChange = useRef<number>(randRange(2000, 3000));

  useEffect(() => {
    if (!pet) {
      const saved = localStorage.getItem('pet_id');
      if (saved) {
        petApi.getPet(saved).then((p) => {
          useGameStore.getState().restorePet(p);
          const nn = localStorage.getItem('pet_nickname');
          if (nn) useGameStore.getState().registerUser(nn);
        }).catch(() => navigate('/', { replace: true }));
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [pet, navigate]);

  const initScene = useCallback(async () => {
    try {
      const socialPets = await socialApi.getSquarePets();
      const pets: SquarePetData[] = socialPets.map((sp, i) => {
        let x: number, y: number;
        let attempts = 0;
        do {
          x = randRange(10, 90);
          y = randRange(40, 85);
          attempts++;
        } while (attempts < 50 && pets.some(p => rectsOverlap({ x, y }, p)));
        return {
          ...sp,
          x, y,
          vx: (Math.random() > 0.5 ? 1 : -1) * randRange(0.3, 0.8),
          vy: (Math.random() > 0.5 ? 1 : -1) * randRange(0.15, 0.4),
          showHeart: false,
          heartTimer: 0,
        } as SquarePetData;
      });
      setSquarePets(pets);
    } catch (e) {
      const mockFallback: SquarePetData[] = [];
      const names = ['毛毛', '豆豆', '球球', '乐乐', '布丁', '奶糖', '汤圆', '芝士', '旺财', '小白'];
      for (let i = 0; i < 8; i++) {
        mockFallback.push({
          id: `fallback-${i}`,
          ownerId: `u-${i}`,
          ownerName: `主人${i + 1}`,
          name: names[i],
          species: i % 2 === 0 ? 'cat' : 'dog',
          breed: (i % 2 === 0 ? (['domestic', 'scottish', 'ragdoll'] as const) : (['shiba', 'golden', 'corgi'] as const))[i % 3],
          colorScheme: (i % 3) as 0 | 1 | 2,
          level: Math.floor(Math.random() * 6) + 1,
          exp: 0, hunger: 80, happiness: 80, cleanliness: 80, energy: 80,
          x: randRange(10, 90),
          y: randRange(40, 85),
          vx: randRange(-0.6, 0.6),
          vy: randRange(-0.3, 0.3),
          showHeart: false, heartTimer: 0,
        });
      }
      setSquarePets(mockFallback);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initScene();
  }, [initScene]);

  const resolveCollision = (p1: { x: number; y: number; vx: number; vy: number }, p2: { x: number; y: number; vx: number; vy: number }) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const overlapX = CARD_W - Math.abs(dx);
    const overlapY = CARD_H - Math.abs(dy);

    if (overlapX < overlapY) {
      const sign = dx >= 0 ? 1 : -1;
      p1.x += sign * overlapX / 2;
      p2.x -= sign * overlapX / 2;
      const tempVx = p1.vx;
      p1.vx = p2.vx * 0.8 + (Math.random() - 0.5) * 0.2;
      p2.vx = tempVx * 0.8 + (Math.random() - 0.5) * 0.2;
    } else {
      const sign = dy >= 0 ? 1 : -1;
      p1.y += sign * overlapY / 2;
      p2.y -= sign * overlapY / 2;
      const tempVy = p1.vy;
      p1.vy = p2.vy * 0.8 + (Math.random() - 0.5) * 0.2;
      p2.vy = tempVy * 0.8 + (Math.random() - 0.5) * 0.2;
    }
  };

  const tick = useCallback((now: number) => {
    const dt = Math.min(50, now - lastTick.current);
    lastTick.current = now;
    dirChangeTimer.current += dt;
    const needChangeDir = dirChangeTimer.current > nextDirChange.current;

    if (needChangeDir) {
      dirChangeTimer.current = 0;
      nextDirChange.current = randRange(2000, 3000);
    }

    setSquarePets(prev => {
      const next = prev.map(p => ({ ...p }));
      for (let i = 0; i < next.length; i++) {
        const p = next[i];
        if (needChangeDir && Math.random() < 0.35) {
          p.vx = (Math.random() > 0.5 ? 1 : -1) * randRange(0.3, 0.8);
          p.vy = (Math.random() > 0.5 ? 1 : -1) * randRange(0.15, 0.4);
        }
        let nx = p.x + p.vx * (dt / 40);
        let ny = p.y + p.vy * (dt / 40);
        if (nx < 8) { nx = 8; p.vx = Math.abs(p.vx); }
        if (nx > 92) { nx = 92; p.vx = -Math.abs(p.vx); }
        if (ny < 40) { ny = 40; p.vy = Math.abs(p.vy); }
        if (ny > 88) { ny = 88; p.vy = -Math.abs(p.vy); }
        p.x = nx;
        p.y = ny;
        if (p.showHeart) {
          p.heartTimer -= dt;
          if (p.heartTimer <= 0) p.showHeart = false;
        }
      }
      for (let i = 0; i < next.length; i++) {
        for (let j = i + 1; j < next.length; j++) {
          if (rectsOverlap(next[i], next[j])) {
            resolveCollision(next[i], next[j]);
          }
        }
      }
      return next;
    });

    setMyPetState(prev => {
      let { x, y, vx, vy } = prev;
      if (needChangeDir && Math.random() < 0.25) {
        vx = (Math.random() > 0.5 ? 1 : -1) * randRange(0.3, 0.8);
        vy = (Math.random() > 0.5 ? 1 : -1) * randRange(0.15, 0.4);
      }
      let nx = x + vx * (dt / 40);
      let ny = y + vy * (dt / 40);
      if (nx < 8) { nx = 8; vx = Math.abs(vx); }
      if (nx > 92) { nx = 92; vx = -Math.abs(vx); }
      if (ny < 40) { ny = 40; vy = Math.abs(vy); }
      if (ny > 88) { ny = 88; vy = -Math.abs(vy); }
      return { x: nx, y: ny, vx, vy };
    });

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (loading) return;
    lastTick.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loading, tick]);

  const triggerHearts = (targetId: string) => {
    setSquarePets(prev => prev.map(p =>
      p.id === targetId ? { ...p, showHeart: true, heartTimer: 1200 } : p
    ));
  };

  const handleSendGift = async (toPetId: string, type: GiftType) => {
    const r = await sendGiftAction(toPetId, type);
    if (r.ok) {
      triggerHearts(toPetId);
      addFloatingText(`+${r.expGain ?? 0}经验`, '#FBC02D', 50, 30);
    }
    return r;
  };

  const handleClickPet = (sp: Pet) => {
    sfx.click();
    setDetailPet(sp);
  };

  const allPets: (Pet & { x: number; y: number })[] = [
    ...squarePets,
    ...(pet ? [{ ...pet, x: myPetState.x, y: myPetState.y }] : []),
  ];
  const sortedPets = [...allPets].sort((a, b) => a.y - b.y);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-cream)', display: 'flex', flexDirection: 'column' }}>
      <NavBar petName={pet?.name} level={pet?.level} />

      <div style={{
        padding: 12, maxWidth: 900, width: '100%', margin: '0 auto',
        flex: 1, display: 'flex', flexDirection: 'column', gap: 12,
        boxSizing: 'border-box',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'linear-gradient(135deg,#C8E6C9,#A5D6A7)',
          borderRadius: 16,
          border: '2px solid rgba(255,255,255,0.7)',
          boxShadow: 'var(--shadow-soft)',
        }}>
          <div>
            <h2 style={{ fontSize: 18, color: '#2E7D32' }}>🌳 萌宠广场</h2>
            <div style={{ fontSize: 12, color: '#388E3C', marginTop: 2, fontWeight: 600 }}>
              和其他小伙伴打招呼吧~ 点击宠物送礼物!
            </div>
          </div>
          <button className="cartoon-btn" onClick={() => { sfx.click(); navigate('/room'); }} style={{ padding: '8px 16px', fontSize: 13 }}>
            🏠 回房间
          </button>
        </div>

        <div
          ref={sceneRef}
          style={{
            position: 'relative',
            flex: 1,
            minHeight: 500,
            borderRadius: 28,
            overflow: 'hidden',
            boxShadow: 'var(--shadow-float)',
            border: '3px solid rgba(255,255,255,0.8)',
          }}
        >
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg,#87CEEB 0%, #B0E0E6 35%, #98D8C8 55%, #90EE90 70%, #7CCD7C 100%)',
            zIndex: 1,
          }} />

          <div style={{
            position: 'absolute',
            top: '8%',
            right: '8%',
            fontSize: 60,
            filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))',
            zIndex: 2,
            animation: 'pulse 3s ease-in-out infinite',
          }}>☀️</div>

          <div style={{ position: 'absolute', top: '12%', left: '10%', fontSize: 48, opacity: 0.9, zIndex: 2, animation: 'float 8s ease-in-out infinite' }}>☁️</div>
          <div style={{ position: 'absolute', top: '18%', left: '35%', fontSize: 36, opacity: 0.85, zIndex: 2, animation: 'float 10s ease-in-out infinite 1s' }}>☁️</div>
          <div style={{ position: 'absolute', top: '10%', right: '25%', fontSize: 42, opacity: 0.8, zIndex: 2, animation: 'float 9s ease-in-out infinite 0.5s' }}>☁️</div>
          <div style={{ position: 'absolute', top: '22%', left: '60%', fontSize: 30, opacity: 0.75, zIndex: 2, animation: 'float 11s ease-in-out infinite 2s' }}>☁️</div>

          <div style={{ position: 'absolute', top: '25%', left: '45%', fontSize: 28, zIndex: 2, animation: 'bird-fly 15s linear infinite' }}>🐦</div>
          <div style={{ position: 'absolute', top: '20%', right: '40%', fontSize: 24, zIndex: 2, animation: 'bird-fly 18s linear infinite reverse' }}>🦋</div>

          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '65%',
            background: 'linear-gradient(180deg,#90EE90 0%, #7CCD7C 40%, #6B8E23 100%)',
            zIndex: 3,
          }} />

          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4 }}>
            <defs>
              <pattern id="grass-pattern" x="0" y="0" width="24" height="10" patternUnits="userSpaceOnUse">
                <path d="M0 10 Q3 4 5 10 Q8 2 10 10 Q13 5 15 10 Q18 3 20 10 Q22 6 24 10" fill="none" stroke="#556B2F" strokeWidth="1.5" opacity="0.4" />
              </pattern>
            </defs>
            <rect x="0" y="35%" width="100%" height="65%" fill="url(#grass-pattern)" />
          </svg>

          <div style={{ position: 'absolute', left: '3%', bottom: '30%', fontSize: 70, zIndex: 5, filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.25))' }}>🌳</div>
          <div style={{ position: 'absolute', right: '5%', bottom: '33%', fontSize: 68, zIndex: 5, filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.25))' }}>🌲</div>
          <div style={{ position: 'absolute', left: '20%', bottom: '38%', fontSize: 64, zIndex: 5, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.2))' }}>🌴</div>
          <div style={{ position: 'absolute', right: '25%', bottom: '36%', fontSize: 60, zIndex: 5, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.2))' }}>🌳</div>

          <div style={{ position: 'absolute', left: '52%', bottom: '20%', fontSize: 56, zIndex: 5, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.2))' }}>🪑</div>

          <div style={{ position: 'absolute', left: '12%', bottom: '12%', fontSize: 44, zIndex: 5, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' }}>💐</div>
          <div style={{ position: 'absolute', right: '10%', bottom: '14%', fontSize: 40, zIndex: 5, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' }}>🌷</div>
          <div style={{ position: 'absolute', left: '38%', bottom: '10%', fontSize: 38, zIndex: 5, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' }}>🌻</div>
          <div style={{ position: 'absolute', right: '40%', bottom: '18%', fontSize: 34, zIndex: 5, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' }}>🌼</div>

          {loading ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#2E7D32', fontWeight: 700, zIndex: 20 }}>
              加载广场小伙伴中...
            </div>
          ) : (
            <>
              {sortedPets.map((sp, idx) => {
                const isMyPet = pet && sp.id === pet.id;
                return (
                  <div
                    key={sp.id}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      transform: `translate(${sp.x}%, ${sp.y}%)`,
                      willChange: 'transform',
                      zIndex: 10 + idx,
                      pointerEvents: 'none',
                    }}
                  >
                    {isMyPet ? (
                      <div
                        onClick={(e) => { e.stopPropagation(); sfx.click(); navigate('/room'); }}
                        style={{
                          cursor: 'pointer',
                          pointerEvents: 'auto',
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: -16,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'linear-gradient(135deg,#FFD54F,#FF9800)',
                          color: '#fff',
                          padding: '2px 10px',
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                          boxShadow: '0 2px 8px rgba(255,152,0,0.5)',
                          border: '1.5px solid rgba(255,255,255,0.6)',
                          animation: 'bob 1.2s ease-in-out infinite',
                          zIndex: 2,
                        }}>🏷️ 我的宝贝</div>
                        <SquarePet pet={pet} x={0} y={0} size={86} onClick={() => {}} style={{ pointerEvents: 'none' }} />
                      </div>
                    ) : (
                      <SquarePet
                        pet={sp}
                        x={0}
                        y={0}
                        size={72}
                        showHeart={(sp as SquarePetData).showHeart}
                        onClick={() => handleClickPet(sp)}
                        style={{ pointerEvents: 'auto' }}
                      />
                    )}
                  </div>
                );
              })}
            </>
          )}

          {!loading && (
            <div style={{
              position: 'absolute', left: 12, bottom: 12,
              background: 'rgba(255,255,255,0.92)',
              padding: '6px 14px', borderRadius: 999,
              fontSize: 12, fontWeight: 700, color: '#2E7D32',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              display: 'flex', alignItems: 'center', gap: 6,
              zIndex: 100,
            }}>
              🐾 广场上共有 <span style={{ color: '#E65100' }}>{squarePets.length + 1}</span> 只宠物
            </div>
          )}
        </div>
      </div>

      <PetDetailModal
        open={!!detailPet}
        pet={detailPet}
        onClose={() => setDetailPet(null)}
        onSendGift={handleSendGift}
        currentPetId={pet?.id}
      />
      <LevelUpEffect open={showLevelUp} level={pet?.level ?? 1} onClose={dismissLevelUp} />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(10px) translateY(-5px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.6)); }
          50% { transform: scale(1.1); filter: drop-shadow(0 0 30px rgba(255, 215, 0, 0.8)); }
        }
        @keyframes bird-fly {
          0% { transform: translateX(-100px) translateY(0); }
          100% { transform: translateX(calc(100vw + 100px)) translateY(-20px); }
        }
        @keyframes bob {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-3px); }
        }
        @keyframes heart-burst {
          0% { opacity: 1; transform: translate(0, 0) scale(0.5); }
          100% { opacity: 0; transform: translate(var(--hx, 0px), -60px) scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default SocialSquare;
