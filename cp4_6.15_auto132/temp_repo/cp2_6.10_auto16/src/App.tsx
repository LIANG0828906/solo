import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass } from './components/Compass';
import { Sea } from './components/Sea';
import { Dashboard } from './components/Dashboard';
import { RudderControl } from './components/RudderControl';
import { TokenBadge } from './components/TokenBadge';
import { Seagull } from './components/Seagull';
import { useNavigationStore } from './store/useNavigationStore';
import type { TrackPoint } from './types';

const DEG_TO_RAD = Math.PI / 180;

export default function App() {
  const {
    rudderAngle,
    windSpeed,
    windDirection,
    headingError,
    actualHeading,
    sailingTime,
    yawCount,
    tokenCount,
    stableDuration,
    stormModeUnlocked,
    isStormMode,
    shipMotion,
    waveParams,
    flagDeflection,
    isShaking,
    isGameOver,
    setRudderAngle,
    incrementRudderAngle,
    update,
    resetGame,
    toggleStormMode
  } = useNavigationStore();

  const lastTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const trackPointsRef = useRef<Array<TrackPoint>>([]);
  const [trackPoints, setTrackPoints] = useState<Array<TrackPoint>>([]);
  const [showNewToken, setShowNewToken] = useState(false);
  const prevTokenCountRef = useRef(tokenCount);
  const [compassJitter, setCompassJitter] = useState({ x: 0, y: 0, rotation: 0 });

  const handleJitterUpdate = useCallback((jitter: { x: number; y: number; rotation: number }) => {
    setCompassJitter(jitter);
  }, []);

  const animationLoop = useCallback((timestamp: number) => {
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
    }

    const delta = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;
    const clampedDelta = Math.min(delta, 0.1);

    update(clampedDelta);

    if (!isGameOver) {
      const shipX = window.innerWidth * 0.2;
      const shipY = window.innerHeight * 0.5;
      const speed = 2;
      const newPoint: TrackPoint = {
        x: shipX + Math.sin(actualHeading * DEG_TO_RAD) * speed * clampedDelta * 60,
        y: shipY - Math.cos(actualHeading * DEG_TO_RAD) * speed * clampedDelta * 60,
        heading: actualHeading,
        timestamp: sailingTime
      };

      trackPointsRef.current.push(newPoint);
      if (trackPointsRef.current.length > 200) {
        trackPointsRef.current = trackPointsRef.current.slice(-200);
      }
      setTrackPoints([...trackPointsRef.current]);
    }

    animationFrameRef.current = requestAnimationFrame(animationLoop);
  }, [update, actualHeading, sailingTime, isGameOver]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animationLoop);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [animationLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;

      switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        incrementRudderAngle(-2);
        break;
      case 'ArrowRight':
        e.preventDefault();
        incrementRudderAngle(2);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setRudderAngle(0);
        break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [incrementRudderAngle, setRudderAngle, isGameOver]);

  useEffect(() => {
    if (tokenCount > prevTokenCountRef.current) {
      setShowNewToken(true);
      const timer = setTimeout(() => setShowNewToken(false), 3000);
      prevTokenCountRef.current = tokenCount;
      return () => clearTimeout(timer);
    }
  }, [tokenCount]);

  const handleReset = () => {
    trackPointsRef.current = [];
    setTrackPoints([]);
    lastTimeRef.current = 0;
    resetGame();
  };

  return (
    <div
      className="app-container"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: 'var(--color-deep-wood)',
        overflow: 'hidden'
      }}
    >
      <Seagull count={5} enabled={isStormMode} />

      <div
        className="sea-panel"
        style={{
          width: '40%',
          height: '100%',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
          textAlign: 'center',
          padding: '12px',
          borderBottom: '2px solid var(--color-copper-gold)',
          marginBottom: '8px'
        }}
        >
          <h1
            style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'var(--color-gold)',
            fontFamily: 'serif',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
            marginBottom: '4px'
          }}
        >
            宋代海船罗盘导航模拟
          </h1>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--color-canvas)',
              opacity: 0.8
            }}
          >
            火长，保持航向稳定60秒即可获得太平航海令牌
          </p>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            position: 'relative',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        >
          <Sea
            waveParams={waveParams}
            shipMotion={shipMotion}
            headingError={headingError}
            actualHeading={actualHeading}
            isStormMode={isStormMode}
            isShaking={isShaking}
            flagDeflection={flagDeflection}
            windSpeed={windSpeed}
            trackPoints={trackPoints}
          />
        </div>

        <TokenBadge count={tokenCount} isNew={showNewToken} />

        {stormModeUnlocked && (
          <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleStormMode}
          style={{
            padding: '12px',
            border: '2px solid var(--color-copper-gold)',
            borderRadius: '6px',
            backgroundColor: isStormMode ? 'var(--color-warning-red)' : 'var(--color-teak)',
            color: 'var(--color-ivory)',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: 'serif',
            transition: 'all 0.2s ease'
          }}
        >
          {isStormMode ? '🌊 退出风暴海模式' : '⚓ 进入风暴海模式'}
        </motion.button>
        )}
      </div>

      <div
        className="control-panel"
        style={{
          width: '60%',
          height: '100%',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflowY: 'auto'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            backgroundColor: 'rgba(184, 115, 51, 0.1)',
            border: '3px solid var(--color-copper-gold)',
            borderRadius: '8px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '20px',
              top: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <div
              style={{
                width: '8px',
                height: '80px',
                backgroundColor: 'var(--color-mast)',
                borderRadius: '4px'
              }}
            />
            <motion.div
              animate={{
                skewX: [0, 5, 0, -5, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              style={{
                width: 0,
                height: 0,
                borderLeft: '30px solid transparent',
                borderBottom: `40px solid var(--color-canvas)`,
                transformOrigin: 'left bottom',
                filter: 'drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.3)'
              }}
            />
          </div>

          <Compass
            headingError={headingError}
            shipRoll={shipMotion.rollX}
            windSpeed={windSpeed}
            isStormMode={isStormMode}
            size={260}
            onJitterUpdate={handleJitterUpdate}
          />

          <div
            style={{
              position: 'absolute',
              right: '20px',
              bottom: '20px',
              textAlign: 'center',
              padding: '8px 12px',
              backgroundColor: 'rgba(42, 26, 10, 0.7)',
              borderRadius: '4px',
              border: '1px solid var(--color-copper-gold)'
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: 'var(--color-canvas)',
                marginBottom: '2px'
              }}
            >
              测风旗偏角
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'var(--color-gold)'
              }}
            >
              {flagDeflection.toFixed(0)}°
            </div>
            <div
              style={{
                fontSize: '10px',
                color: 'var(--color-canvas)',
                opacity: 0.7,
                marginTop: '2px'
              }}
            >
              风向: {windDirection.toFixed(0)}°
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              left: '20px',
              bottom: '20px',
              textAlign: 'center',
              padding: '8px 12px',
              backgroundColor: 'rgba(42, 26, 10, 0.7)',
              borderRadius: '4px',
              border: '1px solid var(--color-copper-gold)'
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: 'var(--color-canvas)',
                marginBottom: '2px'
              }}
            >
              舵角
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: rudderAngle !== 0 ? 'var(--color-warning-red)' : 'var(--color-gold)'
              }}
            >
              {rudderAngle > 0 ? '+' : ''}{rudderAngle}°
            </div>
          </div>
        </div>

        <Dashboard
          windSpeed={windSpeed}
          headingError={headingError}
          sailingTime={sailingTime}
          yawCount={yawCount}
          stableDuration={stableDuration}
          isStormMode={isStormMode}
        />

        <RudderControl
          rudderAngle={rudderAngle}
          onRudderChange={setRudderAngle}
          onIncrement={incrementRudderAngle}
          disabled={isGameOver}
        />

        <AnimatePresence>
          {isGameOver && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
                backdropFilter: 'blur(4px)'
              }}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                style={{
                  padding: '40px 60px',
                  backgroundColor: 'var(--color-canvas)',
                  border: '4px solid var(--color-copper-gold)',
                  borderRadius: '12px',
                  textAlign: 'center',
                  boxShadow: '0 0 50px rgba(255, 215, 0, 0.3)'
                }}
              >
                <h2
                  style={{
                    fontSize: '36px',
                    color: 'var(--color-warning-red)',
                    marginBottom: '16px',
                    fontFamily: 'serif'
                  }}
                >
                  船只迷失航向！
                </h2>
                <p
                  style={{
                    fontSize: '18px',
                    color: 'var(--color-deep-wood)',
                    marginBottom: '24px'
                  }}
                >
                  航行时间: {Math.floor(sailingTime)}秒 | 偏航次数: {yawCount}次
                </p>
                <p
                  style={{
                    fontSize: '16px',
                    color: 'var(--color-deep-wood)',
                    marginBottom: '24px',
                    opacity: 0.8
                  }}
                >
                  已获得太平航海令牌: {tokenCount}枚
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReset}
                  style={{
                    padding: '14px 40px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'var(--color-ivory)',
                    backgroundColor: 'var(--color-teak)',
                    border: '3px solid var(--color-copper-gold)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontFamily: 'serif',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
                  }}
                >
                  重新启航
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #d4a574, #b87333, #8b4513);
          border: 2px solid #5d3a1a;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
          transition: all 0.2s ease;
        }

        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
        }

        input[type='range']::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #d4a574, #b87333, #8b4513);
          border: 2px solid #5d3a1a;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        }

        .control-panel::-webkit-scrollbar {
          width: 8px;
        }

        .control-panel::-webkit-scrollbar-track {
          background: rgba(42, 26, 10, 0.3);
          border-radius: 4px;
        }

        .control-panel::-webkit-scrollbar-thumb {
          background: var(--color-copper-gold);
          border-radius: 4px;
        }

        .control-panel::-webkit-scrollbar-thumb:hover {
          background: var(--color-bronze);
        }
      `}</style>
    </div>
  );
}
