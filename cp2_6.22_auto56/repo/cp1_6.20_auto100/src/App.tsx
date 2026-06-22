import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { CityManager, CityConfig } from './CityManager';
import { BuildingParams } from './BuildingFactory';

interface BuildingInfo {
  id: string;
  height: number;
  floors: number;
  style: string;
}

const INITIAL_CONFIG: CityConfig = {
  buildingDensity: 120,
  growthSpeed: 1.5,
  maxHeight: 200,
};

const styleLabels: Record<string, string> = {
  box: '长方体',
  prism: '棱柱',
  coneTop: '锥顶',
};

function CityScene({
  cityManagerRef,
  config,
  onBuildingClick,
}: {
  cityManagerRef: React.MutableRefObject<CityManager | null>;
  config: CityConfig;
  onBuildingClick: (info: BuildingInfo | null) => void;
}) {
  const { scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const selectedId = useRef<string | null>(null);

  useEffect(() => {
    if (!cityManagerRef.current) {
      const manager = new CityManager(scene, config);
      cityManagerRef.current = manager;
      manager.generateInitialCity();
    }
  }, [scene]);

  useFrame(() => {
    if (cityManagerRef.current) {
      const now = performance.now() / 1000;
      cityManagerRef.current.update(now);
    }
  });

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!cityManagerRef.current) return;

      const target = event.target as HTMLCanvasElement;
      const rect = target.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, (event as any).__reactThreeCameraRef || null);

      const manager = cityManagerRef.current;
      const meshes: THREE.Object3D[] = [];
      manager.buildings.forEach((b) => {
        if (b.mesh) meshes.push(b.mesh);
      });

      const sceneChildren: THREE.Object3D[] = [];
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.buildingId) {
          sceneChildren.push(child);
        }
      });
    },
    [scene]
  );

  return null;
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.35} color="#8899cc" />
      <directionalLight
        position={[50, 80, 30]}
        intensity={0.8}
        color="#ffeedd"
        castShadow={false}
      />
      <directionalLight
        position={[-30, 40, -20]}
        intensity={0.25}
        color="#aaccff"
      />
      <hemisphereLight
        args={['#334477', '#111122', 0.4]}
      />
    </>
  );
}

function StarField() {
  return (
    <Stars
      radius={150}
      depth={80}
      count={200}
      factor={3}
      saturation={0.2}
      fade
      speed={0.8}
    />
  );
}

function CameraSetup() {
  return (
    <OrbitControls
      enableDamping
      dampingFactor={0.08}
      minDistance={20}
      maxDistance={300}
      maxPolarAngle={Math.PI / 2.05}
      enablePan
      panSpeed={0.8}
      rotateSpeed={0.6}
      target={[0, 20, 0]}
    />
  );
}

