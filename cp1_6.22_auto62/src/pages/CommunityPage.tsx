import React, { useState, useEffect, useRef, useCallback } from 'react';
import { OnlinePet, getOnlinePets, sendGift } from '@/modules/communityModule';
import { Pet, loadPetData } from '@/modules/petModule';

const PET_EMOJIS: Record<string, string> = { cat: '🐱', dog: '🐶', dragon: '🐉' };

const GIFTS = [
  { type: 'bone', name: '骨头', emoji: '🦴' },
  { type: 'fish', name: '小鱼', emoji: '🐟' },
  { type: 'star', name: '星星', emoji: '⭐' },
];

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

function PetCardPopup({ pet, onClose, onGift }: {
  pet: OnlinePet;
  onClose: () => void;
  onGift: (pet: OnlinePet) => void;
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
        zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--white)', borderRadius: 'var(--radius) var(--radius) 0 0',
          padding: '24px 24px 32px', width: '100%', maxWidth: 420,
          animation: 'slideUp 0.35s cubic-bezier(0.22,1,0.36,1)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          width: 40, height: 4, background: '#ddd', borderRadius: 2,
          margin: '0 auto 16px',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 52, animation: 'float 3s ease-in-out infinite' }}>
            {PET_EMOJIS[pet.type]}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{pet.name}</div>
            <div style={{ color: 'var(--text-light)', fontSize: 14, marginTop: 2 }}>
              主人: {pet.ownerName}
            </div>
            <div style={{ fontSize: 26, marginTop: 4 }}>心情: {pet.mood}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn"
            onClick={(e) => { addRipple(e); onGift(pet); }}
            style={{ flex: 1, padding: '12px 0' }}
          >
            🎁 赠送礼物
          </button>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ flex: 1, padding: '12px 0' }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

function GiftPanel({ onSelect, onClose }: {
  onSelect: (giftType: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
        zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--white)', borderRadius: 'var(--radius)',
          padding: 24, animation: 'menuBounceIn 0.4s ease',
          boxShadow: 'var(--shadow-hover)', maxWidth: 320, width: '90%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{
          textAlign: 'center', marginBottom: 18,
          color: 'var(--mint-dark)', fontSize: 17,
        }}>
          选择礼物 🎁
        </h3>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {GIFTS.map((gift) => (
            <button
              key={gift.type}
              className="btn btn-secondary"
              onClick={(e) => { addRipple(e); onSelect(gift.type); }}
              style={{ flexDirection: 'column', padding: '14px 18px', gap: 6 }}
            >
              <span style={{ fontSize: 30 }}>{gift.emoji}</span>
              <span style={{ fontSize: 12 }}>{gift.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FlyingGift({ emoji, from, to, onComplete }: {
  emoji: string;
  from: DOMRect | null;
  to: DOMRect | null;
  onComplete: () => void;
}) {
  const doneRef = useRef(false);
  useEffect(() => {
    if (!from || !to) { onComplete(); }
  }, [from, to, onComplete]);

  if (!from || !to) return null;

  const tx = to.left + to.width / 2 - (from.left + from.width / 2);
  const ty = to.top + to.height / 2 - (from.top + from.height / 2);

  const particles = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const dist = 15 + Math.random() * 10;
    return { ox: Math.cos(angle) * dist, oy: Math.sin(angle) * dist, delay: i * 0.08 };
  });

  return (
    <>
      <div style={{
        position: 'fixed',
        left: from.left + from.width / 2 - 18,
        top: from.top + from.height / 2 - 18,
        fontSize: 36, zIndex: 100, pointerEvents: 'none',
        '--tx': `${tx}px`, '--ty': `${ty}px`,
        animation: 'giftFly 1s ease-in-out forwards',
      } as React.CSSProperties}
        onAnimationEnd={() => { if (!doneRef.current) { doneRef.current = true; onComplete(); } }}
      >
        {emoji}
      </div>
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'fixed',
            left: from.left + from.width / 2 + p.ox - 3,
            top: from.top + from.height / 2 + p.oy - 3,
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--mint)', zIndex: 99, pointerEvents: 'none',
            animation: `particleTrail 0.6s ease-out ${p.delay}s forwards`,
          }}
        />
      ))}
    </>
  );
}

function Notification({ message, onDone }: { message: string; onDone: () => void }) {
  const [exiting, setExiting] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDone, 300);
    }, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', top: 20, left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--mint)', color: 'var(--white)',
      padding: '12px 24px', borderRadius: 'var(--radius-sm)',
      boxShadow: 'var(--shadow-hover)', fontWeight: 600, fontSize: 14,
      zIndex: 200,
      animation: exiting ? 'notifyOut 0.3s ease forwards' : 'notifyIn 0.3s ease',
    }}>
      {message}
    </div>
  );
}

