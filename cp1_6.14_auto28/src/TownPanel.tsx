import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  TownArea,
  FloatingCoin,
  MAX_DECORATIONS,
  FLOATING_COIN_DURATION,
  UNLOCK_ANIMATION_DURATION,
  getCoinMultiplier,
} from './utils';
import { useCoinProduction } from './hooks/useCoinProduction';
import { useDecorationPurchase } from './hooks/useDecorationPurchase';

type TownPanelProps = {
  areas: TownArea[];
  coins: number;
  onCoinsCollected: (amount: number) => void;
  onPurchaseDecoration: (updatedAreas: TownArea[], cost: number) => void;
  newlyUnlockedArea: TownArea | null;
};

export const TownPanel: React.FC<TownPanelProps> = ({
  areas,
  coins,
  onCoinsCollected,
  onPurchaseDecoration,
  newlyUnlockedArea,
}) => {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockAreaData, setUnlockAreaData] = useState<TownArea | null>(null);
  const [animatingAreas, setAnimatingAreas] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);
  const areaElementRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const { floatingCoins, onCollectCoin } = useCoinProduction(areas, onCoinsCollected);

  const { isAnimating: isPurchasing, purchaseDecoration, getCurrentCost, canPurchase } = 
    useDecorationPurchase(areas, coins, onPurchaseDecoration);

  useEffect(() => {
    if (newlyUnlockedArea) {
      setAnimatingAreas(prev => new Set(prev).add(newlyUnlockedArea.id));
      setUnlockAreaData(newlyUnlockedArea);
      setShowUnlockModal(true);
      
      setTimeout(() => {
        setAnimatingAreas(prev => {
          const next = new Set(prev);
          next.delete(newlyUnlockedArea.id);
          return next;
        });
      }, UNLOCK_ANIMATION_DURATION);
    }
  }, [newlyUnlockedArea]);

  const setAreaRef = useCallback((areaId: string, element: HTMLDivElement | null) => {
    if (element) {
      areaElementRefs.current.set(areaId, element);
    }
  }, []);

  const handleAreaClick = useCallback((area: TownArea) => {
    if (!area.unlocked) return;
    setSelectedArea(prev => prev === area.id ? null : area.id);
    
    const element = areaElementRefs.current.get(area.id);
    if (element) {
      const multiplier = getCoinMultiplier(area.decorations.length);
      const amount = Math.floor(area.baseCoinPer5s * multiplier);
      onCollectCoin(amount, area.id, element);
    }
  }, [onCollectCoin]);

  const handleBuyDecoration = useCallback((areaId: string) => {
    purchaseDecoration(areaId);
  }, [purchaseDecoration]);

  const renderFloatingCoins = () => {
    if (!panelRef.current) return null;
    
    const panelRect = panelRef.current.getBoundingClientRect();
    
    return floatingCoins.map(coin => {
      const age = Date.now() - coin.createdAt;
      if (age >= FLOATING_COIN_DURATION) return null;
      
      const progress = age / FLOATING_COIN_DURATION;
      const relativeX = coin.x - panelRect.left;
      const relativeY = coin.y - panelRect.top;
      
      return (
        <div
          key={coin.id}
          style={{
            position: 'absolute',
            left: relativeX,
            top: relativeY,
            transform: `translateY(${-progress * 60}px) scale(${1 + progress * 0.2})`,
            opacity: 1 - progress,
            willChange: 'transform, opacity',
            pointerEvents: 'none',
            zIndex: 100,
            fontWeight: 'bold',
            color: '#FFD700',
            fontSize: '18px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
            transition: 'none',
          }}
        >
          +{coin.amount} 💰
        </div>
      );
    });
  };

  const renderArea = (area: TownArea) => {
    const isAnimating = animatingAreas.has(area.id);
    const isSelected = selectedArea === area.id;
    const cost = getCurrentCost(area);
    const affordable = canPurchase(area, coins);
    const currentMultiplier = getCoinMultiplier(area.decorations.length);
    const production = Math.floor(area.baseCoinPer5s * currentMultiplier);

    const getAreaIcon = () => {
      switch (area.type) {
        case 'forest': return '🌲';
        case 'lake': return '🌊';
        case 'residential': return '🏠';
        case 'park': return '🌳';
        case 'commercial': return '🏪';
        default: return '📍';
      }
    };

    return (
      <div
        key={area.id}
        ref={(el) => setAreaRef(area.id, el)}
        onClick={() => handleAreaClick(area)}
        style={{
          position: 'absolute',
          left: `${area.position.x}%`,
          top: `${area.position.y}%`,
          width: `${area.position.w}%`,
          height: `${area.position.h}%`,
          backgroundColor: area.unlocked ? area.color : area.lockedColor,
          borderRadius: '8px',
          cursor: area.unlocked ? 'pointer' : 'not-allowed',
          transition: area.unlocked ? 'all 0.3s ease' : 'none',
          transform: isAnimating ? 'scale(1)' : (area.unlocked ? 'scale(1)' : 'scale(0.5)'),
          opacity: isAnimating ? 1 : (area.unlocked ? 1 : 0.5),
          filter: area.unlocked ? 'none' : 'grayscale(100%)',
          boxShadow: isSelected 
            ? '0 0 0 3px #FFDAB9, 0 4px 12px rgba(0,0,0,0.2)' 
            : '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          animation: isAnimating ? `unlock-pop ${UNLOCK_ANIMATION_DURATION}ms ease-out forwards` : 'none',
          willChange: isAnimating ? 'transform, opacity, filter' : 'auto',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 'clamp(16px, 3vw, 24px)',
          }}
        >
          {area.unlocked ? getAreaIcon() : '🔒'}
        </div>

        {area.unlocked && area.decorations.map((decoration, index) => {
          const cols = 4;
          const row = Math.floor(index / cols);
          const col = index % cols;
          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: `${10 + col * 22}%`,
                top: `${15 + row * 30}%`,
                fontSize: 'clamp(10px, 1.5vw, 14px)',
                transition: 'all 0.3s ease',
              }}
            >
              {decoration}
            </div>
          );
        })}

        {area.unlocked && (
          <div
            style={{
              position: 'absolute',
              bottom: '4px',
              left: '4px',
              right: '4px',
              fontSize: 'clamp(8px, 1vw, 10px)',
              color: '#666',
              backgroundColor: 'rgba(255,255,255,0.8)',
              borderRadius: '4px',
              padding: '2px 4px',
              textAlign: 'center',
            }}
          >
            +{production}/5s
          </div>
        )}

        {!area.unlocked && (
          <div
            style={{
              position: 'absolute',
              bottom: '4px',
              left: '4px',
              right: '4px',
              fontSize: 'clamp(8px, 1vw, 10px)',
              color: '#999',
              textAlign: 'center',
            }}
          >
            Lv.{area.unlockLevel}解锁
          </div>
        )}
      </div>
    );
  };

  const renderSelectedAreaPanel = () => {
    if (!selectedArea) return null;
    
    const area = areas.find(a => a.id === selectedArea);
    if (!area || !area.unlocked) return null;
    
    const cost = getCurrentCost(area);
    const affordable = canPurchase(area, coins);
    const currentMultiplier = getCoinMultiplier(area.decorations.length);
    const production = Math.floor(area.baseCoinPer5s * currentMultiplier);

    return (
      <div
        style={{
          marginTop: '16px',
          padding: '16px',
          backgroundColor: '#FFDAB9',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', color: '#333', margin: 0 }}>{area.name}</h3>
          <span style={{ fontSize: '12px', color: '#666' }}>
            装饰品: {area.decorations.length}/{MAX_DECORATIONS}
          </span>
        </div>
        
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
          当前产出: <strong style={{ color: '#333' }}>+{production} 💰/5秒</strong>
        </div>
        
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
          收益加成: <strong style={{ color: '#333' }}>×{currentMultiplier.toFixed(1)}</strong>
        </div>

        {area.decorations.length > 0 && (
          <div style={{ marginBottom: '12px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {area.decorations.map((dec, i) => (
              <span key={i} style={{ fontSize: '20px' }}>{dec}</span>
            ))}
          </div>
        )}

        {area.decorations.length < MAX_DECORATIONS ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleBuyDecoration(area.id);
            }}
            disabled={!affordable || isPurchasing}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: affordable ? '#A8D8EA' : '#ccc',
              color: affordable ? '#333' : '#999',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: affordable && !isPurchasing ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
            }}
          >
            {isPurchasing ? '购买中...' : `购买装饰品 (${cost} 💰)`}
          </button>
        ) : (
          <div style={{ textAlign: 'center', color: '#999', fontSize: '14px', padding: '10px' }}>
            已达到最大装饰数量 ✨
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={panelRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        position: 'relative',
      }}
    >
      <div
        style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '12px',
          textAlign: 'center',
        }}
      >
        🏘️ 小镇规划图
      </div>
      
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '100%',
          backgroundColor: '#F5F5F5',
          borderRadius: '12px',
          border: '2px solid #A8D8EA',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: '8px' }}>
          {areas.map(area => renderArea(area))}
        </div>
      </div>

      {renderSelectedAreaPanel()}

      {renderFloatingCoins()}

      {showUnlockModal && unlockAreaData && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease',
          }}
          onClick={() => setShowUnlockModal(false)}
        >
          <div
            style={{
              backgroundColor: '#FFDAB9',
              padding: '24px 32px',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              animation: 'unlock-pop 0.5s ease-out',
              maxWidth: '300px',
              margin: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
            <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '8px' }}>
              新区域解锁！
            </h2>
            <p style={{ fontSize: '18px', color: '#333', marginBottom: '8px', fontWeight: 'bold' }}>
              {unlockAreaData.name}
            </p>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
              基础收益: +{unlockAreaData.baseCoinPer5s} 💰/5秒
            </p>
            <button
              onClick={() => setShowUnlockModal(false)}
              style={{
                padding: '10px 24px',
                backgroundColor: '#A8D8EA',
                color: '#333',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              太棒了！
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TownPanel;