function CityCanvas({
  cityManagerRef,
  config,
  onBuildingClick,
}: {
  cityManagerRef: React.MutableRefObject<CityManager | null>;
  config: CityConfig;
  onBuildingClick: (info: BuildingInfo | null) => void;
}) {
  return (
    <Canvas
      camera={{
        position: [80, 80, 80],
        fov: 50,
        near: 0.1,
        far: 1000,
      }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      onPointerMissed={() => onBuildingClick(null)}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    >
      <Lights />
      <StarField />
      <CameraSetup />
      <CityScene
        cityManagerRef={cityManagerRef}
        config={config}
        onBuildingClick={onBuildingClick}
      />
    </Canvas>
  );
}

function ControlPanel({
  config,
  onConfigChange,
  onStartGrowth,
  isGrowing,
  growthComplete,
  buildingCount,
}: {
  config: CityConfig;
  onConfigChange: (key: keyof CityConfig, value: number) => void;
  onStartGrowth: () => void;
  isGrowing: boolean;
  growthComplete: boolean;
  buildingCount: number;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        bottom: collapsed ? -280 : 0,
        left: 0,
        right: 0,
        height: 320,
        width: '100%',
        background: 'rgba(10,10,30,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid #4a6cf7',
        transition: 'bottom 0.3s ease',
        zIndex: 100,
        padding: '16px 20px',
        overflowY: 'auto',
        borderRadius: '16px 16px 0 0',
      }
    : {
        position: 'fixed',
        top: 0,
        right: 0,
        width: 320,
        height: '100%',
        background: 'rgba(10,10,30,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderLeft: '1px solid #4a6cf7',
        zIndex: 100,
        padding: '24px 20px',
        overflowY: 'auto',
      };

  const sliderStyle: React.CSSProperties = {
    width: '100%',
    appearance: 'none',
    height: 4,
    borderRadius: 2,
    background: 'linear-gradient(90deg, #4a6cf7, #9b59b6)',
    outline: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    color: '#e0e0e0',
    fontSize: 13,
    marginBottom: 6,
    display: 'flex',
    justifyContent: 'space-between',
    fontFamily: 'system-ui, sans-serif',
  };

  const valueStyle: React.CSSProperties = {
    color: '#8ab4f8',
    fontFamily: 'monospace',
    fontWeight: 600,
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 0',
    border: 'none',
    borderRadius: 8,
    background: isGrowing
      ? 'linear-gradient(135deg, #e74c3c, #c0392b)'
      : 'linear-gradient(135deg, #4a6cf7, #6c5ce7)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: isGrowing ? 'not-allowed' : 'pointer',
    transition: 'all 0.25s ease',
    letterSpacing: 1,
    boxShadow: isGrowing
      ? '0 2px 8px rgba(231,76,60,0.3)'
      : '0 4px 16px rgba(74,108,247,0.3)',
  };

  return (
    <>
      <div style={panelStyle}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              color: '#e0e0e0',
              fontSize: 16,
              fontWeight: 700,
              margin: 0,
              letterSpacing: 1,
            }}
          >
            🏙️ 城市控制面板
          </h2>
          {isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                background: 'rgba(74,108,247,0.2)',
                border: '1px solid #4a6cf7',
                color: '#8ab4f8',
                borderRadius: 6,
                padding: '4px 12px',
                cursor: 'pointer',
                fontSize: 12,
                transition: 'all 0.2s',
              }}
            >
              {collapsed ? '展开 ▲' : '收起 ▼'}
            </button>
          )}
        </div>

        <div style={{ color: '#8ab4f8', fontSize: 12, marginBottom: 16, fontFamily: 'monospace' }}>
          当前建筑数量: <span style={{ fontWeight: 700 }}>{buildingCount}</span>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>
            建筑密度
            <span style={valueStyle}>{config.buildingDensity} 栋</span>
          </label>
          <input
            type="range"
            min={30}
            max={500}
            step={1}
            value={config.buildingDensity}
            onChange={(e) => onConfigChange('buildingDensity', Number(e.target.value))}
            style={sliderStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>
            生长速度
            <span style={valueStyle}>{config.growthSpeed.toFixed(1)}x</span>
          </label>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.1}
            value={config.growthSpeed}
            onChange={(e) => onConfigChange('growthSpeed', Number(e.target.value))}
            style={sliderStyle}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>
            最高楼限制
            <span style={valueStyle}>{config.maxHeight} 单位</span>
          </label>
          <input
            type="range"
            min={50}
            max={400}
            step={5}
            value={config.maxHeight}
            onChange={(e) => onConfigChange('maxHeight', Number(e.target.value))}
            style={sliderStyle}
          />
        </div>

        <button
          onClick={onStartGrowth}
          disabled={isGrowing}
          style={buttonStyle}
          onMouseEnter={(e) => {
            if (!isGrowing) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(74,108,247,0.45)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = isGrowing
              ? '0 2px 8px rgba(231,76,60,0.3)'
              : '0 4px 16px rgba(74,108,247,0.3)';
          }}
        >
          {isGrowing ? '⏳ 生长中...' : '🚀 开始生长'}
        </button>

        {growthComplete && (
          <div
            style={{
              marginTop: 16,
              padding: '10px 16px',
              background: 'rgba(46,204,113,0.15)',
              border: '1px solid rgba(46,204,113,0.4)',
              borderRadius: 8,
              color: '#2ecc71',
              fontSize: 13,
              textAlign: 'center',
              animation: 'fadeSlideIn 0.3s ease',
            }}
          >
            ✅ 生长完成！
          </div>
        )}
      </div>

      {isMobile && collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          style={{
            position: 'fixed',
            bottom: 12,
            right: 12,
            background: 'linear-gradient(135deg, #4a6cf7, #6c5ce7)',
            border: 'none',
            color: '#fff',
            borderRadius: 30,
            padding: '10px 18px',
            cursor: 'pointer',
            fontSize: 13,
            zIndex: 101,
            boxShadow: '0 4px 16px rgba(74,108,247,0.4)',
            transition: 'all 0.2s',
          }}
        >
          🏙️ 面板
        </button>
      )}
    </>
  );
}