function VirtualPetList({ pets, onPetClick }: {
  pets: OnlinePet[];
  onPetClick: (pet: OnlinePet) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewHeight, setViewHeight] = useState(600);

  const ITEM_H = 100;
  const GAP = 10;
  const ROW_H = ITEM_H + GAP;
  const totalH = pets.length * ROW_H;
  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_H) - 1);
  const visibleCount = Math.ceil(viewHeight / ROW_H) + 3;
  const endIdx = Math.min(startIdx + visibleCount, pets.length);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setViewHeight(entries[0].contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={() => { if (containerRef.current) setScrollTop(containerRef.current.scrollTop); }}
      style={{ overflowY: 'auto', maxHeight: viewHeight, position: 'relative' }}
    >
      <div style={{ height: totalH, position: 'relative' }}>
        {pets.slice(startIdx, endIdx).map((pet, i) => {
          const idx = startIdx + i;
          return (
            <div
              key={pet.id}
              data-pet-id={pet.id}
              onClick={() => onPetClick(pet)}
              style={{
                position: 'absolute', top: idx * ROW_H, left: 0, right: 0,
                height: ITEM_H,
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 18px',
                background: 'var(--white)', borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow)', cursor: 'pointer',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = 'var(--shadow)';
              }}
            >
              <div style={{
                fontSize: 38,
                animation: 'petWalk 1.5s ease-in-out infinite',
              }}>
                {PET_EMOJIS[pet.type]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{pet.name}</div>
                <div style={{ color: 'var(--text-light)', fontSize: 13 }}>
                  主人: {pet.ownerName}
                </div>
              </div>
              <div style={{ fontSize: 24 }}>{pet.mood}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const [pets, setPets] = useState<OnlinePet[]>([]);
  const [selectedPet, setSelectedPet] = useState<OnlinePet | null>(null);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [giftTarget, setGiftTarget] = useState<OnlinePet | null>(null);
  const [flyingGift, setFlyingGift] = useState<{
    emoji: string; from: DOMRect | null; to: DOMRect | null;
  } | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [myPet, setMyPet] = useState<Pet | null>(null);

  useEffect(() => {
    const { pet } = loadPetData();
    setMyPet(pet);
  }, []);

  const fetchPets = useCallback(async () => {
    try {
      const data = await getOnlinePets();
      setPets(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchPets();
    const interval = setInterval(fetchPets, 30000);
    return () => clearInterval(interval);
  }, [fetchPets]);

  const addNotif = useCallback((msg: string) => {
    setNotifications((prev) => [...prev, msg]);
  }, []);

  const removeNotif = useCallback(() => {
    setNotifications((prev) => prev.slice(1));
  }, []);

  const handlePetClick = useCallback((pet: OnlinePet) => {
    setSelectedPet(pet);
  }, []);

  const handleGiftClick = useCallback((pet: OnlinePet) => {
    setGiftTarget(pet);
    setShowGiftPanel(true);
    setSelectedPet(null);
  }, []);

  const handleGiftSelect = useCallback(async (giftType: string) => {
    setShowGiftPanel(false);
    if (!myPet || !giftTarget) return;

    const giftEmoji = GIFTS.find((g) => g.type === giftType)?.emoji || '🎁';
    const giftName = GIFTS.find((g) => g.type === giftType)?.name || '礼物';

    const myPetEl = document.querySelector('[data-my-pet]');
    const targetEl = document.querySelector(`[data-pet-id="${giftTarget.id}"]`);
    const fromRect = myPetEl?.getBoundingClientRect() ?? null;
    const toRect = targetEl?.getBoundingClientRect() ?? null;

    setFlyingGift({ emoji: giftEmoji, from: fromRect, to: toRect });

    try {
      const result = await sendGift(myPet.id, giftTarget.id, giftType);
      if (result.success) {
        addNotif(`成功给 ${giftTarget.name} 赠送了${giftName}！`);
      }
    } catch { /* ignore */ }
    setGiftTarget(null);
  }, [myPet, giftTarget, addNotif]);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 16,
      }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--mint-dark)' }}>
          🏘️ 社区广场
        </h2>
        <button
          className="btn btn-secondary"
          onClick={fetchPets}
          style={{ fontSize: 13, padding: '8px 14px' }}
        >
          🔄 刷新
        </button>
      </div>

      {myPet && (
        <div
          data-my-pet
          className="card"
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', marginBottom: 16, cursor: 'default',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'none'; }}
        >
          <span style={{ fontSize: 32 }}>{PET_EMOJIS[myPet.type]}</span>
          <div>
            <div style={{ fontWeight: 600 }}>{myPet.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>我的宠物</div>
          </div>
        </div>
      )}

      <VirtualPetList pets={pets} onPetClick={handlePetClick} />

      {selectedPet && (
        <PetCardPopup
          pet={selectedPet}
          onClose={() => setSelectedPet(null)}
          onGift={handleGiftClick}
        />
      )}

      {showGiftPanel && (
        <GiftPanel
          onSelect={handleGiftSelect}
          onClose={() => { setShowGiftPanel(false); setGiftTarget(null); }}
        />
      )}

      {flyingGift && (
        <FlyingGift
          emoji={flyingGift.emoji}
          from={flyingGift.from}
          to={flyingGift.to}
          onComplete={() => setFlyingGift(null)}
        />
      )}

      {notifications.map((msg, i) => (
        <Notification key={`${i}-${msg}`} message={msg} onDone={removeNotif} />
      ))}
    </div>
  );
}
