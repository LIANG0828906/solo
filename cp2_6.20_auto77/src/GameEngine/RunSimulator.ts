import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../store';
import { MechanismType } from '../types';
import { playActivateSound } from '../audio';

export function RunSimulator() {
  const mode = useStore((s) => s.mode);
  const prevActivatedRef = useRef<Set<string>>(new Set());

  useFrame((_, delta) => {
    if (mode !== 'run') return;

    const state = useStore.getState();
    const { props, links } = state;
    const playerPos = state.gameState.playerPosition;

    const newActivated = new Set<string>();

    for (const prop of props) {
      if (prop.type === MechanismType.PressurePlate) {
        const dx = playerPos[0] - prop.position[0];
        const dz = playerPos[2] - prop.position[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 1.0 && Math.abs(playerPos[1] - 0.5) < 1.0) {
          newActivated.add(prop.id);
        }
      }
    }

    let changed = true;
    let iterations = 0;
    while (changed && iterations < 20) {
      changed = false;
      iterations++;
      for (const link of links) {
        if (newActivated.has(link.sourceId) && !newActivated.has(link.targetId)) {
          newActivated.add(link.targetId);
          changed = true;
        }
      }
    }

    const prevActivated = prevActivatedRef.current;

    for (const id of newActivated) {
      if (!prevActivated.has(id)) {
        const prop = props.find((p) => p.id === id);
        if (prop) {
          state.activateProp(id);
          playActivateSound(prop.type);
          state.addTriggerHistory({ propId: id, timestamp: Date.now() });
        }
      }
    }

    for (const id of prevActivated) {
      if (!newActivated.has(id)) {
        state.deactivateProp(id);
      }
    }

    for (const prop of props) {
      if (prop.type === MechanismType.MovingPlatform) {
        if (newActivated.has(prop.id)) {
          const newOffset = Math.min(
            prop.currentOffset + prop.moveSpeed * delta,
            prop.moveRange
          );
          state.updatePropOffset(prop.id, newOffset);
        } else {
          if (prop.currentOffset > 0) {
            const newOffset = Math.max(
              prop.currentOffset - prop.moveSpeed * delta,
              0
            );
            state.updatePropOffset(prop.id, newOffset);
          }
        }
      }
    }

    prevActivatedRef.current = newActivated;
  });

  return null;
}
