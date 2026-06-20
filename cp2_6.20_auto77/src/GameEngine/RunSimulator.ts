import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { MechanismType, TriggerType } from '../types';
import { playActivateSound, playDeactivateSound } from '../audio';

export function RunSimulator() {
  const mode = useStore((s) => s.mode);
  const prevActivatedRef = useRef<Set<string>>(new Set());
  const pulseCooldownRef = useRef<Map<string, number>>(new Map());
  const laserHitCooldownRef = useRef<Map<string, number>>(new Map());

  useFrame((_, delta) => {
    if (mode !== 'run') return;

    const state = useStore.getState();
    const { props, links } = state;
    const playerPos = state.gameState.playerPosition;

    const continuousActivated = new Set<string>();
    const pulseEventsThisFrame: string[] = [];
    const propagated = new Set<string>();

    for (const prop of props) {
      if (prop.type === MechanismType.PressurePlate) {
        const dx = playerPos[0] - prop.position[0];
        const dz = playerPos[2] - prop.position[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 1.0 && Math.abs(playerPos[1] - 0.5) < 1.5) {
          continuousActivated.add(prop.id);
        }
      }
    }

    for (const prop of props) {
      if (prop.type === MechanismType.LaserEmitter && continuousActivated.has(prop.id)) {
        const laserDirection = new THREE.Vector3(0, 1, 0);
        for (const targetProp of props) {
          if (targetProp.type === MechanismType.PressurePlate || targetProp.id === prop.id) continue;
          const tdx = targetProp.position[0] - prop.position[0];
          const tdz = targetProp.position[2] - prop.position[2];
          const tdy = targetProp.position[1] - prop.position[1];
          const hDist = Math.sqrt(tdx * tdx + tdz * tdz);
          if (hDist < 15 && Math.abs(tdy) < 5) {
            const cooldownKey = `${prop.id}->${targetProp.id}`;
            const cd = laserHitCooldownRef.current.get(cooldownKey) || 0;
            if (cd <= 0) {
              laserHitCooldownRef.current.set(cooldownKey, 0.3);
              const linksFromLaser = links.filter(
                (l) => l.sourceId === prop.id && l.triggerType === TriggerType.Pulse
              );
              for (const l of linksFromLaser) {
                if (l.targetId === targetProp.id) {
                  pulseEventsThisFrame.push(targetProp.id);
                }
              }
            }
          }
        }
      }
    }

    for (const [key, cd] of laserHitCooldownRef.current) {
      if (cd > 0) {
        laserHitCooldownRef.current.set(key, cd - delta);
      }
    }

    const propagateContinuous = () => {
      let changed = true;
      let iter = 0;
      while (changed && iter < 20) {
        changed = false;
        iter++;
        for (const link of links) {
          if (link.triggerType !== TriggerType.Continuous) continue;
          if (continuousActivated.has(link.sourceId) && !continuousActivated.has(link.targetId)) {
            continuousActivated.add(link.targetId);
            propagated.add(link.targetId);
            changed = true;
          }
        }
      }
    };
    propagateContinuous();

    const allActivatedThisFrame = new Set([...continuousActivated, ...pulseEventsThisFrame]);

    const pulseLatchingRef = new Map<string, number>();
    for (const pulseId of pulseEventsThisFrame) {
      const pulseLinkChain = links.filter((l) => l.sourceId === pulseId && l.triggerType === TriggerType.Pulse);
      for (const link of pulseLinkChain) {
        allActivatedThisFrame.add(link.targetId);
        pulseLatchingRef.set(link.targetId, 0.5);
      }
    }

    const prevActivated = prevActivatedRef.current;

    for (const id of allActivatedThisFrame) {
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
      if (!continuousActivated.has(id) && !pulseLatchingRef.has(id)) {
        const wasDeactivated = state.deactivateProp(id);
        if (propagated.has(id)) {
        }
        const prop = props.find((p) => p.id === id);
        if (prop && wasDeactivated !== false) {
        }
      }
    }

    for (const prop of props) {
      if (prop.type === MechanismType.MovingPlatform) {
        const isActive = continuousActivated.has(prop.id);
        if (isActive) {
          const newOffset = Math.min(
            prop.currentOffset + prop.moveSpeed * delta,
            prop.moveRange
          );
          if (Math.abs(newOffset - prop.currentOffset) > 0.0001) {
            state.updatePropOffset(prop.id, newOffset);
          }
        } else {
          if (prop.currentOffset > 0.0001) {
            const newOffset = Math.max(
              prop.currentOffset - prop.moveSpeed * delta,
              0
            );
            state.updatePropOffset(prop.id, newOffset);
          } else if (prop.currentOffset > 0 && prop.currentOffset <= 0.0001) {
            state.updatePropOffset(prop.id, 0);
          }
        }
      }
    }

    for (const [key, cd] of pulseCooldownRef.current) {
      if (cd > 0) pulseCooldownRef.current.set(key, cd - delta);
    }

    prevActivatedRef.current = new Set(continuousActivated);
    for (const [k, v] of pulseLatchingRef.entries()) {
      if (v > 0) prevActivatedRef.current.add(k);
    }
  });

  return null;
}
