import React, { useState, useEffect, useCallback, useRef } from 'react';
import PlantScene from './components/PlantScene';
import ControlPanel from './components/ControlPanel';
import GrowthChart from './components/GrowthChart';
import {
  GrowthParams,
  PlantMorphology,
  GrowthDataPoint,
  GrowthStage,
  createInitialMorphology,
  computeMorphology,
  STAGE_LABELS
} from './utils/plantGrowth';

const DEFAULT_PARAMS: GrowthParams = {
  light: 50,
  water: 60,
  soil: 40
};

const MAX_DATA_POINTS = 300;

const App: React.FC = () => {
  const [params, setParams] = useState<GrowthParams>(DEFAULT_PARAMS);
  const [morphology, setMorphology] = useState<PlantMorphology>(createInitialMorphology());
  const [growthTime, setGrowthTime] = useState(0);
  const [dataPoints, setDataPoints] = useState<GrowthDataPoint[]>([]);
  const [isResetting, setIsResetting] = useState(false);
  const [particleTrigger, setParticleTrigger] = useState<{ stage: GrowthStage; key: number } | null>(null);
  const [timeDisplayKey, setTimeDisplayKey] = useState(0);
  const [hoverInfo, setHoverInfo] = useState<string | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const prevStageRef = useRef<GrowthStage>('seed');
  const lastDataPointTimeRef = useRef(0);
  const resetStartHeightRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const checkNarrow = () => {
      setIsNarrow(window.innerWidth < 1024);
    };
    checkNarrow();
    window.addEventListener('resize', checkNarrow);
    return () => window.removeEventListener('resize', checkNarrow);
  }, []);

  const animationLoop = useCallback((timestamp: number) => {
    if (lastFrameTimeRef.current === null) {
      lastFrameTimeRef.current = timestamp;
    }
    const deltaTime = Math.min((timestamp - lastFrameTimeRef.current) / 1000, 0.1);
    lastFrameTimeRef.current = timestamp;

    setGrowthTime(prev => {
      const newTime = isResetting ? prev : prev + deltaTime;
      return newTime;
    });

    setMorphology(prev => {
      const newMorph = computeMorphology(prev.height, params, deltaTime, isResetting);

      if (!isResetting && prevStageRef.current !== newMorph.stage) {
        if (newMorph.stage === 'germination' || newMorph.stage === 'flowering') {
          setParticleTrigger({ stage: newMorph.stage, key: Date.now() });
        }
        prevStageRef.current = newMorph.stage;
      }

      if (isResetting && newMorph.height <= 0.001) {
        setIsResetting(false);
        return createInitialMorphology();
      }

      return newMorph;
    });

    if (!isResetting) {
      lastDataPointTimeRef.current += deltaTime;
      if (lastDataPointTimeRef.current >= 1.0) {
        lastDataPointTimeRef.current = 0;
        setGrowthTime(t => {
          setDataPoints(prev => {
            const newPoints = [...prev, { time: t, height: morphology.height * 100 }];
            if (newPoints.length > MAX_DATA_POINTS) {
              newPoints.shift();
            }
            return newPoints;
          });
          return t;
        });
      }
    }

    rafRef.current = requestAnimationFrame(animationLoop);
  }, [params, isResetting, morphology.height]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animationLoop);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [animationLoop]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeDisplayKey(k => k + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (particleTrigger) {
      const timer = setTimeout(() => setParticleTrigger(null), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [particleTrigger]);

  const handleParamsChange = useCallback((key: keyof GrowthParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = useCallback(() => {
    if (isResetting) return;
    resetStartHeightRef.current = morphology.height;
    setIsResetting(true);
    prevStageRef.current = 'seed';
    setTimeout(() => {
      setParams(DEFAULT_PARAMS);
      setGrowthTime(0);
      setDataPoints([]);
      lastDataPointTimeRef.current = 0;
      lastFrameTimeRef.current = null;
    }, 1000);
  }, [isResetting, morphology.height]);

  const toggleDrawer = useCallback(() => {
    setDrawerOpen(prev => !prev);
  }, []);

  const displaySeconds = Math.floor(growthTime);

  return (
    <div style={styles.appContainer}>
      <div style={styles.sceneContainer}>
        {isNarrow && (
          <button onClick={toggleDrawer} style={styles.hamburgerButton}>
            <span style={styles.hamburgerIcon}></span>
          </button>
        )}

        <div style={styles.timeDisplay}>
          <span style={{ display: 'inline-block' }}>生长时长: </span>
          <span
            key={timeDisplayKey}
            style={{
              ...styles.timeNumber,
              animation: 'flipNumber 0.2s ease-out'
            }}
          >
            {displaySeconds}秒
          </span>
        </div>

        {hoverInfo && (
          <div style={styles.hoverLabel}>{hoverInfo}</div>
        )}

        <PlantScene
          params={params}
          morphology={morphology}
          isResetting={isResetting}
          particleTrigger={particleTrigger}
          onHoverInfo={setHoverInfo}
        />
      </div>

      <div
        style={{
          ...styles.panelContainer,
          ...(isNarrow ? {
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            width: '280px',
            transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease',
            zIndex: 1000,
            borderRight: '1px solid #E0E0E0',
            borderRadius: 0
          } : {})
        }}
      >
        <div style={styles.panelHeader}>
          <h1 style={styles.panelTitle}>植物生长模拟器</h1>
          <div style={styles.panelDivider}></div>
        </div>

        <div style={styles.stageIndicator}>
          <div
            key={morphology.stage}
            style={{
              ...styles.stageText,
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            当前阶段: {STAGE_LABELS[morphology.stage]}
          </div>
        </div>

        <ControlPanel
          params={params}
          onParamsChange={handleParamsChange}
          onReset={handleReset}
          isResetting={isResetting}
        />

        <div style={{ ...styles.chartWrapper, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
          <GrowthChart dataPoints={dataPoints} stage={morphology.stage} />
        </div>
      </div>

      {isNarrow && drawerOpen && (
        <div
          style={styles.overlay}
          onClick={toggleDrawer}
        />
      )}

      <style>{`
        @keyframes flipNumber {
          0% { transform: rotateX(90deg); opacity: 0; }
          50% { transform: rotateX(-10deg); opacity: 0.8; }
          100% { transform: rotateX(0deg); opacity: 1; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(5px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    display: 'flex',
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A2E',
    color: '#EAEAEA'
  },
  sceneContainer: {
    flex: 7,
    position: 'relative',
    minWidth: 0,
    overflow: 'hidden'
  },
  panelContainer: {
    flex: 3,
    width: '280px',
    minWidth: '280px',
    backgroundColor: '#FFFFFF',
    borderLeft: '1px solid #E0E0E0',
    borderRadius: '8px 0 0 8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflowY: 'auto',
    boxSizing: 'border-box',
    color: '#333333'
  },
  hamburgerButton: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    zIndex: 100,
    width: '40px',
    height: '40px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: 'rgba(0,0,0,0.5)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)'
  },
  hamburgerIcon: {
    display: 'block',
    width: '20px',
    height: '2px',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    boxShadow: '0 -6px 0 #FFFFFF, 0 6px 0 #FFFFFF'
  },
  timeDisplay: {
    position: 'absolute',
    top: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    padding: '8px 16px',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: '8px',
    color: '#FFFFFF',
    fontSize: '16px',
    fontWeight: 500,
    backdropFilter: 'blur(4px)',
    whiteSpace: 'nowrap'
  },
  timeNumber: {
    fontVariantNumeric: 'tabular-nums',
    display: 'inline-block',
    transformOrigin: 'bottom center'
  },
  hoverLabel: {
    position: 'absolute',
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    padding: '6px 12px',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: '6px',
    color: '#FFFFFF',
    fontSize: '14px',
    pointerEvents: 'none'
  },
  panelHeader: {
    flexShrink: 0
  },
  panelTitle: {
    fontSize: '24px',
    color: '#1A1A2E',
    margin: 0,
    fontWeight: 700,
    textAlign: 'center'
  },
  panelDivider: {
    marginTop: '12px',
    height: '1px',
    backgroundColor: '#E0E0E0',
    borderRadius: '1px'
  },
  stageIndicator: {
    flexShrink: 0,
    padding: '10px 12px',
    backgroundColor: '#F0F9FF',
    borderRadius: '8px',
    border: '1px solid #BAE6FD',
    textAlign: 'center'
  },
  stageText: {
    fontSize: '14px',
    color: '#0369A1',
    fontWeight: 600
  },
  chartWrapper: {
    flexShrink: 0,
    width: '100%',
    backgroundColor: '#FFFFFF'
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 999
  }
};

export default App;
