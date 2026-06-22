import { useState, useCallback, useRef, useEffect } from 'react';
import {
  TownArea,
  addDecoration,
  getDecorationCost,
  DECORATION_EMOJIS,
  MAX_DECORATIONS,
} from '../utils';

type DecorationPurchaseResult = {
  isAnimating: boolean;
  purchaseDecoration: (areaId: string) => void;
  getCurrentCost: (area: TownArea) => number;
  canPurchase: (area: TownArea, coins: number) => boolean;
  lastPurchaseTime: number;
};

export const useDecorationPurchase = (
  areas: TownArea[],
  coins: number,
  onPurchase: (updatedAreas: TownArea[], cost: number) => void
): DecorationPurchaseResult => {
  const [isAnimating, setIsAnimating] = useState(false);
  const lastPurchaseTimeRef = useRef<number>(0);
  const [lastPurchaseTime, setLastPurchaseTime] = useState(0);
  const cooldownMs = 500;

  const getCurrentCost = useCallback((area: TownArea): number => {
    return getDecorationCost(area.decorations.length);
  }, []);

  const canPurchase = useCallback((area: TownArea, currentCoins: number): boolean => {
    if (!area.unlocked) return false;
    if (area.decorations.length >= MAX_DECORATIONS) return false;
    const cost = getCurrentCost(area);
    return currentCoins >= cost;
  }, [getCurrentCost]);

  const purchaseDecoration = useCallback((areaId: string) => {
    const now = Date.now();
    
    if (now - lastPurchaseTimeRef.current < cooldownMs) {
      return;
    }

    const area = areas.find(a => a.id === areaId);
    if (!area || !canPurchase(area, coins)) return;

    const randomDecoration = DECORATION_EMOJIS[Math.floor(Math.random() * DECORATION_EMOJIS.length)];
    const result = addDecoration(areas, areaId, randomDecoration);

    if (result.success) {
      lastPurchaseTimeRef.current = now;
      setLastPurchaseTime(now);
      setIsAnimating(true);
      onPurchase(result.areas, result.cost);
      
      setTimeout(() => {
        setIsAnimating(false);
      }, cooldownMs);
    }
  }, [areas, coins, canPurchase, onPurchase, cooldownMs]);

  useEffect(() => {
    return () => {
      lastPurchaseTimeRef.current = 0;
    };
  }, []);

  return {
    isAnimating,
    purchaseDecoration,
    getCurrentCost,
    canPurchase,
    lastPurchaseTime,
  };
};
