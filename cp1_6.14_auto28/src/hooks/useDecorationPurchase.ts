import { useState, useCallback, useRef, useEffect } from 'react';
import {
  TownArea,
  addDecoration,
  getDecorationCost,
  DECORATION_EMOJIS,
  MAX_DECORATIONS,
  debounce,
} from '../utils';

type DecorationPurchaseResult = {
  isAnimating: boolean;
  purchaseDecoration: (areaId: string) => void;
  getCurrentCost: (area: TownArea) => number;
  canPurchase: (area: TownArea, coins: number) => boolean;
};

export const useDecorationPurchase = (
  areas: TownArea[],
  coins: number,
  onPurchase: (updatedAreas: TownArea[], cost: number) => void
): DecorationPurchaseResult => {
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(false);
  const pendingPurchaseRef = useRef<{ areaId: string; timestamp: number } | null>(null);

  const getCurrentCost = useCallback((area: TownArea): number => {
    return getDecorationCost(area.decorations.length);
  }, []);

  const canPurchase = useCallback((area: TownArea, currentCoins: number): boolean => {
    if (!area.unlocked) return false;
    if (area.decorations.length >= MAX_DECORATIONS) return false;
    const cost = getCurrentCost(area);
    return currentCoins >= cost;
  }, [getCurrentCost]);

  const executePurchase = useCallback((areaId: string) => {
    if (animationRef.current) return;
    
    const area = areas.find(a => a.id === areaId);
    if (!area || !canPurchase(area, coins)) return;

    const randomDecoration = DECORATION_EMOJIS[Math.floor(Math.random() * DECORATION_EMOJIS.length)];
    const result = addDecoration(areas, areaId, randomDecoration);

    if (result.success) {
      animationRef.current = true;
      setIsAnimating(true);
      onPurchase(result.areas, result.cost);
      
      setTimeout(() => {
        animationRef.current = false;
        setIsAnimating(false);
      }, 500);
    }
  }, [areas, coins, canPurchase, onPurchase]);

  const debouncedPurchase = useCallback(
    debounce(executePurchase, 300),
    [executePurchase]
  );

  const purchaseDecoration = useCallback((areaId: string) => {
    const now = Date.now();
    const pending = pendingPurchaseRef.current;
    
    if (pending && now - pending.timestamp < 300) {
      return;
    }
    
    pendingPurchaseRef.current = { areaId, timestamp: now };
    debouncedPurchase(areaId);
  }, [debouncedPurchase]);

  useEffect(() => {
    return () => {
      pendingPurchaseRef.current = null;
    };
  }, []);

  return {
    isAnimating,
    purchaseDecoration,
    getCurrentCost,
    canPurchase,
  };
};
