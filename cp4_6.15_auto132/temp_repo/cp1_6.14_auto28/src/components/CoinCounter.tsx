import React, { useState, useEffect, useRef, useCallback } from 'react';

type CoinCounterProps = {
  coins: number;
};

export const CoinCounter: React.FC<CoinCounterProps> = ({ coins }) => {
  const [displayCoins, setDisplayCoins] = useState(coins);
  const [isIncreasing, setIsIncreasing] = useState(false);
  const [isDecreasing, setIsDecreasing] = useState(false);
  const animationRef = useRef<number | null>(null);
  const currentValueRef = useRef(coins);
  const targetValueRef = useRef(coins);
  const lastDirectionRef = useRef<'up' | 'down' | null>(null);

  const animateTo = useCallback((target: number) => {
    targetValueRef.current = target;
    
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }

    const startValue = currentValueRef.current;
    const diff = target - startValue;
    const duration = Math.min(Math.abs(diff) * 10, 800);
    const startTime = performance.now();

    const direction = diff > 0 ? 'up' : 'down';
    if (direction !== lastDirectionRef.current) {
      lastDirectionRef.current = direction;
      if (direction === 'up') {
        setIsIncreasing(true);
        setIsDecreasing(false);
      } else {
        setIsDecreasing(true);
        setIsIncreasing(false);
      }
    }

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.round(startValue + diff * easeOutQuart);
      
      currentValueRef.current = currentValue;
      setDisplayCoins(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step);
      } else {
        animationRef.current = null;
        currentValueRef.current = target;
        setDisplayCoins(target);
        
        setTimeout(() => {
          if (animationRef.current === null && targetValueRef.current === target) {
            setIsIncreasing(false);
            setIsDecreasing(false);
            lastDirectionRef.current = null;
          }
        }, 100);
      }
    };

    animationRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    if (coins !== targetValueRef.current) {
      animateTo(coins);
    }
  }, [coins, animateTo]);

  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const formattedCoins = displayCoins.toLocaleString();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 20px',
        backgroundColor: '#FFDAB9',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        minWidth: '160px',
        justifyContent: 'center',
        willChange: 'transform',
      }}
    >
      <span style={{ fontSize: '24px' }}>💰</span>
      <div style={{ position: 'relative', overflow: 'hidden', height: '28px' }}>
        <span
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#333',
            display: 'inline-block',
            transform: isIncreasing 
              ? 'translateY(0)' 
              : isDecreasing 
                ? 'translateY(0)' 
                : 'translateY(0)',
            transition: 'transform 0.0s',
            willChange: 'transform',
          }}
        >
          {formattedCoins}
        </span>
        {(isIncreasing || isDecreasing) && (
          <span
            style={{
              position: 'absolute',
              left: 0,
              fontSize: '20px',
              fontWeight: 'bold',
              color: isIncreasing ? '#4CAF50' : '#F44336',
              opacity: 0.6,
              animation: isIncreasing ? 'coin-roll-up 0.3s ease-out' : 'coin-roll-down 0.3s ease-out',
              willChange: 'transform, opacity',
            }}
          >
            {formattedCoins}
          </span>
        )}
      </div>
    </div>
  );
};

export default CoinCounter;
