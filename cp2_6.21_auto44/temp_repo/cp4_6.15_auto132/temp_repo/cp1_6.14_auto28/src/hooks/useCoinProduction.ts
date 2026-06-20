import { useState, useEffect, useCallback, useRef } from 'react';
import {
  TownArea,
  FloatingCoin,
  generateId,
  getCoinMultiplier,
  COIN_PRODUCTION_INTERVAL,
  FLOATING_COIN_DURATION,
} from '../utils';

type UseCoinProductionResult = {
  floatingCoins: FloatingCoin[];
  onCollectCoin: (amount: number, areaId: string, areaElement: HTMLElement) => void;
  manualCollect: (areaId: string, areaElement: HTMLElement) => void;
};

export const useCoinProduction = (
  areas: TownArea[],
  onCoinsCollected: (amount: number) => void
): UseCoinProductionResult => {
  const [floatingCoins, setFloatingCoins] = useState<FloatingCoin[]>([]);
  const areaRefs = useRef<Map<string, HTMLElement>>(new Map());

  const cleanupExpiredCoins = useCallback(() => {
    const now = Date.now();
    setFloatingCoins(prev => prev.filter(coin => now - coin.createdAt < FLOATING_COIN_DURATION));
  }, []);

  useEffect(() => {
    const interval = setInterval(cleanupExpiredCoins, 1000);
    return () => clearInterval(interval);
  }, [cleanupExpiredCoins]);

  const spawnFloatingCoin = useCallback((
    amount: number,
    areaId: string,
    areaElement: HTMLElement
  ) => {
    const rect = areaElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top;

    const newCoin: FloatingCoin = {
      id: generateId(),
      amount,
      x: centerX,
      y: centerY,
      createdAt: Date.now(),
    };

    setFloatingCoins(prev => [...prev, newCoin]);
    areaRefs.current.set(areaId, areaElement);
  }, []);

  const onCollectCoin = useCallback((
    amount: number,
    areaId: string,
    areaElement: HTMLElement
  ) => {
    spawnFloatingCoin(amount, areaId, areaElement);
    onCoinsCollected(amount);
  }, [spawnFloatingCoin, onCoinsCollected]);

  useEffect(() => {
    const unlockedAreas = areas.filter(a => a.unlocked);
    if (unlockedAreas.length === 0) return;

    const interval = setInterval(() => {
      unlockedAreas.forEach(area => {
        const multiplier = getCoinMultiplier(area.decorations.length);
        const amount = Math.floor(area.baseCoinPer5s * multiplier);
        const element = areaRefs.current.get(area.id);
        if (element) {
          onCollectCoin(amount, area.id, element);
        }
      });
    }, COIN_PRODUCTION_INTERVAL);

    return () => clearInterval(interval);
  }, [areas, onCollectCoin]);

  const manualCollect = useCallback((areaId: string, areaElement: HTMLElement) => {
    const area = areas.find(a => a.id === areaId);
    if (!area || !area.unlocked) return;
    
    const multiplier = getCoinMultiplier(area.decorations.length);
    const amount = Math.floor(area.baseCoinPer5s * multiplier);
    onCollectCoin(amount, areaId, areaElement);
  }, [areas, onCollectCoin]);

  return {
    floatingCoins,
    onCollectCoin,
    manualCollect,
  };
};
