import React, { useState, useRef, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import SkylineEditor from './SkylineEditor';
import LightSimulator from './LightSimulator';
import {
  Building,
  SunState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_Y,
  SUN_ARC_RADIUS,
  SUN_ARC_CENTER_X,
  SUN_ARC_CENTER_Y,
} from './types';

const generateRandomBuildings = (): Building[] => {
  const buildings: Building[] = [];
  const count = 3;

  for (let i = 0; i < count; i++) {
    const width = Math.round(40 + Math.random() * 60);
    const height = Math.round(100 + Math.random() * 150);
    const xMin = CANVAS_WIDTH * 0.2;
    const xMax = CANVAS_WIDTH * 0.8 - width;
    const x = Math.round(xMin + Math.random() * (xMax - xMin));
    const y = GROUND_Y - height;

    buildings.push({
      id: uuidv4(),
      x,
      y,
      width,
      height,
    });
  }

  return buildings.sort((a, b) => a.x - b.x);
};

const calculateSunPosition = (angle: number): { x: number; y: number } => {
  const rad = ((90 - angle) * Math.PI) / 180;
  return {
    x: SUN_ARC_CENTER_X + Math.cos(rad) * SUN_ARC_RADIUS,
    y: SUN_ARC_CENTER_Y - Math.sin(rad) * SUN_ARC_RADIUS,
  };
};

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [buildings, setBuildings] = useState<Building[]>(generateRandomBuildings);
  const [sunAngle, setSunAngleState] = useState<number>(15);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [hoveredBuildingId, setHoveredBuildingId] = useState<string | null>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [snapLineX, setSnapLineX] = useState<number | null>(null);
  const [snapLineY, setSnapLineY] = useState<number | null>(null);

  const setSunAngle = useCallback((angle: number) => {
    setSunAngleState(angle);
  }, []);

  const sun: SunState = useMemo(() => {
    const pos = calculateSunPosition(sunAngle);
    return {
      angle: sunAngle,
      x: pos.x,
      y: pos.y,
    };
  }, [sunAngle]);

  const totalHeight = useMemo(() => {
    return buildings.reduce((sum, b) => sum + b.height, 0);
  }, [buildings]);

  const buildingCount = buildings.length;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0f',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          padding: '16px 20px',
          backgroundColor: 'rgba(20, 20, 30, 0.85)',
          borderRadius: '10px',
          border: '1px solid rgba(100, 100, 120, 0.3)',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
          minWidth: '180px',
        }}
      >
        <div
          style={{
            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
            color: '#e0e0e5',
            fontSize: '13px',
            lineHeight: '1.8',
          }}
        >
          <div
            style={{
              color: '#8ab4f8',
              fontSize: '11px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            Skyline Editor
          </div>
          <div>
            <span style={{ color: '#888' }}>建筑数量: </span>
            <span style={{ color: '#ffdd00', fontWeight: 'bold' }}>
              {buildingCount}
            </span>
          </div>
          <div>
            <span style={{ color: '#888' }}>总高度: </span>
            <span style={{ color: '#7fe3b8', fontWeight: 'bold' }}>
              {totalHeight}px
            </span>
          </div>
          <div>
            <span style={{ color: '#888' }}>日照角度: </span>
            <span style={{ color: '#ff9966', fontWeight: 'bold' }}>
              {sunAngle.toFixed(1)}°
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          width: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`,
          maxWidth: '90vw',
          maxHeight: '80vh',
          aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
          position: 'relative',
        }}
      >
        <SkylineEditor
          buildings={buildings}
          setBuildings={setBuildings}
          sun={sun}
          setSun={(newSunOrUpdater) => {
            const newSun = typeof newSunOrUpdater === 'function' 
              ? newSunOrUpdater(sun) 
              : newSunOrUpdater;
            setSunAngle(newSun.angle);
          }}
          canvasRef={canvasRef}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          hoveredBuildingId={hoveredBuildingId}
          setHoveredBuildingId={setHoveredBuildingId}
          hoveredElement={hoveredElement}
          setHoveredElement={setHoveredElement}
          snapLineX={snapLineX}
          setSnapLineX={setSnapLineX}
          snapLineY={snapLineY}
          setSnapLineY={setSnapLineY}
        />
        <LightSimulator
          buildings={buildings}
          sun={sun}
          canvasRef={canvasRef}
          isDragging={isDragging}
          hoveredBuildingId={hoveredBuildingId}
          hoveredElement={hoveredElement}
          snapLineX={snapLineX}
          snapLineY={snapLineY}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          backgroundColor: 'rgba(20, 20, 30, 0.7)',
          borderRadius: '20px',
          border: '1px solid rgba(100, 100, 120, 0.2)',
          backdropFilter: 'blur(8px)',
          fontSize: '12px',
          color: '#888',
          zIndex: 10,
        }}
      >
        <span style={{ color: '#666' }}>提示: </span>
        拖拽建筑边缘调整大小，拖拽建筑本体移动位置，拖拽太阳改变日照角度
      </div>
    </div>
  );
};

export default App;
