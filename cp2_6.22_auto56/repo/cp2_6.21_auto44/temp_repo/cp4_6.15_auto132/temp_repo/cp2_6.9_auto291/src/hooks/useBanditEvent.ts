import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { getRandomInterval, getRandomInt, generateId } from '@/utils/helpers';
import type { MapNode } from '@/types';

export const useBanditEvent = (
  isActive: boolean,
  route: string[],
  currentIndex: number,
  mapNodes: MapNode[]
) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setBanditEvent, addToast } = useStore();

  const scheduleNextEvent = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!isActive || currentIndex >= route.length - 1) {
      return;
    }

    const interval = getRandomInterval(5, 15);
    
    timeoutRef.current = setTimeout(() => {
      const nextNodeIndex = Math.min(currentIndex + 1, route.length - 1);
      const nodeId = route[nextNodeIndex];
      const node = mapNodes.find(n => n.id === nodeId);
      
      if (node) {
        const event = {
          id: generateId(),
          nodeId,
          active: true,
          strength: getRandomInt(3, 8)
        };
        setBanditEvent(event);
        addToast('⚠️ 前方发现劫匪！', 'error');
      }
    }, interval);
  }, [isActive, currentIndex, route, mapNodes, setBanditEvent, addToast]);

  useEffect(() => {
    if (isActive) {
      scheduleNextEvent();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, scheduleNextEvent]);

  const resetEvent = useCallback(() => {
    setBanditEvent(null);
    if (isActive) {
      scheduleNextEvent();
    }
  }, [isActive, scheduleNextEvent, setBanditEvent]);

  return { resetEvent };
};
