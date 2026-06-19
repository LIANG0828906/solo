import React, { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GridRenderer from '@/renderer/GridRenderer';
import BaseDashboard from '@/renderer/BaseDashboard';
import EventLog from '@/renderer/EventLog';
import { useGameStore, BUILDING_NAMES, BUILDING_CONFIGS, RESOURCE_NAMES, type BuildingType } from '@/store/gameStore';
import { startGameLoop, stopGameLoop } from '@/core/gameLoop';

const BUILDING_TYPES: BuildingType[] = ['powerplant', 'miner', 'factory', 'habitat', 'warehouse'];

const BUILDING_BUTTON_COLORS: Record<BuildingType, string> = {
  powerplant: '#42A5F5',
  miner: '#FFC107',
  factory: '#66BB6A',
  habitat: '#9E9E9E',
  warehouse: '#FF9800',
};

const BuildingToolbar: React.FC = () => {
  const selectedType = useGameStore((s) => s.selectedBuildingType);
  const selectBuildingType = useGameStore((s) => s.selectBuildingType);
  const resources = useGameStore((s) => s.resources);

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {BUILDING_TYPES.map((type) => {
        const config = BUILDING_CONFIGS[type];
        const isSelected = selectedType === type;
        const canAfford = (config.cost.energy ?? 0) <= resources.energy &&
          (config.cost.mineral ?? 0) <= resources.mineral;

        return (
          <motion.button
            key={type}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => selectBuildingType(isSelected ? null : type)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: isSelected ? '2px solid #fff' : '2px solid rgba(255,255,255,0.2)',
              background: isSelected
                ? `rgba(${hexToRgb(BUILDING_BUTTON_COLORS[type])},0.3)`
                : 'rgba(255,255,255,0.05)',
              color: canAfford ? '#fff' : 'rgba(255,255,255,0.3)',
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: 'inherit',
              transition: 'background 0.2s, border-color 0.2s',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 2 }}>{BUILDING_NAMES[type]}</div>
            <div style={{ fontSize: 10, opacity: 0.6 }}>
              {Object.entries(config.cost)
                .filter(([, v]) => v && v > 0)
                .map(([k, v]) => `${RESOURCE_NAMES[k] ?? k}:${v}`)
                .join(' ')}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

const DayNightToggle: React.FC = () => {
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const toggleTimeOfDay = useGameStore((s) => s.toggleTimeOfDay);
  const dayNightTimer = useGameStore((s) => s.dayNightTimer);

  const progress = dayNightTimer / 30000;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: 'rgba(255,255,255,0.1)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            backgroundColor: timeOfDay === 'day' ? '#FFD54F' : '#7C4DFF',
            transition: 'width 0.1s linear',
          }}
        />
      </div>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleTimeOfDay}
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.3)',
          background: 'rgba(255,255,255,0.08)',
          color: '#fff',
          fontSize: 18,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)',
        }}
      >
        {timeOfDay === 'day' ? '☀' : '🌙'}
      </motion.button>
    </div>
  );
};

const InsufficientWarning: React.FC = () => {
  const show = useGameStore((s) => s.showInsufficientWarning);
  const message = useGameStore((s) => s.insufficientWarningMessage);
  const dismiss = useGameStore((s) => s.dismissWarning);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(dismiss, 1500);
      return () => clearTimeout(timer);
    }
  }, [show, dismiss]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(244,67,54,0.9)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            zIndex: 1000,
            textAlign: 'center',
            animation: 'pulse-red 0.5s ease-in-out',
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function useResponsiveGrid() {
  const setGridSize = useGameStore((s) => s.setGridSize);

  useEffect(() => {
    const handleResize = () => {
      setGridSize(window.innerWidth < 768 ? 12 : 18);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setGridSize]);
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '255,255,255';
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

export default function App() {
  const timeOfDay = useGameStore((s) => s.timeOfDay);

  useResponsiveGrid();

  useEffect(() => {
    startGameLoop();
    return () => stopGameLoop();
  }, []);

  const isNight = timeOfDay === 'night';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: isNight ? '#1A237E' : '#1B1B2F',
        color: '#fff',
        padding: 16,
        transition: 'background-color 1s ease-in-out',
        fontFamily: '"Rajdhani", "Segoe UI", sans-serif',
      }}
    >
      <InsufficientWarning />

      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1, margin: 0 }}>
          🪐 星球基地
        </h1>
        <DayNightToggle />
      </header>

      <div
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <BuildingToolbar />
          <div style={{ marginTop: 12, overflow: 'auto' }}>
            <GridRenderer />
          </div>
        </div>

        <div
          style={{
            flex: '0 0 340px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <BaseDashboard />
          <EventLog />
        </div>
      </div>
    </div>
  );
}
