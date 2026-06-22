import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Pet, User, adoptPet, feedPet, cleanPet, interactPet,
  savePetData, loadPetData,
} from '@/modules/petModule';

const PET_EMOJIS: Record<string, string> = { cat: '🐱', dog: '🐶', dragon: '🐉' };
const PET_LABELS: Record<string, string> = { cat: '小猫咪', dog: '小狗狗', dragon: '小火龙' };

const FOOD_ITEMS = [
  { type: 'premium', name: '高级粮', emoji: '🍖', value: 30 },
  { type: 'normal', name: '普通粮', emoji: '🍚', value: 20 },
  { type: 'treat', name: '小零食', emoji: '🧁', value: 15 },
];

function playWaterSound() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const makeDrop = (freq: number, start: number, dur: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, now + start);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.3, now + start + dur);
      gain.gain.setValueAtTime(vol, now + start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.start(now + start);
      osc.stop(now + start + dur);
    };
    makeDrop(800, 0, 0.15, 0.18);
    makeDrop(600, 0.08, 0.12, 0.14);
    makeDrop(1000, 0.18, 0.1, 0.10);
    makeDrop(500, 0.28, 0.14, 0.12);
    setTimeout(() => ctx.close(), 600);
  } catch { /* ignore */ }
}

function playPurrSound() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = 'sawtooth';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(80, now);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(26, now);
    osc.frequency.linearRampToValueAtTime(30, now + 0.5);
    osc.frequency.linearRampToValueAtTime(24, now + 1.0);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.3);
    gain.gain.linearRampToValueAtTime(0.001, now + 1.0);
    osc.start(now);
    osc.stop(now + 1.0);
    setTimeout(() => ctx.close(), 1200);
  } catch { /* ignore */ }
}

function addRipple(e: React.MouseEvent<HTMLButtonElement>) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
  ripple.style.top = e.clientY - rect.top - size / 2 + 'px';
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

function CircularProgress({ value, label, icon }: { value: number; label: string; icon: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const hue = (value / 100) * 120;
  const color = `hsl(${hue}, 75%, 50%)`;
  const prevRef = useRef(value);
  const [delta, setDelta] = useState(0);
  const [showDelta, setShowDelta] = useState(false);

  useEffect(() => {
    const diff = value - prevRef.current;
    if (Math.abs(diff) > 0.5) {
      setDelta(Math.round(diff * 10) / 10);
      setShowDelta(true);
      const timer = setTimeout(() => {
        setShowDelta(false);
        prevRef.current = value;
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: 84, height: 84 }}>
        <svg width="84" height="84" viewBox="0 0 84 84">
          <circle cx="42" cy="42" r={radius} fill="none" stroke="#f0f0f0" strokeWidth="6" />
          <circle
            cx="42" cy="42" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 42 42)"
            style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.8s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', textAlign: 'center',
        }}>
          <div style={{ fontSize: 18 }}>{icon}</div>
          <div style={{
            fontSize: 11, fontWeight: 700, color,
            transition: 'color 0.8s ease',
          }}>
            {Math.round(value)}%
          </div>
        </div>
        {showDelta && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            fontSize: 12, fontWeight: 700,
            color: delta > 0 ? '#4CAF50' : '#F44336',
            animation: 'numberFlip 0.5s ease',
            pointerEvents: 'none',
          }}>
            {delta > 0 ? `+${Math.round(delta)}` : Math.round(delta)}
          </div>
        )}
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-light)', fontWeight: 500 }}>{label}</span>
    </div>
  );
}

function HeartAnimation({ ids }: { ids: number[] }) {
  return (
    <>
      {ids.map((id) => (
        <div
          key={id}
          style={{
            position: 'absolute', top: -20, left: '50%',
            transform: `translateX(${(id % 5 - 2) * 22}px)`,
            fontSize: 22,
            animation: 'heartFloat 1.2s ease-out forwards',
            pointerEvents: 'none', zIndex: 10,
          }}
        >
          ❤️
        </div>
      ))}
    </>
  );
}

