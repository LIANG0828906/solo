import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMineralStore } from '../store/mineralStore';
import { updateCrystalGrowth } from '../logic/crystalGrowth';

interface SceneManagerProps {}

const SceneManager: React.FC<SceneManagerProps> = () => {
  const lastTime = useRef(performance.now());

  useFrame(() => {
    const now = performance.now();
    const deltaTime = (now - lastTime.current) / 1000;
    lastTime.current = now;

    const state = useMineralStore.getState();
    const result = updateCrystalGrowth(state.crystals, deltaTime, state.timeSpeed);

    if (result.updatedCount > 0) {
      useMineralStore.setState({ crystals: result.crystals });
    }
  });

  return null;
};

export default SceneManager;
