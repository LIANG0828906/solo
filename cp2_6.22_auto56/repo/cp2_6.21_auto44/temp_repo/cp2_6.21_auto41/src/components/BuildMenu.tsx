import React from 'react';
import { BuildingType, BUILDING_CONFIGS, BuildMenuState } from '../types/gameTypes';
import { useGameStore } from '../store/gameStore';
import { getBuildableTypes, getBuildingCost } from '../core/buildingRules';
import './BuildMenu.css';

interface BuildMenuProps {
  menu: BuildMenuState;
}

const BuildMenu: React.FC<BuildMenuProps> = ({ menu }) => {
  const { buildBuilding, setBuildMenu, resources, selectedBuilding, setSelectedBuilding } = useGameStore();
  const buildableTypes = getBuildableTypes();

  const handleBuild = (type: BuildingType) => {
    const cost = getBuildingCost(type);
    if (resources.money >= cost) {
      buildBuilding(menu.cellX, menu.cellY, type);
    }
    setBuildMenu(null);
  };

  const handleDemolish = () => {
    const { removeBuilding } = useGameStore.getState();
    removeBuilding(menu.cellX, menu.cellY);
    setBuildMenu(null);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBuildMenu(null);
  };

  return (
    <div
      className="build-menu"
      style={{
        left: menu.x,
        top: menu.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="build-menu-inner">
        {buildableTypes.map((type, index) => {
          const config = BUILDING_CONFIGS[type];
          const canAfford = resources.money >= config.cost;
          const angle = (index * 90 - 45) * (Math.PI / 180);
          const radius = 55;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <button
              key={type}
              className={`build-btn ${!canAfford ? 'disabled' : ''} ${selectedBuilding === type ? 'selected' : ''}`}
              style={{
                transform: `translate(${x}px, ${y}px)`,
                backgroundColor: config.color,
              }}
              onClick={() => handleBuild(type)}
              onMouseEnter={() => setSelectedBuilding(type)}
              onMouseLeave={() => setSelectedBuilding(null)}
              disabled={!canAfford}
              title={`${config.name} - ${config.cost}金`}
            >
              <span className="build-icon">{config.icon}</span>
              <span className="build-cost">{config.cost}</span>
            </button>
          );
        })}
        
        <button
          className="build-btn demolish"
          style={{
            transform: 'translate(0, 55px)',
            backgroundColor: '#a8dadc',
          }}
          onClick={handleDemolish}
          title="拆除建筑 (退还50%)"
        >
          <span className="build-icon">🗑️</span>
          <span className="build-cost">50%</span>
        </button>

        <button
          className="build-btn close"
          style={{
            transform: 'translate(0, -55px)',
            backgroundColor: '#666',
          }}
          onClick={handleClose}
          title="关闭"
        >
          <span className="build-icon">✕</span>
        </button>
      </div>
    </div>
  );
};

export default BuildMenu;
