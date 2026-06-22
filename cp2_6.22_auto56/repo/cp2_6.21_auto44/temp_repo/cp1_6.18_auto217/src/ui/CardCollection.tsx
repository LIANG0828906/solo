import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Card, Rarity } from '../types/game';
import { useGameStore } from '../store/gameStore';
import { getCardStats, upgradeCost } from '../data/cards';

const rarityColors: Record<Rarity, { bg: string; border: string; glow: string; label: string }> = {
  gold: { bg: 'rgba(255, 215, 0, 0.15)', border: '#FFD700', glow: '0 0 10px #FFD700', label: '金' },
  purple: { bg: 'rgba(156, 39, 176, 0.15)', border: '#9C27B0', glow: '0 0 8px #9C27B0', label: '紫' },
  blue: { bg: 'rgba(33, 150, 243, 0.15)', border: '#2196F3', glow: '0 0 6px #2196F3', label: '蓝' },
  green: { bg: 'rgba(76, 175, 80, 0.15)', border: '#4CAF50', glow: '0 0 4px #4CAF50', label: '绿' },
};

const elementColors: Record<string, string> = {
  fire: '#FF4500',
  water: '#1E90FF',
  wind: '#32CD32',
  earth: '#8B4513',
};

interface DraggingCard {
  card: Card;
  x: number;
  y: number;
}

const SmallCard: React.FC<{
  card: Card;
  size?: 'normal' | 'small';
  onClick?: () => void;
  onDragStart?: (e: React.MouseEvent) => void;
  draggable?: boolean;
  inTeam?: boolean;
}> = ({ card, size = 'normal', onClick, onDragStart, draggable, inTeam }) => {
  const stats = getCardStats(card);
  const rarity = rarityColors[card.rarity];
  const isUpgraded = card.level > 1;
  const width = size === 'small' ? 56 : 80;
  const height = size === 'small' ? 77 : 110;

  return (
    <div
      onClick={onClick}
      onMouseDown={onDragStart}
      style={{
        width,
        height,
        borderRadius: 8,
        background: isUpgraded
          ? `linear-gradient(135deg, ${rarity.border}40 0%, #FF8C0040 100%), #0B0C10`
          : rarity.bg,
        border: `2px solid ${rarity.border}`,
        boxShadow: rarity.glow,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: size === 'small' ? 3 : 6,
        cursor: onClick || draggable ? 'pointer' : 'default',
        position: 'relative',
        userSelect: 'none',
        opacity: inTeam ? 0.5 : 1,
        transition: 'transform 0.15s ease',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: 2,
          fontSize: 9,
          color: rarity.border,
          fontWeight: 'bold',
          textShadow: `0 0 4px ${rarity.border}`,
        }}
      >
        {rarity.label}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 2,
          right: 2,
          fontSize: 9,
          color: '#FFD700',
          fontWeight: 'bold',
        }}
      >
        Lv.{card.level}
      </div>
      <div style={{ fontSize: size === 'small' ? 20 : 30, marginTop: 8 }}>{card.avatar}</div>
      <div
        style={{
          fontSize: size === 'small' ? 10 : 12,
          color: '#fff',
          fontWeight: 600,
          textAlign: 'center',
          lineHeight: 1.2,
        }}
      >
        {card.name}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 4,
          fontSize: size === 'small' ? 8 : 10,
          width: '100%',
          justifyContent: 'space-around',
        }}
      >
        <span style={{ color: '#FF6B6B' }}>⚔{stats.attack}</span>
        <span style={{ color: '#4ECDC4' }}>🛡{stats.defense}</span>
      </div>
    </div>
  );
};

