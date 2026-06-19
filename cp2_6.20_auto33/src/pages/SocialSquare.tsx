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

function rectsOverlap(a: { x: number; y: number }, b: { x: number; y: number }, margin = CARD_W) {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return dx < margin && dy < CARD_H;
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
  const [myPetPos, setMyPetPos] = useState<{ x: number; y: number }>({ x: 50, y: 75 });
  const [myPetV] = useState({ vx: 0.5, vy: 0.4 });
  const sceneRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const lastTick = useRef<number>(0);
  const dirChangeTimer = useRef<number>(0);

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

  const tick = useCallback((now: number) => {
    const dt = Math.min(50, now - lastTick.current);
    lastTick.current = now;
    dirChangeTimer.current += dt;

    setSquarePets(prev => {
      const next = prev.map(p => ({ ...p }));
      const changeDir = dirChangeTimer.current > 2200;
      for (let i = 0; i < next.length; i++) {
        const p = next[i];
        if (changeDir && Math.random() < 0.35) {
          p.vx = (Math.random() > 0.5 ? 1 : -1) * randRange(0.3, 0.8);
          p.vy = (Math.random() > 0.5 ? 1 : -1) * randRange(0.15, 0.4);
        }
        let nx = p.x + p.vx * (dt / 40);
        let ny = p.y + p.vy * (dt / 40);
        if (nx < 8) { nx = 8; p.vx = Math.abs(p.vx); }
        if (nx > 92) { nx = 92; p.vx = -Math.abs(p.vx); }
        if (ny < 40) { ny = 40; p.vy = Math.abs(p.vy); }
        if (ny > 88) { ny = 88; p.vy = -Math.abs(p.vy); }
        for (let j = 0; j < next.length; j++) {
          if (i === j) continue;
          const other = next[j];
          if (rectsOverlap({ x: nx, y: ny }, other, CARD_W + 1)) {
            const dx = nx - other.x;
            const dy = ny - other.y;
            if (Math.abs(dx) > Math.abs(dy)) {
              p.vx = dx >= 0 ? Math.abs(p.vx) : -Math.abs(p.vx);
              nx += Math.sign(dx || 1) * 0.3;
            } else {
              p.vy = dy >= 0 ? Math.abs(p.vy) : -Math.abs(p.vy);
              ny += Math.sign(dy || 1) * 0.3;
            }
          }
        }
        p.x = nx;
        p.y = ny;
        if (p.showHeart) {
          p.heartTimer -= dt;
          if (p.heartTimer <= 0) p.showHeart = false;
        }
      }
      return next;
    });

    setMyPetPos(prevPos => {
      let { vx, vy } = myPetV;
      let nx = prevPos.x + vx * (dt / 40);
      let ny = prevPos.y + vy * (dt / 40);
      let shouldBounce = false;
      if (nx < 10 || nx > 90) { shouldBounce = true; nx = Math.max(10, Math.min(90, nx)); }
      if (ny < 55 || ny > 85) { shouldBounce = true; ny = Math.max(55, Math.min(85, ny)); }
      if (shouldBounce && Math.random() < 0.5) {
        myPetV.vx = -myPetV.vx * (0.8 + Math.random() * 0.4);
        myPetV.vy = -myPetV.vy * (0.8 + Math.random() * 0.4);
      }
      if (changeDir && Math.random() < 0.15) {
        myPetV.vx = (Math.random() - 0.5) * 1.2;
        myPetV.vy = (Math.random() - 0.5) * 0.6;
      }
      if (dirChangeTimer.current > 2200) dirChangeTimer.current = 0;
      return { x: nx, y: ny };
    });

    rafRef.current = requestAnimationFrame(tick);
  }, [myPetV]);

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
            background: 'linear-gradient(180deg,#81D4FA 0%, #B3E5FC 30%, #A5D6A7 55%, #81C784 85%, #66BB6A 100%)',
            boxShadow: 'var(--shadow-float)',
            border: '3px solid rgba(255,255,255,0.8)',
          }}
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '35%',
            background: 'linear-gradient(180deg,#4FC3F7,#B3E5FC)',
          }} />
          <div style={{ position: 'absolute', left: '8%', top: '8%', fontSize: 48, opacity: 0.9 }}>☀️</div>
          <div style={{ position: 'absolute', left: '30%', top: '14%', fontSize: 36, opacity: 0.85 }}>☁️</div>
          <div style={{ position: 'absolute', right: '20%', top: '6%', fontSize: 40, opacity: 0.8 }}>☁️</div>
          <div style={{ position: 'absolute', right: '5%', top: '18%', fontSize: 30, opacity: 0.75 }}>☁️</div>
          <div style={{ position: 'absolute', right: '35%', top: '22%', fontSize: 26, opacity: 0.7 }}>🐦</div>

          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
            background: 'linear-gradient(180deg,#A5D6A7 0%, #81C784 40%, #66BB6A 100%)',
          }} />

          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <defs>
              <pattern id="grass" x="0" y="0" width="30" height="12" patternUnits="userSpaceOnUse">
                <path d="M0 12 Q4 6 6 12 Q10 4 12 12 Q16 7 18 12 Q22 5 24 12 Q28 8 30 12" fill="none" stroke="#4CAF50" strokeWidth="1.2" opacity="0.35" />
              </pattern>
            </defs>
            <rect x="0" y="45%" width="100%" height="55%" fill="url(#grass)" />
          </svg>

          <div style={{ position: 'absolute', left: '2%', bottom: '28%', fontSize: 72, filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.25))' }}>🌳</div>
          <div style={{ position: 'absolute', right: '4%', bottom: '32%', fontSize: 66, filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.25))' }}>🌲</div>
          <div style={{ position: 'absolute', left: '25%', bottom: '35%', fontSize: 54, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.2))' }}>🌴</div>
          <div style={{ position: 'absolute', right: '30%', bottom: '38%', fontSize: 48, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.2))' }}>🌳</div>

          <div style={{ position: 'absolute', left: '55%', bottom: '18%', fontSize: 56, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.2))' }}>🪑</div>
          <div style={{ position: 'absolute', left: '15%', bottom: '12%', fontSize: 46, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.2))' }}>💐</div>
          <div style={{ position: 'absolute', right: '12%', bottom: '10%', fontSize: 42, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.2))' }}>🌷</div>
          <div style={{ position: 'absolute', left: '45%', bottom: '8%', fontSize: 30, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' }}>🦋</div>

          {loading ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#2E7D32', fontWeight: 700 }}>
              加载广场小伙伴中...
            </div>
          ) : (
            <>
              {squarePets.map(sp => (
                <SquarePet
                  key={sp.id}
                  pet={sp}
                  x={sp.x}
                  y={sp.y}
                  size={72}
                  showHeart={sp.showHeart}
                  onClick={() => handleClickPet(sp)}
                />
              ))}

              {pet && (
                <div
                  onClick={() => { sfx.click(); navigate('/room'); }}
                  style={{
                    position: 'absolute',
                    left: `${myPetPos.x}%`,
                    top: `${myPetPos.y}%`,
                    transform: 'translate(-50%, -100%)',
                    cursor: 'pointer',
                    transition: 'left 0.18s linear, top 0.18s linear',
                    zIndex: Math.floor(myPetPos.y) + 1,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg,#FFD54F,#FF9800)',
                    color: '#fff',
                    padding: '2px 10px', borderRadius: 999,
                    fontSize: 10, fontWeight: 800, whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(255,152,0,0.5)',
                    border: '1.5px solid rgba(255,255,255,0.6)',
                    animation: 'bob 1.2s ease-in-out infinite',
                  }}>🏷️ 我的宝贝</div>
                  <SquarePet pet={pet} x={50} y={100} size={86} onClick={() => {}} />
                </div>
              )}
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
    </div>
  );
};

export default SocialSquare;
