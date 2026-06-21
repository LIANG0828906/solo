import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { DEFAULT_PRESET, NebulaPreset, PRESETS } from '@/utils/nebulaPresets';

export interface Snapshot {
  id: string;
  thumbnail: string;
  params: NebulaParams;
}

export interface NebulaParams {
  presetId: string;
  centerColor: string;
  edgeColor: string;
  density: number;
  rotationSpeed: number;
  particleSize: number;
  waveAmplitude: number;
  waveFrequency: number;
}

interface NebulaContextValue {
  params: NebulaParams;
  updateParams: (partial: Partial<NebulaParams>) => void;
  applyPreset: (presetId: string) => void;
  snapshots: Snapshot[];
  saveSnapshot: (thumbnail: string) => void;
  loadSnapshot: (snapshot: Snapshot) => void;
}

const NebulaContext = createContext<NebulaContextValue | null>(null);

export function useNebulaContext() {
  const ctx = useContext(NebulaContext);
  if (!ctx) throw new Error('useNebulaContext must be used within NebulaProvider');
  return ctx;
}

function presetToParams(preset: NebulaPreset): NebulaParams {
  return {
    presetId: preset.id,
    centerColor: preset.centerColor,
    edgeColor: preset.edgeColor,
    density: preset.density,
    rotationSpeed: preset.rotationSpeed,
    particleSize: preset.particleSize,
    waveAmplitude: preset.waveAmplitude,
    waveFrequency: preset.waveFrequency,
  };
}

export function NebulaProvider({ children }: { children: React.ReactNode }) {
  const [params, setParams] = useState<NebulaParams>(presetToParams(DEFAULT_PRESET));
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const snapCounter = useRef(0);

  const updateParams = useCallback((partial: Partial<NebulaParams>) => {
    setParams((prev) => ({ ...prev, ...partial }));
  }, []);

  const applyPreset = useCallback((presetId: string) => {
    const preset = PRESETS[presetId];
    if (preset) {
      setParams(presetToParams(preset));
    }
  }, []);

  const saveSnapshot = useCallback((thumbnail: string) => {
    snapCounter.current += 1;
    const snap: Snapshot = {
      id: `snap-${snapCounter.current}-${Date.now()}`,
      thumbnail,
      params: { ...params },
    };
    setSnapshots((prev) => [...prev, snap]);
  }, [params]);

  const loadSnapshot = useCallback((snapshot: Snapshot) => {
    setParams({ ...snapshot.params });
  }, []);

  return (
    <NebulaContext.Provider value={{ params, updateParams, applyPreset, snapshots, saveSnapshot, loadSnapshot }}>
      {children}
    </NebulaContext.Provider>
  );
}
