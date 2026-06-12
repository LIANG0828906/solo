import { useState, useEffect } from 'react';

interface UpgradeButtonProps {
  title: string;
  description: string;
  currentLevel: number;
  maxLevel: number;
  cost: number;
  canAfford: boolean;
  onUpgrade: () => void;
  icon: string;
}

function UpgradeButton({
  title,
  description,
  currentLevel,
  maxLevel,
  cost,
  canAfford,
  onUpgrade,
  icon,
}: UpgradeButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [shineOffset, setShineOffset] = useState(0);

  const isMaxLevel = currentLevel >= maxLevel;

  useEffect(() => {
    if (!canAfford || isMaxLevel) return;
    
    let animationId: number;
    const startTime = performance.now();
    const duration = 2000;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = (elapsed % duration) / duration;
      setShineOffset(progress * 200 - 50);
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [canAfford, isMaxLevel]);

  const handleClick = () => {
    if (!canAfford && !isMaxLevel) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 100);
      return;
    }
    if (!isMaxLevel) {
      onUpgrade();
    }
  };

  const baseBg = isMaxLevel
    ? 'linear-gradient(135deg, #2a2a3e 0%, #3a3a4e 100%)'
    : canAfford
    ? 'linear-gradient(135deg, #1a1a3e 0%, #2a2a5e 100%)'
    : 'linear-gradient(135deg, #1a1a2a 0%, #2a2a3a 100%)';

  const hoverBg = isMaxLevel
    ? baseBg
    : canAfford
    ? 'linear-gradient(135deg, #2a2a5e 0%, #3a3a7e 100%)'
    : baseBg;

  const borderColor = isMaxLevel
    ? '#666'
    : canAfford
    ? '#ffd700'
    : '#444';

  const textColor = isMaxLevel ? '#888' : canAfford ? '#fff' : '#666';
  const goldColor = isMaxLevel ? '#666' : canAfford ? '#ffd700' : '#555';

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        padding: '16px 20px',
        borderRadius: 12,
        border: `2px solid ${borderColor}`,
        background: isHovered ? hoverBg : baseBg,
        cursor: isMaxLevel ? 'not-allowed' : canAfford ? 'pointer' : 'not-allowed',
        overflow: 'hidden',
        transform: isShaking ? 'translateX(-3px)' : 'translateX(0)',
        transition: 'background 0.2s, transform 0.05s',
        flex: 1,
        minWidth: 200,
        boxShadow: canAfford && !isMaxLevel ? '0 0 15px rgba(255, 215, 0, 0.2)' : 'none',
      }}
    >
      {canAfford && !isMaxLevel && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: `${shineOffset}%`,
            width: '50%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.3) 50%, transparent 100%)',
            transform: 'skewX(-20deg)',
            pointerEvents: 'none',
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 28 }}>{icon}</span>
        <div>
          <div style={{ color: textColor, fontSize: 16, fontWeight: 'bold' }}>{title}</div>
          <div style={{ color: '#888', fontSize: 12 }}>{description}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <div style={{ color: goldColor, fontSize: 14, fontWeight: 'bold' }}>
          Level {currentLevel}/{maxLevel}
        </div>
        {!isMaxLevel ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 14 }}>💎</span>
            <span style={{ color: goldColor, fontSize: 14, fontWeight: 'bold' }}>
              {cost.toLocaleString()}
            </span>
          </div>
        ) : (
          <div style={{ color: '#666', fontSize: 12 }}>已满级</div>
        )}
      </div>

      <div
        style={{
          width: '100%',
          height: 4,
          background: '#111',
          borderRadius: 2,
          marginTop: 10,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${(currentLevel / maxLevel) * 100}%`,
            background: isMaxLevel ? '#666' : `linear-gradient(90deg, ${goldColor}, #ffed4a)`,
            transition: 'width 0.3s',
          }}
        />
      </div>
    </div>
  );
}

interface UpgradePanelProps {
  coins: number;
  laserLevel: number;
  shipCount: number;
  asteroidLevel: number;
  laserCost: number;
  shipCost: number;
  asteroidCost: number;
  onUpgradeLaser: () => void;
  onUpgradeShip: () => void;
  onUpgradeAsteroid: () => void;
}

export default function UpgradePanel({
  coins,
  laserLevel,
  shipCount,
  asteroidLevel,
  laserCost,
  shipCost,
  asteroidCost,
  onUpgradeLaser,
  onUpgradeShip,
  onUpgradeAsteroid,
}: UpgradePanelProps) {
  const LASER_MAX = 10;
  const SHIP_MAX = 8;
  const ASTEROID_MAX = 10;

  return (
    <div
      style={{
        padding: '20px 30px',
        background: 'linear-gradient(180deg, rgba(10, 10, 46, 0.9) 0%, #0a0a2e 100%)',
        borderTop: '2px solid #2a2a5e',
        display: 'flex',
        gap: 20,
        justifyContent: 'center',
      }}
    >
      <UpgradeButton
        icon="⚡"
        title="采矿激光效率"
        description="每级 +1 矿石/次点击"
        currentLevel={laserLevel}
        maxLevel={LASER_MAX}
        cost={laserCost}
        canAfford={coins >= laserCost && laserLevel < LASER_MAX}
        onUpgrade={onUpgradeLaser}
      />
      
      <UpgradeButton
        icon="🚀"
        title="自动采矿飞船"
        description="每艘每秒自动采 1 颗矿石"
        currentLevel={shipCount}
        maxLevel={SHIP_MAX}
        cost={shipCost}
        canAfford={coins >= shipCost && shipCount < SHIP_MAX}
        onUpgrade={onUpgradeShip}
      />
      
      <UpgradeButton
        icon="🌍"
        title="小行星探测深度"
        description="解锁更富矿的新小行星"
        currentLevel={asteroidLevel}
        maxLevel={ASTEROID_MAX}
        cost={asteroidCost}
        canAfford={coins >= asteroidCost && asteroidLevel < ASTEROID_MAX}
        onUpgrade={onUpgradeAsteroid}
      />
    </div>
  );
}
