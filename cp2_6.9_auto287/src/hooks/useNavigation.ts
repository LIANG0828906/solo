import { useCallback, useEffect, useRef } from 'react';
import { useNavigationStore } from '../store/useNavigationStore';
import { NAVIGATION_CONSTANTS } from '../utils/constants';
import { distance2D, lerp, getDirectionBetweenPoints } from '../utils/mathUtils';
import type { Waypoint } from '../types';

const { FLEET_SPEED, WAVE_AMPLITUDE, WAVE_PERIOD } = NAVIGATION_CONSTANTS;

export function useNavigation() {
  const {
    waypoints,
    fleet,
    passedWaypoints,
    isMoving,
    startFleet,
    stopFleet,
    updateFleetPosition,
    markWaypointPassed,
    setCurrentWaypointIndex,
    addWaypoint,
    removeWaypoint,
    updateWaypoint,
    clearAll,
  } = useNavigationStore();

  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const getWaypointColor = useCallback(
    (waypoint: Waypoint): string => {
      return passedWaypoints.has(waypoint.id) ? '#66bb6a' : '#4fc3f7';
    },
    [passedWaypoints]
  );

  const navigate = useCallback(
    (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
        startTimeRef.current = timestamp;
      }

      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const elapsedTime = (timestamp - startTimeRef.current) / 1000;
      const waveOffset = Math.sin((elapsedTime * Math.PI * 2) / WAVE_PERIOD) * WAVE_AMPLITUDE;

      const state = useNavigationStore.getState();
      const { waypoints: currentWaypoints, fleet: currentFleet, passedWaypoints: currentPassed } = state;

      if (currentWaypoints.length < 2 || !currentFleet.isMoving) {
        return;
      }

      const currentIndex = currentFleet.currentWaypointIndex;
      const nextIndex = currentIndex + 1;

      if (nextIndex >= currentWaypoints.length) {
        state.stopFleet();
        return;
      }

      const currentWaypoint = currentWaypoints[currentIndex];
      const nextWaypoint = currentWaypoints[nextIndex];

      const distanceToNext = distance2D(currentFleet.position, nextWaypoint.position);
      const moveDistance = FLEET_SPEED * deltaTime;

      if (distanceToNext <= moveDistance) {
        const newPosition: [number, number, number] = [
          nextWaypoint.position[0],
          waveOffset,
          nextWaypoint.position[2],
        ];

        const direction = getDirectionBetweenPoints(
          currentWaypoint.position,
          nextWaypoint.position
        );
        const rotation: [number, number, number] = [0, direction, 0];

        if (!currentPassed.has(currentWaypoint.id)) {
          state.markWaypointPassed(currentWaypoint.id);
        }

        state.updateFleetPosition(newPosition, rotation);
        state.setCurrentWaypointIndex(nextIndex);

        if (nextIndex >= currentWaypoints.length - 1) {
          state.markWaypointPassed(nextWaypoint.id);
          state.stopFleet();
          return;
        }
      } else {
        const t = moveDistance / distanceToNext;
        const newX = lerp(currentFleet.position[0], nextWaypoint.position[0], t);
        const newZ = lerp(currentFleet.position[2], nextWaypoint.position[2], t);

        const direction = getDirectionBetweenPoints(currentFleet.position, nextWaypoint.position);
        const rotation: [number, number, number] = [0, direction, 0];
        const newPosition: [number, number, number] = [newX, waveOffset, newZ];

        state.updateFleetPosition(newPosition, rotation);
      }

      animationFrameRef.current = requestAnimationFrame(navigate);
    },
    []
  );

  const startNavigation = useCallback(() => {
    if (waypoints.length < 2) return;

    const state = useNavigationStore.getState();
    const { fleet: currentFleet } = state;

    if (currentFleet.currentWaypointIndex >= waypoints.length - 1) {
      state.setCurrentWaypointIndex(0);
      state.fleet.position = [...waypoints[0].position] as [number, number, number];
    }

    startFleet();
    lastTimeRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(navigate);
  }, [waypoints, startFleet, navigate]);

  const stopNavigation = useCallback(() => {
    stopFleet();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    lastTimeRef.current = 0;
  }, [stopFleet]);

  const resetNavigation = useCallback(() => {
    stopNavigation();
    clearAll();
  }, [stopNavigation, clearAll]);

  useEffect(() => {
    if (fleet.isMoving && !animationFrameRef.current) {
      lastTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(navigate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [fleet.isMoving, navigate]);

  return {
    waypoints,
    fleet,
    passedWaypoints,
    isMoving,
    getWaypointColor,
    startNavigation,
    stopNavigation,
    resetNavigation,
    addWaypoint,
    removeWaypoint,
    updateWaypoint,
  };
}
