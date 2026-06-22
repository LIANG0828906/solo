import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, BUILDING_NAMES, type BuildingType, type Building } from '@/store/gameStore';
import { getPlacementPreview } from '@/core/buildingPlacement';

const CELL_SIZE = 32;

const BuildingIcon: React.FC<{ type: BuildingType; isPreparing: boolean }> = React.memo(
  ({ type, isPreparing }) => {
    const iconStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: isPreparing ? 'spin 0.8s linear infinite' : undefined,
    };

    switch (type) {
      case 'miner':
        return (
          <div style={iconStyle}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <polygon points="12,3 22,20 2,20" fill="#FFC107" stroke="#F57F17" strokeWidth="1" />
            </svg>
          </div>
        );
      case 'powerplant':
        return (
          <div style={iconStyle}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z" fill="#42A5F5" stroke="#1565C0" strokeWidth="1" />
            </svg>
          </div>
        );
      case 'factory':
        return (
          <div style={iconStyle}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" fill="#66BB6A" stroke="#2E7D32" strokeWidth="0.5" />
              <path d="M12 6v6l4 2" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        );
      case 'habitat':
        return (
          <div style={iconStyle}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="#9E9E9E" stroke="#616161" strokeWidth="1" />
            </svg>
          </div>
        );
      case 'warehouse':
        return (
          <div style={iconStyle}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <rect x="3" y="8" width="18" height="13" fill="#FF9800" stroke="#E65100" strokeWidth="1" />
              <path d="M3 8L12 2l9 6" fill="#FF9800" stroke="#E65100" strokeWidth="1" />
              <rect x="9" y="14" width="6" height="7" fill="#E65100" />
            </svg>
          </div>
        );
    }
  }
);
BuildingIcon.displayName = 'BuildingIcon';

const GridCell: React.FC<{
  x: number;
  y: number;
  building: Building | null;
  isNight: boolean;
  selectedType: BuildingType | null;
  gridSize: number;
  onPlace: (x: number, y: number) => void;
}> = React.memo(({ x, y, building, isNight, selectedType, gridSize, onPlace }) => {
  const [hovered, setHovered] = useState(false);

  const preview = hovered ? getPlacementPreview(x, y, selectedType) : 'none';

  const handleClick = useCallback(() => {
    if (!building && selectedType) {
      onPlace(x, y);
    }
  }, [x, y, building, selectedType, onPlace]);

  const cellStyle: React.CSSProperties = {
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: building ? undefined : '#3E2723',
    border: building ? '1px solid rgba(255,255,255,0.6)' : '1px solid transparent',
    position: 'relative',
    cursor: selectedType && !building ? 'pointer' : 'default',
    transition: 'border-color 0.3s ease, filter 1s ease-in-out',
    filter: isNight && building ? 'drop-shadow(0 0 6px rgba(255,255,200,0.5))' : 'none',
    boxSizing: 'border-box',
    overflow: 'hidden',
  };

  const progressStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    backgroundColor: '#76FF03',
    transition: 'width 0.1s linear',
  };

  return (
    <div
      style={cellStyle}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {building && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, duration: 0.3 }}
          style={{ width: '100%', height: '100%' }}
        >
          <BuildingIcon type={building.type} isPreparing={building.isPreparing} />
          {building.productionProgress > 0 && !building.isPreparing && (
            <div style={{ ...progressStyle, width: `${building.productionProgress * 100}%` }} />
          )}
        </motion.div>
      )}
      {!building && preview === 'placeable' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(76,175,80,0.3)',
            pointerEvents: 'none',
          }}
        />
      )}
      {!building && preview === 'blocked' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(244,67,54,0.3)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
});
GridCell.displayName = 'GridCell';

const GridRenderer: React.FC = React.memo(() => {
  const gridMap = useGameStore((s) => s.gridMap);
  const gridSize = useGameStore((s) => s.gridSize);
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const selectedBuildingType = useGameStore((s) => s.selectedBuildingType);
  const tryPlaceBuilding = useGameStore((s) => s.tryPlaceBuilding);

  const isNight = timeOfDay === 'night';

  const handlePlace = useCallback(
    (x: number, y: number) => {
      tryPlaceBuilding(x, y);
    },
    [tryPlaceBuilding]
  );

  const containerStyle: React.CSSProperties = {
    display: 'inline-grid',
    gridTemplateColumns: `repeat(${gridSize}, ${CELL_SIZE}px)`,
    gap: 0,
    backgroundColor: isNight ? '#1A237E' : '#3E2723',
    border: `2px solid ${isNight ? '#424242' : '#BDBDBD'}`,
    borderRadius: 4,
    padding: 2,
    transition: 'background-color 1s ease-in-out, border-color 1s ease-in-out',
  };

  const currentGridMap = gridMap.slice(0, gridSize).map((row) => row.slice(0, gridSize));

  return (
    <div style={containerStyle}>
      {currentGridMap.map((row, y) =>
        row.map((building, x) => (
          <GridCell
            key={`${x}-${y}`}
            x={x}
            y={y}
            building={building}
            isNight={isNight}
            selectedType={selectedBuildingType}
            gridSize={gridSize}
            onPlace={handlePlace}
          />
        ))
      )}
    </div>
  );
});
GridRenderer.displayName = 'GridRenderer';

export default GridRenderer;
