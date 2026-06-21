import React, { useContext, useRef, useState, useCallback, useMemo } from 'react';
import { AuctionContext } from '../App';
import type { AuctionItem } from '../types';

const SECTOR_COLORS = [
  '#7C3AED', '#2563EB', '#059669', '#D97706',
  '#DC2626', '#DB2777', '#8B5CF6', '#0EA5E9'
];

const Wheel: React.FC = () => {
  const context = useContext(AuctionContext);
  if (!context) throw new Error('AuctionContext 未找到');

  const { items, setSelectedItemId, auctionActive } = context;
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const autoSpinRef = useRef(true);

  const sectorAngle = 360 / 8;

  const displayItems: (AuctionItem | null)[] = useMemo(() => {
    const arr: (AuctionItem | null)[] = [];
    for (let i = 0; i < 8; i++) {
      arr.push(items[i] || null);
    }
    return arr;
  }, [items]);

  const conicGradient = useMemo(() => {
    const stops = SECTOR_COLORS.map((color, i) => {
      const start = i * sectorAngle;
      const end = (i + 1) * sectorAngle;
      return `${color} ${start}deg ${end}deg`;
    });
    return `conic-gradient(from -90deg, ${stops.join(', ')})`;
  }, [sectorAngle]);

  const startSpin = useCallback(() => {
    if (isSpinning || !auctionActive) return;

    const availableItems = displayItems
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => item && !item.sold);

    if (availableItems.length === 0) return;

    autoSpinRef.current = false;
    setIsSpinning(true);
    setSelectedItemId(null);
    setSelectedIdx(null);

    const random = availableItems[Math.floor(Math.random() * availableItems.length)];
    const targetSectorIdx = random.idx;

    const targetCenterAngle = targetSectorIdx * sectorAngle + sectorAngle / 2;
    const spins = 5;
    const baseRotation = Math.ceil(rotation / 360) * 360;
    const totalRotation = baseRotation + spins * 360 + (360 - targetCenterAngle);

    const duration = 2000;
    const startTime = performance.now();
    const startRotation = rotation;
    const delta = totalRotation - startRotation;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentRot = startRotation + delta * easeOut;
      setRotation(currentRot);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setSelectedIdx(targetSectorIdx);
        const selectedItem = displayItems[targetSectorIdx];
        if (selectedItem) {
          setSelectedItemId(selectedItem.id);
        }
      }
    };

    requestAnimationFrame(animate);
  }, [isSpinning, auctionActive, rotation, displayItems, setSelectedItemId, sectorAngle]);

  return (
    <div className="wheel-section">
      <div className="wheel-container">
        <div className="wheel-pointer" />
        <div
          className={`wheel ${isSpinning ? 'spinning' : autoSpinRef.current ? 'auto-spin' : ''}`}
          style={{
            background: conicGradient,
            transform: autoSpinRef.current && !isSpinning
              ? undefined
              : `rotateX(20deg) rotate(${rotation}deg)`,
            transition: isSpinning ? 'none' : 'transform 0.1s ease'
          }}
        >
          {displayItems.map((item, idx) => {
            const angle = idx * sectorAngle + sectorAngle / 2;
            const radius = 140;
            const rad = (angle - 90) * Math.PI / 180;
            const x = 50 + (radius / 420) * 100 * Math.cos(rad);
            const y = 50 + (radius / 420) * 100 * Math.sin(rad);
            const textAngle = angle > 90 && angle < 270 ? angle + 180 : angle;

            return (
              <div
                key={idx}
                className={`sector-label ${selectedIdx === idx ? 'selected' : ''}`}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `translate(-50%, -50%) rotate(${textAngle}deg)`
                }}
              >
                {item ? (
                  <>
                    <img src={item.image} alt={item.name} className="sector-thumb" />
                    <div className="sector-name">{item.name}</div>
                    <div className="sector-price">¥{item.currentPrice}</div>
                  </>
                ) : (
                  <div className="sector-empty">空</div>
                )}
              </div>
            );
          })}
        </div>
        <div className="wheel-center">¥</div>
      </div>

      <button
        className="start-auction-btn"
        onClick={startSpin}
        disabled={isSpinning || !auctionActive || items.filter(i => !i.sold).length === 0}
      >
        {isSpinning ? '旋转中...' : '开始拍卖'}
      </button>
    </div>
  );
};

export default Wheel;
