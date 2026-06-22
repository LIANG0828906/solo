import { useState, useEffect, useCallback, useRef } from 'react';
import GameCanvas from './GameCanvas';
import UpgradePanel from './UpgradePanel';
import {
  createInitialState,
  upgradeLaser,
  upgradeShip,
  upgradeAsteroid,
  clickMine,
  autoMine,
  updateShips,
  checkAsteroidFull,
  getLaserCost,
  getShipCost,
  getAsteroidCost,
  createAsteroid,
  type GameState,
} from './gameState';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => createInitialState());
  const [showTransition, setShowTransition] = useState(false);
  const [transitionText, setTransitionText] = useState('');
  const [transitionAlpha, setTransitionAlpha] = useState(0);
  const lastUpdateRef = useRef(performance.now());
  const animFrameRef = useRef<number | null>(null);

  const handleMine = useCallback(() => {
    setGameState((prev) => {
      const newState = clickMine(prev);
      return checkAsteroidFull(newState);
    });
  }, []);

  const handleAsteroidBroken = useCallback(() => {
  }, []);

  const handleBreakComplete = useCallback(() => {
    setGameState((prev) => {
      const nextLevel = prev.asteroidLevel + 1;
      const newAsteroid = createAsteroid(nextLevel);
      setTransitionText(`到达 ${nextLevel} 号矿星`);
      setShowTransition(true);
      setTransitionAlpha(0);
      
      setTimeout(() => {
        setTransitionAlpha(1);
      }, 50);
      
      setTimeout(() => {
        setTransitionAlpha(0);
        setTimeout(() => {
          setShowTransition(false);
        }, 500);
      }, 1500);
      
      return {
        ...prev,
        asteroidLevel: nextLevel,
        asteroid: newAsteroid,
        asteroidBreaking: false,
        breakProgress: 0,
      };
    });
  }, []);

  const handleUpgradeLaser = useCallback(() => {
    setGameState((prev) => upgradeLaser(prev));
  }, []);

  const handleUpgradeShip = useCallback(() => {
    setGameState((prev) => upgradeShip(prev));
  }, []);

  const handleUpgradeAsteroid = useCallback(() => {
    setGameState((prev) => {
      const newState = upgradeAsteroid(prev);
      if (newState.asteroidLevel !== prev.asteroidLevel) {
        setTransitionText(`到达 ${newState.asteroidLevel} 号矿星`);
        setShowTransition(true);
        setTransitionAlpha(0);
        
        setTimeout(() => {
          setTransitionAlpha(1);
        }, 50);
        
        setTimeout(() => {
          setTransitionAlpha(0);
          setTimeout(() => {
            setShowTransition(false);
          }, 500);
        }, 1500);
      }
      return newState;
    });
  }, []);

  useEffect(() => {
    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastUpdateRef.current;
      lastUpdateRef.current = currentTime;

      setGameState((prev) => {
        let state = updateShips(prev, deltaTime);
        state = autoMine(state, deltaTime, currentTime);
        state = checkAsteroidFull(state);
        return state;
      });

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const laserCost = getLaserCost(gameState.laserLevel);
  const shipCost = getShipCost(gameState.shipCount);
  const asteroidCost = getAsteroidCost(gameState.asteroidLevel);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0a0a2e',
        minWidth: 1024,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <GameCanvas
          coins={gameState.coins}
          laserLevel={gameState.laserLevel}
          ships={gameState.ships}
          asteroidLevel={gameState.asteroidLevel}
          asteroidCapacity={gameState.asteroid.capacity}
          asteroidOreCount={gameState.asteroid.oreCount}
          mineralSpots={gameState.asteroid.mineralSpots}
          asteroidBreaking={gameState.asteroidBreaking}
          breakProgress={gameState.breakProgress}
          onMine={handleMine}
          onAsteroidBroken={handleAsteroidBroken}
          onBreakComplete={handleBreakComplete}
        />
        
        {showTransition && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              opacity: transitionAlpha,
              transition: 'opacity 0.5s ease-in-out',
            }}
          >
            <div
              style={{
                fontSize: 36,
                fontWeight: 'bold',
                color: '#ffffff',
                textShadow: '0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.5)',
                letterSpacing: 2,
              }}
            >
              {transitionText}
            </div>
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 30,
            color: '#ffd700',
            fontSize: 24,
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
          }}
        >
          🚀 太空采矿大亨
        </div>
      </div>

      <UpgradePanel
        coins={gameState.coins}
        laserLevel={gameState.laserLevel}
        shipCount={gameState.shipCount}
        asteroidLevel={gameState.asteroidLevel}
        laserCost={laserCost}
        shipCost={shipCost}
        asteroidCost={asteroidCost}
        onUpgradeLaser={handleUpgradeLaser}
        onUpgradeShip={handleUpgradeShip}
        onUpgradeAsteroid={handleUpgradeAsteroid}
      />
    </div>
  );
}
