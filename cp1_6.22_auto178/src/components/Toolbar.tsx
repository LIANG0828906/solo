import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { SPECIES_CONFIG, AUTO_IRRIGATOR_MAX } from '@/config/constants';
import type { PlantSpecies, SelectedTool } from '@/types';

const SPECIES_LIST: PlantSpecies[] = ['sunflower', 'cactus', 'dandelion'];

const Toolbar: React.FC = () => {
  const {
    selectedTool,
    setSelectedTool,
    seedInventory,
    unlockedSpecies,
    irrigators,
  } = useGameStore();

  const handleToolClick = (tool: SelectedTool) => {
    setSelectedTool(selectedTool === tool ? 'none' : tool);
  };

  const canUseIrrigator = unlockedSpecies.length >= 2 && irrigators.length < AUTO_IRRIGATOR_MAX;

  return (
    <div className="toolbar" role="toolbar" aria-label="种植工具栏">
      {SPECIES_LIST.map((species) => {
        const cfg = SPECIES_CONFIG[species];
        const unlocked = unlockedSpecies.includes(species);
        const count = seedInventory[species];
        const isActive = selectedTool === species;
        const disabled = !unlocked || count <= 0;

        return (
          <button
            key={species}
            className={`tool-btn ${isActive ? 'active' : ''}`}
            onClick={() => !