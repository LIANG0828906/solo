import React, { useState, useCallback } from 'react';

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
}

const MAP_SIZE = 150;
const WORLD_SIZE = 100;

export const useCameraControls = () => {
  const [cameraState, setCameraState] = useState<CameraState>({
    position: [150, 120, 150],
    target: [0, 0, 0],
  });

  const updateCamera = useCallback((position: [number, number, number], target: [number, number, number]) => {
    setCameraState({ position, target });
  }, []);

  const jumpToPosition = useCallback((worldX: number, worldZ: number) => {
    const height = 80;
    const distance = 100;
    const angle = Math.PI / 4;
    
    setCameraState({
      position: [
        worldX + Math.cos(angle) * distance,
        height,
        worldZ + Math.sin(angle) * distance,
      ],
      target: [worldX, 0, worldZ],
    });
  }, []);

  return { cameraState, updateCamera, jumpToPosition };
};

interface CameraNavigatorProps {
  cameraState: CameraState;
  onJumpTo: (x: number, z: number) => void;
  buildingCount: number;
}

export const CameraNavigator: React.FC<CameraNavigatorProps> = ({ cameraState, onJumpTo, buildingCount }) => {
  const [isHovering, setIsHovering] = useState(false);

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    left: '24px',
    bottom: '24px',
    width: `${MAP_SIZE}px`,
    height: `${MAP_SIZE}px`,
    background: '#1A1A2E',
    border: '1px solid #4A4A6A',
    borderRadius: '8px',
    overflow: 'hidden',
    cursor: 'crosshair',
    zIndex: 1000,
    transition: 'transform 0.2s ease',
    transform: isHovering ? 'scale(1.05)' : 'scale(1)',
  };

  const worldToMap = (worldX: number, worldZ: number): [number, number] => {
    const mapX = (worldX / WORLD_SIZE) * (MAP_SIZE / 2) + MAP_SIZE / 2;
    const mapZ = (worldZ / WORLD_SIZE) * (MAP_SIZE / 2) + MAP_SIZE / 2;
    return [mapX, mapZ];
  };

  const mapToWorld = (mapX: number, mapZ: number): [number, number] => {
    const worldX = ((mapX - MAP_SIZE / 2) / (MAP_SIZE / 2)) * WORLD_SIZE;
    const worldZ = ((mapZ - MAP_SIZE / 2) / (MAP_SIZE / 2)) * WORLD_SIZE;
    return [worldX, worldZ];
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mapX = e.clientX - rect.left;
    const mapZ = e.clientY - rect.top;
    const [worldX, worldZ] = mapToWorld(mapX, mapZ);
    onJumpTo(worldX, worldZ);
  };

  const [camMapX, camMapZ] = worldToMap(cameraState.position[0], cameraState.position[2]);
  const [targetMapX, targetMapZ] = worldToMap(cameraState.target[0], cameraState.target[2]);

  const angle = Math.atan2(
    cameraState.target[2] - cameraState.position[2],
    cameraState.target[0] - cameraState.position[0]
  );

  const arrowLength = 15;
  const arrowEndX = camMapX + Math.cos(angle) * arrowLength;
  const arrowEndZ = camMapZ + Math.sin(angle) * arrowLength;

  return (
    <div
      style={containerStyle}
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <svg width={MAP_SIZE} height={MAP_SIZE} style={{ display: 'block' }}>
        <defs>
          <pattern id="grid" width="15" height="15" patternUnits="userSpaceOnUse">
            <path d="M 15 0 L 0 0 0 15" fill="none" stroke="#2A2A4A" strokeWidth="0.5" />
          </pattern>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        <line
          x1={camMapX}
          y1={camMapZ}
          x2={arrowEndX}
          y2={arrowEndZ}
          stroke="#4682B4"
          strokeWidth="2"
        />
        
        <polygon
          points={`${arrowEndX},${arrowEndZ} ${arrowEndX - 6 * Math.cos(angle - Math.PI/6)},${arrowEndZ - 6 * Math.sin(angle - Math.PI/6)} ${arrowEndX - 6 * Math.cos(angle + Math.PI/6)},${arrowEndZ - 6 * Math.sin(angle + Math.PI/6)}`}
          fill="#4682B4"
        />
        
        <circle cx={camMapX} cy={camMapZ} r="5" fill="#4682B4" stroke="#fff" strokeWidth="2" />
        
        <circle cx={targetMapX} cy={targetMapZ} r="3" fill="#8A2BE2" opacity="0.6" />
      </svg>
      
      <div style={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        fontSize: '10px',
        color: '#8A8AAA',
        fontFamily: 'system-ui, sans-serif',
        pointerEvents: 'none',
      }}>
        小地图
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: '8px',
        right: '8px',
        fontSize: '10px',
        color: '#4682B4',
        fontFamily: 'system-ui, sans-serif',
        pointerEvents: 'none',
      }}>
        {buildingCount} 栋建筑
      </div>
    </div>
  );
};
