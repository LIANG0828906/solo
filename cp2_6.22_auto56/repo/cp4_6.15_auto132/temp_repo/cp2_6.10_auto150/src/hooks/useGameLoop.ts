import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { updateBall, checkCollisions, updatePins, isRoundComplete } from '../game/engine';

export function useGameLoop(): void {
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const hasRoundEndedRef = useRef<boolean>(false);

  const gameStatus = useGameStore((state) => state.gameStatus);
  const ball = useGameStore((state) => state.ball);
  const pins = useGameStore((state) => state.pins);
  const isCharging = useGameStore((state) => state.isCharging);

  const updateBallState = useGameStore((state) => state.updateBall);
  const updatePinsState = useGameStore((state) => state.updatePins);
  const addScore = useGameStore((state) => state.addScore);
  const endRound = useGameStore((state) => state.endRound);
  const updatePower = useGameStore((state) => state.updatePower);

  useEffect(() => {
    if (gameStatus === 'playing') {
      hasRoundEndedRef.current = false;
    }
  }, [gameStatus]);

  useEffect(() => {
    if (gameStatus !== 'playing' && !isCharging) {
      return;
    }

    const gameLoop = (currentTime: number): void => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
      }

      const deltaTime = currentTime - lastTimeRef.current;

      if (deltaTime >= 16) {
        lastTimeRef.current = currentTime;

        if (isCharging) {
          updatePower();
        }

        if (gameStatus === 'playing' && !hasRoundEndedRef.current) {
          const currentBall = useGameStore.getState().ball;
          const currentPins = useGameStore.getState().pins;

          const updatedBall = updateBall(currentBall);
          const collisionResult = checkCollisions(updatedBall, currentPins);
          const updatedPins = updatePins(collisionResult.pins);

          updateBallState(collisionResult.ball);
          updatePinsState(updatedPins);

          if (collisionResult.scoreDelta !== 0) {
            addScore(collisionResult.scoreDelta);
          }

          if (isRoundComplete(collisionResult.ball, updatedPins)) {
            hasRoundEndedRef.current = true;
            setTimeout(() => {
              endRound();
            }, 500);
            return;
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastTimeRef.current = 0;
    };
  }, [gameStatus, isCharging, updatePower, updateBallState, updatePinsState, addScore, endRound]);
}
