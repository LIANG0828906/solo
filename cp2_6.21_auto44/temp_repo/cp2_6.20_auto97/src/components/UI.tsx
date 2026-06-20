import React, { useState, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  ChestType,
  OpenMethod,
  ElementType,
  Inscription,
  Fragment,
} from '../api/treasureApi';

const ELEMENT_INFO: Record<ElementType, { name: string; color: string; icon: string }> = {
  fire: { name: '烈焰', color: '#FF4500', icon: '🔥' },
  ice: { name: '寒冰', color: '#00CED1', icon: '❄️' },
  thunder: { name: '雷霆', color: '#FFD700', icon: '⚡' },
  shadow: { name: '暗影', color: '#8A2BE2', icon: '🌑' },
  holy: { name: '圣光', color: '#FFD700', icon: '✨' },
};

const CHEST_INFO: Record<ChestType, { name: string; description: string; icon: string }> = {
  iron_rune: { name: '铁质符文箱', description: '普通的铁制符文宝箱', icon: '📦' },
  crystal_seal: { name: '水晶封印匣', description: '被水晶封印的神秘宝箱', icon: '💎' },
  shadow_curse: { name: '暗影诅咒柜', description: '被黑暗诅咒笼罩的危险宝箱', icon: '🏴' },
};

const METHOD_INFO: Record<OpenMethod, { name: string; icon: string; color: string }> = {
  magic_resonance: { name: '魔法共鸣', icon: '⚡', color: '#9370DB' },
  mechanical_pick: { name: '机械撬锁', icon: '⚙️', color: '#DAA520' },
  element_infusion: { name: '元素注入', icon: '🌀', color: '#00CED1' },
};

const RARITY_COLORS: Record<string, string> = {
  common: '#9CA3AF',
  uncommon: '#10B981',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B',
};