function SplashParticles({ items }: { items: { id: number; dx: number; dy: number }[] }) {
  return (
    <>
      {items.map((s) => (
        <div
          key={s.id}
          style={{
            position: 'absolute', top: '40%', left: '50%',
            width: 8, height: 8, borderRadius: '50%',
            background: '#4FC3F7',
            '--dx': `${s.dx}px`, '--dy': `${s.dy}px`,
            animation: 'splash 1.5s ease-out forwards',
            pointerEvents: 'none', zIndex: 10,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}

function PetSelection({ onSelect }: { onSelect: (type: 'cat' | 'dog' | 'dragon') => void }) {
  const [selected, setSelected] = useState<'cat' | 'dog' | 'dragon' | null>(null);
  const types: Array<'cat' | 'dog' | 'dragon'> = ['cat', 'dog', 'dragon'];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: 'calc(100vh - 48px)',
      animation: 'fadeIn 0.5s ease',
    }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--mint-dark)', marginBottom: 8 }}>
        🐾 选择你的宠物
      </h1>
      <p style={{ color: 'var(--text-light)', marginBottom: 28, fontSize: 15 }}>
        选一只小伙伴开始你的养成之旅吧！
      </p>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        {types.map((type) => (
          <div
            key={type}
            onClick={() => setSelected(type)}
            style={{ width: 150, height: 190, perspective: '800px', cursor: 'pointer' }}
          >
            <div style={{
              width: '100%', height: '100%',
              background: selected === type ? 'var(--mint-light)' : 'var(--white)',
              borderRadius: 'var(--radius)',
              boxShadow: selected === type ? 'var(--shadow-hover)' : 'var(--shadow)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'all 0.3s ease',
              border: selected === type ? '2.5px solid var(--mint-dark)' : '2.5px solid transparent',
              transformStyle: 'preserve-3d',
              animation: 'rotate3d 8s linear infinite',
            }}>
              <div style={{ fontSize: 52, animation: 'float 3s ease-in-out infinite' }}>
                {PET_EMOJIS[type]}
              </div>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>
                {PET_LABELS[type]}
              </div>
            </div>
          </div>
        ))}
      </div>
      {selected && (
        <button
          className="btn"
          onClick={(e) => { addRipple(e); onSelect(selected); }}
          style={{
            marginTop: 28, padding: '13px 36px', fontSize: 16,
            animation: 'fadeInUp 0.3s ease',
          }}
        >
          领养 {PET_LABELS[selected]} 🎉
        </button>
      )}
    </div>
  );
}

function PetRoom({ pet, user, onFeed, onClean, onInteract }: {
  pet: Pet;
  user: User;
  onFeed: (foodType: string) => void;
  onClean: () => void;
  onInteract: () => void;
}) {
  const [hearts, setHearts] = useState<number[]>([]);
  const [splashes, setSplashes] = useState<{ id: number; dx: number; dy: number }[]>([]);
  const [isRubbing, setIsRubbing] = useState(false);
  const [showFoodMenu, setShowFoodMenu] = useState(false);
  const [justAppeared, setJustAppeared] = useState(true);
  const heartId = useRef(0);
  const splashId = useRef(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setJustAppeared(false), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!showFoodMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowFoodMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFoodMenu]);

  const handleFeedClick = (foodType: string) => {
    const newHearts = Array.from({ length: 5 }, () => heartId.current++);
    setHearts(newHearts);
    setTimeout(() => setHearts([]), 1300);
    onFeed(foodType);
    setShowFoodMenu(false);
  };

  const handleCleanClick = () => {
    const newSplashes = Array.from({ length: 14 }, () => ({
      id: splashId.current++,
      dx: (Math.random() - 0.5) * 140,
      dy: -(Math.random() * 90 + 30),
    }));
    setSplashes(newSplashes);
    setTimeout(() => setSplashes([]), 2000);
    playWaterSound();
    onClean();
  };

  const handleInteractClick = () => {
    setIsRubbing(true);
    setTimeout(() => setIsRubbing(false), 1200);
    playPurrSound();
    onInteract();
  };

  const getMood = () => {
    if (pet.happiness > 70) return '😊';
    if (pet.happiness > 40) return '🙂';
    return '😢';
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="card" style={{
        position: 'relative', height: 320, overflow: 'hidden',
        padding: 0, borderRadius: 'var(--radius)',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 40%, #E0F7FA 68%, #A8D5A2 68%, #7BC67E 100%)',
        }} />
        <div style={{
          position: 'absolute', top: 25, left: '12%',
          width: 55, height: 22, background: 'rgba(255,255,255,0.8)',
          borderRadius: 18, animation: 'float 6s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: 45, right: '18%',
          width: 70, height: 26, background: 'rgba(255,255,255,0.7)',
          borderRadius: 20, animation: 'float 8s ease-in-out infinite 2s',
        }} />
        <div style={{
          position: 'absolute', top: 18, right: 35,
          width: 44, height: 44,
          background: 'radial-gradient(circle, #FFE082, #FFD54F)',
          borderRadius: '50%',
          boxShadow: '0 0 18px rgba(255,213,79,0.5)',
          animation: 'float 5s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: 75, left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center', zIndex: 5,
          animation: justAppeared
            ? 'petAppear 0.8s ease forwards'
            : isRubbing
              ? 'rubAnimation 1.2s ease'
              : 'float 3s ease-in-out infinite',
        }}>
          <div style={{
            position: 'absolute', bottom: -10, left: '50%',
            transform: 'translateX(-50%)',
            width: 56, height: 10, background: 'rgba(0,0,0,0.12)',
            borderRadius: '50%', filter: 'blur(3px)',
          }} />
          <div style={{ fontSize: 68, position: 'relative' }}>
            {PET_EMOJIS[pet.type]}
          </div>
          <div style={{
            fontSize: 13, fontWeight: 600,
            background: 'rgba(255,255,255,0.9)',
            padding: '2px 10px', borderRadius: 10, marginTop: 4,
            display: 'inline-block',
          }}>
            {pet.name} {getMood()}
          </div>
          <HeartAnimation ids={hearts} />
          <SplashParticles items={splashes} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 14, padding: '18px 20px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-around',
          alignItems: 'center', flexWrap: 'wrap', gap: 14,
        }}>
          <CircularProgress value={pet.hunger} label="饥饿度" icon="🍖" />
          <CircularProgress value={pet.cleanliness} label="清洁度" icon="🛁" />
          <CircularProgress value={pet.happiness} label="快乐度" icon="😄" />
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 10, marginTop: 14,
        justifyContent: 'center', flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative' }}>
          <button
            className="btn"
            onClick={(e) => { addRipple(e); setShowFoodMenu(!showFoodMenu); }}
            style={{ padding: '11px 22px', fontSize: 15 }}
          >
            🍖 喂食
          </button>
          {showFoodMenu && (
            <div
              ref={menuRef}
              style={{
                position: 'absolute', bottom: '100%', left: '50%',
                transform: 'translateX(-50%)', marginBottom: 8,
                background: 'var(--white)', borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow-hover)', padding: 10,
                display: 'flex', flexDirection: 'column', gap: 6,
                animation: 'menuBounceIn 0.4s ease',
                zIndex: 20, minWidth: 150,
              }}
            >
              {FOOD_ITEMS.map((food) => (
                <button
                  key={food.type}
                  className="btn btn-secondary"
                  onClick={() => handleFeedClick(food.type)}
                  style={{ justifyContent: 'flex-start', width: '100%', fontSize: 13 }}
                >
                  {food.emoji} {food.name}
                  <span style={{ color: '#4CAF50', marginLeft: 'auto', fontWeight: 600 }}>
                    +{food.value}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className="btn"
          onClick={(e) => { addRipple(e); handleCleanClick(); }}
          style={{ padding: '11px 22px', fontSize: 15 }}
        >
          🛁 清洁
        </button>
        <button
          className="btn"
          onClick={(e) => { addRipple(e); handleInteractClick(); }}
          style={{ padding: '11px 22px', fontSize: 15 }}
        >
          ✋ 抚摸
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [pet, setPet] = useState<Pet | null>(null);

  useEffect(() => {
    const { user: u, pet: p } = loadPetData();
    if (u && p) { setUser(u); setPet(p); }
  }, []);

  useEffect(() => {
    if (!pet || !user) return;
    const interval = setInterval(() => {
      setPet((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          hunger: Math.max(0, prev.hunger - 1 / 30),
          cleanliness: Math.max(0, prev.cleanliness - 1 / 60),
          happiness: Math.max(0, prev.happiness - 1 / 600),
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pet !== null, user !== null]);

  const updateAndSave = useCallback((updated: Pet) => {
    setPet(updated);
    if (user) savePetData(user, updated);
  }, [user]);

  const handleAdopt = useCallback(async (type: 'cat' | 'dog' | 'dragon') => {
    const result = await adoptPet(type, '主人', PET_LABELS[type]);
    setUser(result.user);
    setPet(result.pet);
    savePetData(result.user, result.pet);
  }, []);

  const handleFeed = useCallback(async (foodType: string) => {
    if (!pet) return;
    const updated = await feedPet(pet.id, foodType);
    updateAndSave(updated);
  }, [pet, updateAndSave]);

  const handleClean = useCallback(async () => {
    if (!pet) return;
    const updated = await cleanPet(pet.id);
    updateAndSave(updated);
  }, [pet, updateAndSave]);

  const handleInteract = useCallback(async () => {
    if (!pet) return;
    const updated = await interactPet(pet.id);
    updateAndSave(updated);
  }, [pet, updateAndSave]);

  if (!pet || !user) {
    return <PetSelection onSelect={handleAdopt} />;
  }

  return (
    <PetRoom
      pet={pet} user={user}
      onFeed={handleFeed} onClean={handleClean} onInteract={handleInteract}
    />
  );
}
