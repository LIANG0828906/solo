import { useEffect, useRef } from 'react';
import { useGameStore, IceBlock } from '../store/useGameStore';
import { playSplashSound } from '../utils/sound';

const MELT_RATE_PER_5_MINUTES = 0.05;
const MELT_THRESHOLD = 0.2;

export const useIceMelt = () => {
  const { iceBlocks, updateIceSize, removeMeltedIce } = useGameStore();
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());
  const iceBlocksRef = useRef<IceBlock[]>(iceBlocks);

  useEffect(() => {
    iceBlocksRef.current = iceBlocks;
  }, [iceBlocks]);

  useEffect(() => {
    const updateMelt = () => {
      const now = Date.now();
      const deltaTime = now - lastTimeRef.current;
      lastTimeRef.current = now;

      const meltAmount = (deltaTime / 300000) * MELT_RATE_PER_5_MINUTES;

      const currentBlocks = iceBlocksRef.current;
      const blocksToRemove: string[] = [];

      currentBlocks.forEach(block => {
        if (block.currentSize <= 0) return;

        const newSize = block.currentSize - meltAmount;

        if (newSize <= MELT_THRESHOLD) {
          blocksToRemove.push(block.id);
        } else if (newSize !== block.currentSize) {
          updateIceSize(block.id, newSize);
        }
      });

      blocksToRemove.forEach(id => {
        playSplashSound();
        removeMeltedIce(id);
      });

      animationRef.current = requestAnimationFrame(updateMelt);
    };

    lastTimeRef.current = Date.now();
    animationRef.current = requestAnimationFrame(updateMelt);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updateIceSize, removeMeltedIce]);
};