const keyframes = `
  @keyframes glowLine {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.15); opacity: 0.8; }
  }
  @keyframes pulseRing {
    0%, 100% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.15); opacity: 0.4; }
  }
  @keyframes particleUp {
    0% { transform: translateY(0) scale(1); opacity: 1; }
    100% { transform: translateY(-100px) scale(0); opacity: 0; }
  }
  @keyframes particleDown {
    0% { transform: translateY(0) scale(1); opacity: 1; }
    100% { transform: translateY(100px) scale(0); opacity: 0; }
  }
  @keyframes dragHighlight {
    0%, 100% { box-shadow: 0 0 5px currentColor; }
    50% { box-shadow: 0 0 20px currentColor, 0 0 30px currentColor; }
  }
  @keyframes slotHighlight {
    0%, 100% { box-shadow: 0 0 5px currentColor; }
    50% { box-shadow: 0 0 30px currentColor, 0 0 40px currentColor; }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  @keyframes flyIn {
    from { opacity: 0; transform: scale(0.5); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes flyOut {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(0.5); }
  }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = keyframes;
document.head.appendChild(styleSheet);

const baseInteractiveStyle: React.CSSProperties = {
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  userSelect: 'none',
};

interface PlayerPanelProps {
  style?: React.CSSProperties;
}

export const PlayerPanel: React.FC<PlayerPanelProps> = ({ style }) => {
  const playerStats = useGameStore((s) => s.playerStats);
  const fragments = useGameStore((s) => s.fragments);
  const synthesizeInscription = useGameStore((s) => s.synthesizeInscription);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const hpPercent = (playerStats.hp / 100) * 100;
  const hpColor = hpPercent > 60 ? '#10B981' : hpPercent > 30 ? '#F59E0B' : '#EF4444';

  const handleSynthesize = (el: ElementType) => {
    const result = synthesizeInscription(el);
    if (result.success && result.inscription) {
      setToast({
        message: `✨ 合成成功！获得 ${result.inscription.name} Lv.${result.inscription.level}`,
        type: 'success',
      });
    } else {
      setToast({
        message: `❌ ${result.error || '合成失败，碎片不足'}`,
        type: 'error',
      });
    }
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div
      style={{
        background: 'rgba(30, 20, 50, 0.7)',
        border: '1px solid #3a2a5a',
        borderRadius: '12px',
        padding: '20px',
        color: '#d4c8f0',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        ...style,
      }}
    >
      {toast && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 'bold',
            color: '#fff',
            background: toast.type === 'success'
              ? 'linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))'
              : 'linear-gradient(135deg, rgba(239,68,68,0.95), rgba(220,38,38,0.95))',
            border: `1px solid ${toast.type === 'success' ? '#10B981' : '#EF4444'}`,
            boxShadow: toast.type === 'success'
              ? '0 4px 20px rgba(16,185,129,0.5)'
              : '0 4px 20px rgba(239,68,68,0.5)',
            animation: 'fadeIn 0.3s ease-out',
            whiteSpace: 'nowrap',
          }}
        >
          {toast.message}
        </div>
      )}
      <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#e8dff5', borderBottom: '1px solid #3a2a5a', paddingBottom: '10px' }}>
        🗡️ 冒险者状态
      </h2>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
          <span>❤️ 生命值</span>
          <span style={{ color: hpColor, fontWeight: 'bold' }}>{playerStats.hp}/100</span>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.5)', height: '14px', borderRadius: '7px', overflow: 'hidden', border: '1px solid #3a2a5a' }}>
          <div
            style={{
              width: `${hpPercent}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${hpColor}, ${hpColor}dd)`,
              transition: 'width 0.5s ease',
              boxShadow: `0 0 10px ${hpColor}66`,
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(60,40,100,0.3)', borderRadius: '8px' }}>
        <span style={{ fontSize: '14px' }}>⭐ 声望值</span>
        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#f0e68c' }}>{playerStats.reputation}</span>
      </div>

      <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(60,40,100,0.3)', borderRadius: '8px' }}>
        <div style={{ fontSize: '13px', marginBottom: '8px', color: '#a898c8' }}>📊 开箱统计</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
          <div>总次数: <span style={{ color: '#e8dff5', fontWeight: 'bold' }}>{playerStats.totalOpens}</span></div>
          <div>成功率: <span style={{ color: '#10B981', fontWeight: 'bold' }}>{playerStats.totalOpens > 0 ? Math.round((playerStats.successCount / playerStats.totalOpens) * 100) : 0}%</span></div>
          <div>成功: <span style={{ color: '#10B981' }}>{playerStats.successCount}</span></div>
          <div>失败: <span style={{ color: '#EF4444' }}>{playerStats.totalOpens - playerStats.successCount}</span></div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', marginBottom: '10px', color: '#a898c8' }}>💎 元素碎片</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {(Object.keys(ELEMENT_INFO) as ElementType[]).map((el) => {
            const count = fragments[el];
            const canSynthesize = count >= 5;
            return (
              <div
                key={el}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px',
                  background: `rgba(${hexToRgb(ELEMENT_INFO[el].color)}, 0.1)`,
                  borderRadius: '8px',
                  border: `1px solid ${ELEMENT_INFO[el].color}44`,
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${ELEMENT_INFO[el].color}, ${ELEMENT_INFO[el].color}66)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    boxShadow: `0 0 8px ${ELEMENT_INFO[el].color}66`,
                  }}
                >
                  {ELEMENT_INFO[el].icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: '#a898c8' }}>{ELEMENT_INFO[el].name}</div>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#e8dff5' }}>{count}</div>
                </div>
                {canSynthesize && (
                  <button
                    onClick={() => handleSynthesize(el)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = `0 0 10px ${ELEMENT_INFO[el].color}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    style={{
                      ...baseInteractiveStyle,
                      padding: '4px 8px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      borderRadius: '4px',
                      border: `1px solid ${ELEMENT_INFO[el].color}`,
                      background: `linear-gradient(135deg, ${ELEMENT_INFO[el].color}66, ${ELEMENT_INFO[el].color}33)`,
                      color: '#fff',
                      transition: 'all 0.2s ease',
                    }}
                    title="消耗5个碎片合成铭文"
                  >
                    合成
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <HistoryTimeline />
    </div>
  );
};