export const CardCollection: React.FC = () => {
  const {
    ownedCards,
    teamSlots,
    playerGold,
    selectedCard,
    selectCard,
    addToTeam,
    removeFromTeam,
    upgradeCard,
    setCurrentView,
  } = useGameStore();

  const [dragging, setDragging] = useState<DraggingCard | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [snappingSlot, setSnappingSlot] = useState<number | null>(null);
  const [showFullTeam, setShowFullTeam] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const sortedCards = useMemo(() => {
    const order: Rarity[] = ['gold', 'purple', 'blue', 'green'];
    return [...ownedCards].sort(
      (a, b) => order.indexOf(a.rarity) - order.indexOf(b.rarity)
    );
  }, [ownedCards]);

  const isCardInTeam = useCallback(
    (cardId: string) => teamSlots.some((c) => c !== null && c.id === cardId),
    [teamSlots]
  );

  const handleDragStart = useCallback((e: React.MouseEvent, card: Card) => {
    if (isCardInTeam(card.id)) return;
    e.preventDefault();
    setDragging({ card, x: e.clientX, y: e.clientY });
  }, [isCardInTeam]);

  React.useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setDragging((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (dragging && containerRef.current) {
        const slots = containerRef.current.querySelectorAll<HTMLElement>('[data-slot-index]');
        let dropped = false;
        slots.forEach((slot) => {
          const rect = slot.getBoundingClientRect();
          if (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
          ) {
            const index = parseInt(slot.dataset.slotIndex || '-1', 10);
            if (index >= 0 && teamSlots[index] === null) {
              const success = addToTeam(dragging.card, index);
              if (success) {
                setSnappingSlot(index);
                setTimeout(() => setSnappingSlot(null), 300);
                dropped = true;
              }
            } else if (index >= 0 && teamSlots[index] !== null) {
              setShowFullTeam(true);
              setTimeout(() => setShowFullTeam(false), 2000);
            }
          }
        });
        if (!dropped && teamSlots.filter(s => s === null).length === 0) {
          const hasEmpty = teamSlots.some(s => s === null);
          if (!hasEmpty) {
            const inTeam = teamSlots.some(c => c?.id === dragging.card.id);
            if (!inTeam) {
              const success = addToTeam(dragging.card);
              if (!success) {
                setShowFullTeam(true);
                setTimeout(() => setShowFullTeam(false), 2000);
              }
            }
          }
        }
      }
      setDragging(null);
      setHoveredSlot(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, teamSlots, addToTeam]);

  const canStartBattle = teamSlots.filter((s) => s !== null).length >= 1;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        padding: 20,
        gap: 20,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h1
            style={{
              fontSize: 28,
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #FFD700, #FF6B00)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ⚔️ 像素封神榜
          </h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                background: 'rgba(255, 215, 0, 0.15)',
                border: '1px solid #FFD700',
                borderRadius: 20,
                padding: '6px 16px',
                color: '#FFD700',
                fontWeight: 'bold',
              }}
            >
              💰 {playerGold}
            </div>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: 10,
          }}
          className="custom-scrollbar"
        >
          <h3 style={{ marginBottom: 12, color: '#66FCF1' }}>📚 卡牌收藏</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: 12,
            }}
          >
            {sortedCards.map((card) => (
              <div key={card.id} style={{ justifySelf: 'center' }}>
                <SmallCard
                  card={card}
                  onClick={() => selectCard(card)}
                  onDragStart={(e) => handleDragStart(e, card)}
                  draggable={!isCardInTeam(card.id)}
                  inTeam={isCardInTeam(card.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          width: 380,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 16,
            padding: 16,
            border: '1px solid rgba(102, 252, 241, 0.2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ color: '#66FCF1' }}>🎯 战斗队伍 (3×3)</h3>
            <span style={{ fontSize: 12, color: '#888' }}>
              {teamSlots.filter((s) => s !== null).length}/9
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              position: 'relative',
            }}
          >
            {teamSlots.map((card, index) => (
              <div
                key={index}
                data-slot-index={index}
                onMouseEnter={() => dragging && card === null && setHoveredSlot(index)}
                onMouseLeave={() => setHoveredSlot(null)}
                style={{
                  aspectRatio: '80 / 110',
                  borderRadius: 8,
                  border: `2px dashed ${hoveredSlot === index ? '#66FCF1' : 'rgba(102, 252, 241, 0.2)'}`,
                  background: hoveredSlot === index
                    ? 'rgba(102, 252, 241, 0.1)'
                    : 'rgba(255, 255, 255, 0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 80,
                  transition: 'all 0.2s ease',
                }}
              >
                {card ? (
                  <div
                    className={snappingSlot === index ? 'card-snap-in' : ''}
                    onClick={() => removeFromTeam(index)}
                    style={{ cursor: 'pointer' }}
                  >
                    <SmallCard card={card} size="small" />
                  </div>
                ) : (
                  <span style={{ fontSize: 24, color: 'rgba(102, 252, 241, 0.3)' }}>+</span>
                )}
              </div>
            ))}
          </div>
          {showFullTeam && (
            <div
              style={{
                marginTop: 8,
                padding: 8,
                background: 'rgba(255, 107, 107, 0.2)',
                border: '1px solid #FF6B6B',
                borderRadius: 8,
                color: '#FF6B6B',
                fontSize: 12,
                textAlign: 'center',
              }}
            >
              ⚠️ 队伍已满或该卡牌已在队伍中
            </div>
          )}
        </div>

        <button
          disabled={!canStartBattle}
          onClick={() => setCurrentView('battle')}
          style={{
            padding: '14px 24px',
            borderRadius: 12,
            background: canStartBattle
              ? 'linear-gradient(135deg, #66FCF1 0%, #45A29E 100%)'
              : 'rgba(255,255,255,0.05)',
            color: canStartBattle ? '#0B0C10' : '#666',
            fontSize: 16,
            fontWeight: 'bold',
            boxShadow: canStartBattle ? '0 0 20px rgba(102, 252, 241, 0.4)' : 'none',
          }}
        >
          ⚔️ 开始战斗
        </button>

        <div
          style={{
            padding: 12,
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 8,
            fontSize: 12,
            color: '#888',
            lineHeight: 1.6,
          }}
        >
          💡 提示：拖拽卡牌到上方槽位组建队伍，点击卡牌查看详情和升级，点击队伍中卡牌移除。
        </div>
      </div>

      {selectedCard && <CardDetailModal />}

      {dragging && (
        <div
          style={{
            position: 'fixed',
            left: dragging.x - 40,
            top: dragging.y - 55,
            pointerEvents: 'none',
            zIndex: 9999,
            transform: 'rotate(5deg)',
            opacity: 0.85,
          }}
        >
          <SmallCard card={dragging.card} />
        </div>
      )}
    </div>
  );
};

const CardDetailModal: React.FC = () => {
  const { selectedCard, selectCard, upgradeCard, playerGold, addToTeam, teamSlots } = useGameStore();
  if (!selectedCard) return null;

  const stats = getCardStats(selectedCard);
  const rarity = rarityColors[selectedCard.rarity];
  const elementColor = elementColors[selectedCard.element];
  const cost = upgradeCost(selectedCard.level);
  const canUpgrade = selectedCard.level < selectedCard.maxLevel && playerGold >= cost;
  const inTeam = teamSlots.some((c) => c?.id === selectedCard.id);

  return (
    <div
      onClick={() => selectCard(null)}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-bounce-in"
        style={{
          display: 'flex',
          gap: 24,
          padding: 28,
          borderRadius: 20,
          background: 'rgba(11, 12, 16, 0.95)',
          border: '1px solid rgba(102, 252, 241, 0.3)',
          minWidth: 700,
          maxWidth: 800,
        }}
      >
        <div style={{ width: 200, flexShrink: 0 }}>
          <div
            style={{
              width: 180,
              height: 248,
              borderRadius: 12,
              background: selectedCard.level > 1
                ? `linear-gradient(135deg, ${rarity.border}60 0%, #FF8C0060 100%), #0B0C10`
                : rarity.bg,
              border: `3px solid ${rarity.border}`,
              boxShadow: rarity.glow,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
            }}
          >
            <div
              style={{
                position: 'absolute',
                fontSize: 14,
                color: rarity.border,
                fontWeight: 'bold',
                textShadow: `0 0 4px ${rarity.border}`,
                alignSelf: 'flex-start',
              }}
            >
              {rarity.label}色
            </div>
            <div
              style={{
                alignSelf: 'flex-end',
                fontSize: 14,
                color: '#FFD700',
                fontWeight: 'bold',
                background: 'rgba(0,0,0,0.5)',
                padding: '2px 8px',
                borderRadius: 10,
              }}
            >
              Lv.{selectedCard.level}/{selectedCard.maxLevel}
            </div>
            <div style={{ fontSize: 72 }}>{selectedCard.avatar}</div>
            <div style={{ fontSize: 20, color: '#fff', fontWeight: 'bold' }}>{selectedCard.name}</div>
            <div
              style={{
                display: 'flex',
                gap: 12,
                fontSize: 14,
                width: '100%',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: '#FF6B6B' }}>⚔ {stats.attack}</span>
              <span style={{ color: '#4ECDC4' }}>🛡 {stats.defense}</span>
              <span style={{ color: '#FF69B4' }}>❤ {stats.hp}</span>
            </div>
            <div style={{ fontSize: 12, color: '#888' }}>速度: {selectedCard.speed}</div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h2 style={{ color: '#fff', fontSize: 22 }}>{selectedCard.name}</h2>
            <div
              style={{
                display: 'flex',
                gap: 8,
              }}
            >
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 12,
                  background: `${elementColor}30`,
                  border: `1px solid ${elementColor}`,
                  color: elementColor,
                  fontSize: 12,
                }}
              >
                {selectedCard.element === 'fire' ? '🔥 火' :
                 selectedCard.element === 'water' ? '💧 水' :
                 selectedCard.element === 'wind' ? '🌪 风' : '⛰ 土'}
              </span>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 12,
                  background: `${rarity.border}30`,
                  border: `1px solid ${rarity.border}`,
                  color: rarity.border,
                  fontSize: 12,
                }}
              >
                {rarity.label}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {selectedCard.skills.map((skill, idx) => (
              <div
                key={idx}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 16, color: skill.type === 'active' ? '#FFD700' : '#66FCF1', fontWeight: 'bold' }}>
                    {skill.type === 'active' ? '⚡' : '✨'} {skill.name}
                  </span>
                  {skill.type === 'active' && (
                    <span style={{ fontSize: 11, color: '#888' }}>
                      消耗{skill.energyCost}能量 | 冷却{skill.cooldown}回合
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                  {skill.description}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 16,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginTop: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>升级强化</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                  每级提升 5% 攻击力 / 3% 防御力
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                {!inTeam && (
                  <button
                    onClick={() => addToTeam(selectedCard)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #66FCF1, #45A29E)',
                      color: '#0B0C10',
                      fontWeight: 'bold',
                      fontSize: 13,
                    }}
                  >
                    加入队伍
                  </button>
                )}
                <button
                  disabled={!canUpgrade}
                  onClick={() => upgradeCard(selectedCard.id)}
                  className="pulse-glow"
                  style={{
                    padding: '10px 20px',
                    borderRadius: 10,
                    background: selectedCard.level >= selectedCard.maxLevel
                      ? 'rgba(255,255,255,0.1)'
                      : canUpgrade
                        ? 'linear-gradient(135deg, #FFD700, #FF8C00)'
                        : 'rgba(255,255,255,0.1)',
                    color: selectedCard.level >= selectedCard.maxLevel ? '#666' : canUpgrade ? '#0B0C10' : '#666',
                    fontWeight: 'bold',
                    fontSize: 13,
                  }}
                >
                  {selectedCard.level >= selectedCard.maxLevel
                    ? '已满级'
                    : `升级 (${cost}💰)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