function BuildingInfoPanel({
  info,
  onClose,
}: {
  info: BuildingInfo;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        left: 16,
        background: 'rgba(10,10,30,0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid #4a6cf7',
        borderRadius: 10,
        padding: '16px 20px',
        zIndex: 110,
        minWidth: 200,
        fontFamily: 'monospace',
        animation: 'fadeSlideIn 0.25s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <span style={{ color: '#8ab4f8', fontSize: 14, fontWeight: 700 }}>
          🏢 建筑信息
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#aaa',
            borderRadius: 4,
            width: 24,
            height: 24,
            cursor: 'pointer',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = '#aaa';
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ color: '#e0e0e0', fontSize: 12, lineHeight: 1.8 }}>
        <div>
          编号: <span style={{ color: '#8ab4f8' }}>{info.id.slice(0, 8)}</span>
        </div>
        <div>
          高度: <span style={{ color: '#f0c040' }}>{info.height.toFixed(1)}</span> 单位
        </div>
        <div>
          层数: <span style={{ color: '#2ecc71' }}>{info.floors}</span> 层
        </div>
        <div>
          风格: <span style={{ color: '#e74c3c' }}>{styleLabels[info.style] || info.style}</span>
        </div>
      </div>
    </div>
  );
}

function GrowthCompleteOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 200,
      }}
    >
      <div
        style={{
          color: '#fff',
          fontSize: 48,
          fontWeight: 800,
          letterSpacing: 4,
          textShadow: '0 0 30px rgba(74,108,247,0.8), 0 0 60px rgba(108,92,231,0.5)',
          animation: 'growComplete 2.5s ease forwards',
        }}
      >
        🏙️ 生长完成
      </div>
    </div>
  );
}

export default function App() {
  const cityManagerRef = useRef<CityManager | null>(null);
  const [config, setConfig] = useState<CityConfig>(INITIAL_CONFIG);
  const [isGrowing, setIsGrowing] = useState(false);
  const [growthComplete, setGrowthComplete] = useState(false);
  const [buildingCount, setBuildingCount] = useState(0);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInfo | null>(null);
  const [showCompleteOverlay, setShowCompleteOverlay] = useState(false);
  const prevDensityRef = useRef(config.buildingDensity);

  const handleConfigChange = useCallback(
    (key: keyof CityConfig, value: number) => {
      setConfig((prev) => {
        const next = { ...prev, [key]: value };
        if (key === 'buildingDensity' && cityManagerRef.current) {
          cityManagerRef.current.adjustDensity(value);
        }
        if (key === 'growthSpeed' && cityManagerRef.current) {
          cityManagerRef.current.config.growthSpeed = value;
        }
        if (key === 'maxHeight' && cityManagerRef.current) {
          cityManagerRef.current.config.maxHeight = value;
        }
        return next;
      });
    },
    []
  );

  const handleStartGrowth = useCallback(() => {
    if (isGrowing || !cityManagerRef.current) return;
    setIsGrowing(true);
    setGrowthComplete(false);
    setShowCompleteOverlay(false);

    const manager = cityManagerRef.current;
    manager.onGrowthComplete = () => {
      setIsGrowing(false);
      setGrowthComplete(true);
      setShowCompleteOverlay(true);
      setTimeout(() => setShowCompleteOverlay(false), 3000);
    };

    manager.startGrowth();
  }, [isGrowing]);

  const handleBuildingClick = useCallback((info: BuildingInfo | null) => {
    setSelectedBuilding(info);
  }, []);

  useEffect(() => {
    const manager = cityManagerRef.current;
    if (manager) {
      manager.onBuildingCountChange = setBuildingCount;
      setBuildingCount(manager.buildings.size);
    }
  }, []);

  const handleCloseInfo = useCallback(() => {
    if (selectedBuilding && cityManagerRef.current) {
      cityManagerRef.current.unhighlightBuilding(selectedBuilding.id);
    }
    setSelectedBuilding(null);
  }, [selectedBuilding]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes growComplete {
          0% { opacity: 0; transform: scale(0.5); }
          30% { opacity: 1; transform: scale(1.1); }
          60% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.3); }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4a6cf7, #9b59b6);
          cursor: pointer;
          box-shadow: 0 0 8px rgba(74,108,247,0.5);
          transition: all 0.2s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 12px rgba(74,108,247,0.7);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4a6cf7, #9b59b6);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 8px rgba(74,108,247,0.5);
        }
        * { scrollbar-width: thin; scrollbar-color: #4a6cf7 rgba(10,10,30,0.5); }
        *::-webkit-scrollbar { width: 6px; }
        *::-webkit-scrollbar-track { background: rgba(10,10,30,0.5); }
        *::-webkit-scrollbar-thumb { background: #4a6cf7; border-radius: 3px; }
      `}</style>

      <CityCanvas
        cityManagerRef={cityManagerRef}
        config={config}
        onBuildingClick={handleBuildingClick}
      />

      <ControlPanel
        config={config}
        onConfigChange={handleConfigChange}
        onStartGrowth={handleStartGrowth}
        isGrowing={isGrowing}
        growthComplete={growthComplete}
        buildingCount={buildingCount}
      />

      {selectedBuilding && (
        <BuildingInfoPanel info={selectedBuilding} onClose={handleCloseInfo} />
      )}

      <GrowthCompleteOverlay visible={showCompleteOverlay} />
    </div>
  );
}