const HistoryTimeline: React.FC = () => {
  const history = useGameStore((s) => s.history);

  return (
    <div>
      <div style={{ fontSize: '14px', marginBottom: '10px', color: '#a898c8' }}>📜 历史记录</div>
      <div style={{ maxHeight: '180px', overflowY: 'auto', paddingRight: '5px' }}>
        {history.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#6b5a8a', textAlign: 'center', padding: '20px 0' }}>暂无开箱记录</div>
        ) : (
          history.slice(0, 10).map((record, idx) => (
            <div
              key={record.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px',
                marginBottom: '6px',
                background: record.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                borderRadius: '6px',
                borderLeft: `3px solid ${record.success ? '#10B981' : '#EF4444'}`,
                fontSize: '12px',
              }}
            >
              <span style={{ fontSize: '10px', color: '#6b5a8a' }}>#{history.length - idx}</span>
              <span>{CHEST_INFO[record.chestType]?.icon || '📦'}</span>
              <span style={{ flex: 1, color: '#c8b8e0' }}>{CHEST_INFO[record.chestType]?.name || record.chestType}</span>
              <span style={{ color: record.success ? '#10B981' : '#EF4444', fontWeight: 'bold' }}>
                {record.success ? `✓ +${record.rewardsCount}` : '✗'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '100, 100, 100';
}

interface ChestSelectorProps {
  style?: React.CSSProperties;
}

export const ChestSelector: React.FC<ChestSelectorProps> = ({ style }) => {
  const selectedChest = useGameStore((s) => s.selectedChest);
  const selectChest = useGameStore((s) => s.selectChest);

  return (
    <div
      style={{
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
        flexWrap: 'wrap',
        ...style,
      }}
    >
      {(Object.keys(CHEST_INFO) as ChestType[]).map((chest) => {
        const isSelected = selectedChest === chest;
        return (
          <button
            key={chest}
            onClick={() => selectChest(chest)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.color = '#f0e68c';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = isSelected ? 'translateY(-4px)' : 'translateY(0)';
              e.currentTarget.style.color = isSelected ? '#f0e68c' : '#d4c8f0';
            }}
            style={{
              ...baseInteractiveStyle,
              background: isSelected
                ? 'linear-gradient(135deg, rgba(106,90,205,0.4), rgba(218,112,214,0.3))'
                : 'rgba(30, 20, 50, 0.7)',
              border: isSelected ? '2px solid #da70d6' : '1px solid #3a2a5a',
              borderRadius: '10px',
              padding: '16px 24px',
              color: isSelected ? '#f0e68c' : '#d4c8f0',
              fontSize: '15px',
              fontWeight: isSelected ? 'bold' : 'normal',
              transform: isSelected ? 'translateY(-4px)' : 'translateY(0)',
              boxShadow: isSelected ? '0 8px 25px rgba(218,112,214,0.3)' : 'none',
              minWidth: '160px',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{CHEST_INFO[chest].icon}</div>
            <div>{CHEST_INFO[chest].name}</div>
          </button>
        );
      })}
    </div>
  );
};

interface MethodSelectorProps {
  style?: React.CSSProperties;
}

export const MethodSelector: React.FC<MethodSelectorProps> = ({ style }) => {
  const selectedMethod = useGameStore((s) => s.selectedMethod);
  const selectMethod = useGameStore((s) => s.selectMethod);

  return (
    <div
      style={{
        display: 'flex',
        gap: '24px',
        justifyContent: 'center',
        alignItems: 'center',
        ...style,
      }}
    >
      {(Object.keys(METHOD_INFO) as OpenMethod[]).map((method) => {
        const isSelected = selectedMethod === method;
        const color = METHOD_INFO[method].color;
        return (
          <div key={method} style={{ textAlign: 'center', position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                border: isSelected ? `2px solid ${color}` : `2px solid transparent`,
                transform: 'translate(-50%, -50%)',
                animation: isSelected ? 'pulseRing 1.5s ease-in-out infinite' : 'none',
                pointerEvents: 'none',
                opacity: isSelected ? 0.6 : 0,
                transition: 'opacity 0.3s ease, border-color 0.3s ease',
              }}
            />
            <button
              onClick={() => selectMethod(method)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = isSelected
                  ? `0 0 30px ${color}99`
                  : `0 0 15px ${color}44`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = isSelected ? 'scale(1)' : 'scale(1)';
                e.currentTarget.style.boxShadow = isSelected
                  ? `0 0 20px ${color}66`
                  : 'none';
              }}
              style={{
                ...baseInteractiveStyle,
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                border: isSelected ? `3px solid ${color}` : '2px solid #3a2a5a',
                background: isSelected
                  ? `radial-gradient(circle, ${color}44, rgba(30,20,50,0.9))`
                  : 'rgba(30, 20, 50, 0.7)',
                fontSize: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: isSelected ? 'pulse 1.5s ease-in-out infinite' : 'none',
                boxShadow: isSelected ? `0 0 20px ${color}66` : 'none',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {METHOD_INFO[method].icon}
            </button>
            <div style={{ marginTop: '8px', fontSize: '12px', color: isSelected ? color : '#a898c8', fontWeight: isSelected ? 'bold' : 'normal' }}>
              {METHOD_INFO[method].name}
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface OpenButtonProps {
  style?: React.CSSProperties;
}

export const OpenButton: React.FC<OpenButtonProps> = ({ style }) => {
  const selectedChest = useGameStore((s) => s.selectedChest);
  const selectedMethod = useGameStore((s) => s.selectedMethod);
  const isOpening = useGameStore((s) => s.isOpening);
  const openChest = useGameStore((s) => s.openChest);
  const playerHp = useGameStore((s) => s.playerStats.hp);

  const isDisabled = !selectedChest || !selectedMethod || isOpening || playerHp <= 0;

  return (
    <button
      onClick={openChest}
      disabled={isDisabled}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 10px 40px rgba(218,112,214,0.5)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = isDisabled ? 'none' : '0 5px 20px rgba(218,112,214,0.3)';
      }}
      onMouseDown={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.transform = 'scale(0.98)';
        }
      }}
      onMouseUp={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.transform = 'scale(1.05)';
        }
      }}
      style={{
        ...baseInteractiveStyle,
        padding: '16px 48px',
        fontSize: '18px',
        fontWeight: 'bold',
        borderRadius: '12px',
        border: 'none',
        color: isDisabled ? '#6b5a8a' : '#ffffff',
        background: isDisabled
          ? 'rgba(50, 40, 70, 0.5)'
          : 'linear-gradient(135deg, #6a5acd 0%, #da70d6 50%, #9370DB 100%)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        boxShadow: isDisabled ? 'none' : '0 5px 20px rgba(218,112,214,0.3)',
        transition: 'all 0.1s ease',
        letterSpacing: '2px',
        ...style,
      }}
    >
      {isOpening ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ animation: 'pulse 0.8s ease-in-out infinite' }}>⚡</span>
          开启中...
        </span>
      ) : !selectedChest || !selectedMethod ? (
        '请选择宝箱和方式'
      ) : (
        `🎲 开启${CHEST_INFO[selectedChest]?.name || '宝箱'}`
      )}
    </button>
  );
};

interface InscriptionPanelProps {
  style?: React.CSSProperties;
}

export const InscriptionPanel: React.FC<InscriptionPanelProps> = ({ style }) => {
  const inscriptions = useGameStore((s) => s.inscriptions);
  const inscriptionSlots = useGameStore((s) => s.inscriptionSlots);
  const equipInscription = useGameStore((s) => s.equipInscription);
  const unequipInscription = useGameStore((s) => s.unequipInscription);

  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [flyToSlot, setFlyToSlot] = useState<{ id: string; slotIndex: number } | null>(null);
  const [flyFromSlot, setFlyFromSlot] = useState<number | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const animationFrameRef = useRef<number | null>(null);
  const targetPositionRef = useRef<{ x: number; y: number } | null>(null);

  const unequippedInscriptions = inscriptions.filter((i) => i.equippedSlot === null);
  const draggedInscription = draggedId ? inscriptions.find((i) => i.id === draggedId) : null;

  const updatePosition = () => {
    if (targetPositionRef.current) {
      setDragPosition({ ...targetPositionRef.current });
    }
    animationFrameRef.current = requestAnimationFrame(updatePosition);
  };

  const updateDragPosition = (x: number, y: number) => {
    targetPositionRef.current = {
      x: x - dragOffset.x,
      y: y - dragOffset.y,
    };

    let hoveredSlot: number | null = null;
    slotRefs.current.forEach((slotRef, idx) => {
      if (slotRef) {
        const slotRect = slotRef.getBoundingClientRect();
        if (
          x >= slotRect.left &&
          x <= slotRect.right &&
          y >= slotRect.top &&
          y <= slotRect.bottom
        ) {
          hoveredSlot = idx;
        }
      }
    });
    setDragOverSlot(hoveredSlot);
  };

  const endDrag = (x: number, y: number) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    let targetSlot: number | null = null;
    slotRefs.current.forEach((slotRef, idx) => {
      if (slotRef) {
        const slotRect = slotRef.getBoundingClientRect();
        if (
          x >= slotRect.left &&
          x <= slotRect.right &&
          y >= slotRect.top &&
          y <= slotRect.bottom
        ) {
          targetSlot = idx;
        }
      }
    });

    const currentDraggedId = draggedIdRef.current;
    if (targetSlot !== null && currentDraggedId) {
      setFlyToSlot({ id: currentDraggedId, slotIndex: targetSlot });
      setTimeout(() => {
        equipInscription(currentDraggedId, targetSlot!);
        setFlyToSlot(null);
      }, 300);
    }

    setDraggedId(null);
    setDragPosition(null);
    setDragOverSlot(null);
    targetPositionRef.current = null;
  };

  const draggedIdRef = useRef<string | null>(null);

  const handleMouseDown = (e: React.MouseEvent, inscriptionId: string, cardElement: HTMLDivElement) => {
    e.preventDefault();
    const rect = cardElement.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setDraggedId(inscriptionId);
    draggedIdRef.current = inscriptionId;
    targetPositionRef.current = {
      x: e.clientX - (e.clientX - rect.left),
      y: e.clientY - (e.clientY - rect.top),
    };
    setDragPosition({ ...targetPositionRef.current });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      updateDragPosition(moveEvent.clientX, moveEvent.clientY);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      endDrag(upEvent.clientX, upEvent.clientY);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    animationFrameRef.current = requestAnimationFrame(updatePosition);
  };

  const handleTouchStart = (e: React.TouchEvent, inscriptionId: string, cardElement: HTMLDivElement) => {
    const touch = e.touches[0];
    const rect = cardElement.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
    setDraggedId(inscriptionId);
    draggedIdRef.current = inscriptionId;
    targetPositionRef.current = {
      x: touch.clientX - (touch.clientX - rect.left),
      y: touch.clientY - (touch.clientY - rect.top),
    };
    setDragPosition({ ...targetPositionRef.current });

    const handleTouchMove = (moveEvent: TouchEvent) => {
      moveEvent.preventDefault();
      const t = moveEvent.touches[0];
      updateDragPosition(t.clientX, t.clientY);
    };

    const handleTouchEnd = (endEvent: TouchEvent) => {
      const t = endEvent.changedTouches[0];
      endDrag(t.clientX, t.clientY);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    animationFrameRef.current = requestAnimationFrame(updatePosition);
  };

  const handleSlotClick = (slotIndex: number) => {
    const slot = inscriptionSlots[slotIndex];
    if (slot) {
      setFlyFromSlot(slotIndex);
      setTimeout(() => {
        unequipInscription(slotIndex);
        setFlyFromSlot(null);
      }, 300);
    }
  };

  const renderInscriptionCard = (inscription: Inscription) => {
    const color = RARITY_COLORS[inscription.rarity] || '#9CA3AF';
    const elementColor = ELEMENT_INFO[inscription.type]?.color || '#6b5a8a';
    return (
      <div
        style={{
          padding: '10px 12px',
          background: `linear-gradient(135deg, rgba(${hexToRgb(color)}, 0.15), rgba(30,20,50,0.6))`,
          borderRadius: '8px',
          border: `1px solid ${color}55`,
          width: '280px',
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: `radial-gradient(circle, ${elementColor}44, rgba(30,20,50,0.8))`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              border: `1px solid ${elementColor}66`,
            }}
          >
            {ELEMENT_INFO[inscription.type]?.icon || '🔮'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 'bold', color: '#e8dff5', fontSize: '13px' }}>{inscription.name}</span>
              <span
                style={{
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: color,
                  color: '#0d0a14',
                  fontWeight: 'bold',
                }}
              >
                {inscription.rarity.toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#a898c8', marginTop: '2px' }}>
              Lv.{inscription.level} · {inscription.effect}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={panelRef}
      style={{
        background: 'rgba(30, 20, 50, 0.7)',
        border: '1px solid #3a2a5a',
        borderRadius: '12px',
        padding: '20px',
        color: '#d4c8f0',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        ...style,
      }}
    >
      <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#e8dff5', borderBottom: '1px solid #3a2a5a', paddingBottom: '10px' }}>
        🔮 铭文搭配
      </h2>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', marginBottom: '12px', color: '#a898c8' }}>⚔️ 装备槽位（拖拽铭文装备）</div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          {inscriptionSlots.map((slot, idx) => {
            const elementColor = slot ? ELEMENT_INFO[slot.type]?.color || '#6b5a8a' : '#3a2a5a';
            const isHover = dragOverSlot === idx;
            const isFlyingOut = flyFromSlot === idx;
            return (
              <div
                key={idx}
                ref={(el) => { slotRefs.current[idx] = el; }}
                onClick={() => handleSlotClick(idx)}
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  border: `3px solid ${elementColor}`,
                  background: slot
                    ? `radial-gradient(circle, ${elementColor}33, rgba(30,20,50,0.8))`
                    : 'rgba(20, 15, 35, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: slot ? 'pointer' : 'default',
                  color: elementColor,
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  animation: isHover ? 'slotHighlight 0.8s ease-in-out infinite' : isFlyingOut ? 'flyOut 0.3s ease forwards' : 'none',
                  boxShadow: isHover ? `0 0 30px ${elementColor}` : slot ? `0 0 10px ${elementColor}44` : 'none',
                }}
                title={slot ? `点击卸下 ${slot.name}` : `槽位 ${idx + 1}`}
              >
                {slot && !isFlyingOut && (
                  <div style={{ textAlign: 'center', animation: 'flyIn 0.3s ease' }}>
                    <div style={{ fontSize: '24px' }}>{ELEMENT_INFO[slot.type]?.icon || '🔮'}</div>
                    <div style={{ fontSize: '10px', color: '#e8dff5', fontWeight: 'bold' }}>Lv.{slot.level}</div>
                  </div>
                )}
                {!slot && !isHover && (
                  <div style={{ fontSize: '24px', opacity: 0.3 }}>＋</div>
                )}
                <div
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#1a1427',
                    border: `1px solid ${elementColor}`,
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#e8dff5',
                    fontWeight: 'bold',
                  }}
                >
                  {idx + 1}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <div style={{ fontSize: '13px', marginBottom: '12px', color: '#a898c8' }}>
          🎒 铭文背包 ({unequippedInscriptions.length})
        </div>
        <div
          style={{
            maxHeight: '350px',
            overflowY: 'auto',
            paddingRight: '5px',
          }}
        >
          {unequippedInscriptions.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#6b5a8a', textAlign: 'center', padding: '30px 0' }}>
              暂无铭文<br />开箱获取铭文
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {unequippedInscriptions.map((inscription) => {
                const isDragging = draggedId === inscription.id;
                const color = RARITY_COLORS[inscription.rarity] || '#9CA3AF';
                const elementColor = ELEMENT_INFO[inscription.type]?.color || '#6b5a8a';
                const isFlyingIn = flyToSlot?.id === inscription.id;
                return (
                  <div
                    key={inscription.id}
                    ref={(el) => { cardRefs.current[inscription.id] = el; }}
                    onMouseDown={(e) => {
                      const cardEl = cardRefs.current[inscription.id];
                      if (cardEl) {
                        handleMouseDown(e, inscription.id, cardEl);
                      }
                    }}
                    onTouchStart={(e) => {
                      const cardEl = cardRefs.current[inscription.id];
                      if (cardEl) {
                        handleTouchStart(e, inscription.id, cardEl);
                      }
                    }}
                    style={{
                      ...baseInteractiveStyle,
                      padding: '10px 12px',
                      background: `linear-gradient(135deg, rgba(${hexToRgb(color)}, 0.15), rgba(30,20,50,0.6))`,
                      borderRadius: '8px',
                      border: `1px solid ${color}55`,
                      opacity: isDragging || isFlyingIn ? 0 : 1,
                      cursor: 'grab',
                      transition: isFlyingIn ? 'all 0.3s ease' : 'opacity 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: `radial-gradient(circle, ${elementColor}44, rgba(30,20,50,0.8))`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          border: `1px solid ${elementColor}66`,
                        }}
                      >
                        {ELEMENT_INFO[inscription.type]?.icon || '🔮'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 'bold', color: '#e8dff5', fontSize: '13px' }}>{inscription.name}</span>
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: color,
                              color: '#0d0a14',
                              fontWeight: 'bold',
                            }}
                          >
                            {inscription.rarity.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#a898c8', marginTop: '2px' }}>
                          Lv.{inscription.level} · {inscription.effect}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {dragPosition && draggedInscription && (
        <>
          <div
            style={{
              position: 'fixed',
              left: dragPosition.x,
              top: dragPosition.y,
              zIndex: 9999,
              opacity: 0.2,
              pointerEvents: 'none',
              transition: 'left 0.05s ease, top 0.05s ease',
            }}
          >
            {renderInscriptionCard(draggedInscription)}
          </div>
          <div
            style={{
              position: 'fixed',
              left: dragPosition.x,
              top: dragPosition.y,
              zIndex: 9999,
              opacity: 0.4,
              pointerEvents: 'none',
              transition: 'left 0.1s ease, top 0.1s ease',
            }}
          >
            {renderInscriptionCard(draggedInscription)}
          </div>
          <div
            style={{
              position: 'fixed',
              left: dragPosition.x,
              top: dragPosition.y,
              zIndex: 10000,
              pointerEvents: 'none',
            }}
          >
            {renderInscriptionCard(draggedInscription)}
          </div>
        </>
      )}
    </div>
  );
};

interface OpenResultModalProps {}

export const OpenResultModal: React.FC<OpenResultModalProps> = () => {
  const openResult = useGameStore((s) => s.openResult);
  const clearOpenResult = useGameStore((s) => s.clearOpenResult);

  if (!openResult) return null;

  const { success, message, rewards, damageTaken } = openResult;
  const particleCount = 15;

  return (
    <div
      onClick={clearOpenResult}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #1a1427 0%, #0d0a14 100%)',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          position: 'relative',
          border: '2px solid transparent',
          backgroundImage: `linear-gradient(#1a1427, #0d0a14), linear-gradient(135deg, #6a5acd, #da70d6, #6a5acd)`,
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          animation: 'fadeIn 0.3s ease-out',
          boxShadow: '0 0 60px rgba(218,112,214,0.3)',
        }}
      >
        {success && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', borderRadius: '14px' }}>
            {Array.from({ length: particleCount }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: ['#10B981', '#3B82F6', '#F59E0B', '#9370DB'][i % 4],
                  left: `${10 + Math.random() * 80}%`,
                  bottom: '20%',
                  animation: `particleUp ${1 + Math.random() * 1.5}s ease-out infinite`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  boxShadow: `0 0 10px currentColor`,
                }}
              />
            ))}
          </div>
        )}

        {!success && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', borderRadius: '14px' }}>
            {Array.from({ length: particleCount }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: ['#EF4444', '#DC2626', '#B91C1C'][i % 3],
                  left: `${10 + Math.random() * 80}%`,
                  top: '20%',
                  animation: `particleDown ${1 + Math.random() * 1.5}s ease-out infinite`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  boxShadow: `0 0 10px currentColor`,
                }}
              />
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '24px', position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: '64px', marginBottom: '12px' }}>
            {success ? '🎉' : '💀'}
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: '24px',
              color: success ? '#10B981' : '#EF4444',
              fontWeight: 'bold',
            }}
          >
            {success ? '开箱成功！' : '开箱失败'}
          </h2>
          <p style={{ marginTop: '12px', color: '#a898c8', fontSize: '14px', lineHeight: 1.6 }}>
            {message}
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 2 }}>
          {damageTaken && damageTaken > 0 && (
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: '8px',
                marginBottom: '16px',
                color: '#FCA5A5',
                fontSize: '14px',
                textAlign: 'center',
              }}
            >
              ⚠️ 受到陷阱伤害：<span style={{ fontWeight: 'bold', fontSize: '18px', color: '#EF4444' }}>-{damageTaken} HP</span>
            </div>
          )}

          {success && rewards.reputation && rewards.reputation > 0 && (
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(245,158,11,0.15)',
                border: '1px solid rgba(245,158,11,0.4)',
                borderRadius: '8px',
                marginBottom: '16px',
                color: '#FCD34D',
                fontSize: '14px',
                textAlign: 'center',
              }}
            >
              ⭐ 获得声望：<span style={{ fontWeight: 'bold', fontSize: '18px' }}>+{rewards.reputation}</span>
            </div>
          )}

          {success && rewards.fragments && rewards.fragments.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: '#a898c8', marginBottom: '10px' }}>💎 获得碎片</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {rewards.fragments.map((f: Fragment, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      background: `rgba(${hexToRgb(ELEMENT_INFO[f.type]?.color || '#9CA3AF')}, 0.15)`,
                      border: `1px solid ${ELEMENT_INFO[f.type]?.color || '#9CA3AF'}55`,
                      borderRadius: '8px',
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{ELEMENT_INFO[f.type]?.icon || '💎'}</span>
                    <span style={{ color: '#e8dff5', fontSize: '13px' }}>{ELEMENT_INFO[f.type]?.name}</span>
                    <span style={{ color: ELEMENT_INFO[f.type]?.color, fontWeight: 'bold' }}>×{f.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {success && rewards.inscriptions && rewards.inscriptions.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: '#a898c8', marginBottom: '10px' }}>🔮 获得铭文</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {rewards.inscriptions.map((ins: Inscription, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 14px',
                      background: `linear-gradient(135deg, rgba(${hexToRgb(RARITY_COLORS[ins.rarity] || '#9CA3AF')}, 0.2), rgba(30,20,50,0.6))`,
                      borderRadius: '8px',
                      border: `1px solid ${RARITY_COLORS[ins.rarity] || '#9CA3AF'}66`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: `radial-gradient(circle, ${ELEMENT_INFO[ins.type]?.color || '#6b5a8a'}55, rgba(30,20,50,0.8))`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                      }}
                    >
                      {ELEMENT_INFO[ins.type]?.icon || '🔮'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold', color: '#e8dff5' }}>{ins.name}</span>
                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: RARITY_COLORS[ins.rarity], color: '#0d0a14', fontWeight: 'bold' }}>
                          {ins.rarity}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#a898c8' }}>Lv.{ins.level} · {ins.effect}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {success && rewards.items && rewards.items.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: '#a898c8', marginBottom: '10px' }}>🎁 获得物品</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {rewards.items.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 12px',
                      background: `rgba(${hexToRgb(RARITY_COLORS[item.rarity] || '#9CA3AF')}, 0.15)`,
                      border: `1px solid ${RARITY_COLORS[item.rarity] || '#9CA3AF'}55`,
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#e8dff5',
                    }}
                  >
                    {item.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <button
            onClick={clearOpenResult}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            style={{
              ...baseInteractiveStyle,
              padding: '12px 36px',
              fontSize: '15px',
              fontWeight: 'bold',
              borderRadius: '10px',
              border: 'none',
              color: '#ffffff',
              background: success
                ? 'linear-gradient(135deg, #10B981, #059669)'
                : 'linear-gradient(135deg, #6a5acd, #9370DB)',
              boxShadow: success
                ? '0 4px 15px rgba(16,185,129,0.4)'
                : '0 4px 15px rgba(106,90,205,0.4)',
            }}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

interface GameOverModalProps {}

export const GameOverModal: React.FC<GameOverModalProps> = () => {
  const playerStats = useGameStore((s) => s.playerStats);
  const resetPlayer = useGameStore((s) => s.resetPlayer);

  if (playerStats.hp > 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #2a1525 0%, #0d0a14 100%)',
          borderRadius: '20px',
          padding: '48px 40px',
          maxWidth: '450px',
          width: '100%',
          textAlign: 'center',
          border: '2px solid #7F1D1D',
          animation: 'fadeIn 0.5s ease-out',
          boxShadow: '0 0 80px rgba(239,68,68,0.3)',
        }}
      >
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>💀</div>
        <h1
          style={{
            margin: '0 0 12px 0',
            fontSize: '32px',
            color: '#EF4444',
            fontWeight: 'bold',
            letterSpacing: '4px',
          }}
        >
          游戏结束
        </h1>
        <p style={{ color: '#a898c8', margin: '0 0 32px 0', fontSize: '14px' }}>
          你在冒险中倒下了...
        </p>

        <div
          style={{
            background: 'rgba(50, 20, 30, 0.5)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
            border: '1px solid #7F1D1D66',
          }}
        >
          <div style={{ fontSize: '13px', color: '#6b5a8a', marginBottom: '16px' }}>本次冒险统计</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#e8dff5' }}>{playerStats.totalOpens}</div>
              <div style={{ fontSize: '12px', color: '#a898c8' }}>总开箱次数</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10B981' }}>{playerStats.successCount}</div>
              <div style={{ fontSize: '12px', color: '#a898c8' }}>成功次数</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f0e68c' }}>{playerStats.reputation}</div>
              <div style={{ fontSize: '12px', color: '#a898c8' }}>累计声望</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#9370DB' }}>
                {playerStats.totalOpens > 0 ? `${Math.round((playerStats.successCount / playerStats.totalOpens) * 100)}%` : '0%'}
              </div>
              <div style={{ fontSize: '12px', color: '#a898c8' }}>成功率</div>
            </div>
          </div>
        </div>

        <button
          onClick={resetPlayer}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(106,90,205,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(106,90,205,0.4)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.98)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          style={{
            ...baseInteractiveStyle,
            padding: '16px 48px',
            fontSize: '17px',
            fontWeight: 'bold',
            borderRadius: '12px',
            border: 'none',
            color: '#ffffff',
            background: 'linear-gradient(135deg, #6a5acd 0%, #da70d6 50%, #9370DB 100%)',
            letterSpacing: '2px',
            boxShadow: '0 4px 20px rgba(106,90,205,0.4)',
          }}
        >
          🔄 重新开始
        </button>
      </div>
    </div>
  );
};
