import { useEffect, useRef, useState, useCallback } from 'react';
import { GameManager } from './GameManager';
import { GameCanvas } from './ui/GameCanvas';
import { ControlPanel } from './ui/ControlPanel';
import { StatusBar } from './ui/StatusBar';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameManagerRef = useRef<GameManager | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [gameState, setGameState] = useState({
    armor: 100,
    maxArmor: 100,
    energy: 0,
    maxEnergy: 100,
    energyCollected: 0,
    energyTarget: 10,
    score: 0,
    status: 'playing' as 'playing' | 'won' | 'lost',
    shieldActive: false,
  });
  const [armorFlashing, setArmorFlashing] = useState(false);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      const gameManager = new GameManager(dimensions.width, dimensions.height);
      gameManagerRef.current = gameManager;

      const unsubscribe = gameManager.subscribe(() => {
        const ship = gameManager.getShip();
        const state = gameManager.getGameState();
        setGameState({
          armor: ship.armor,
          maxArmor: ship.maxArmor,
          energy: ship.energy,
          maxEnergy: ship.maxEnergy,
          energyCollected: state.energyCollected,
          energyTarget: state.energyTarget,
          score: state.score,
          status: state.status,
          shieldActive: ship.shieldActive,
        });
        setArmorFlashing(gameManager.isArmorFlashing());
        forceUpdate(n => n + 1);
      });

      gameManager.start();

      return () => {
        unsubscribe();
        gameManager.stop();
      };
    }
  }, [dimensions.width, dimensions.height]);

  useEffect(() => {
    if (gameManagerRef.current) {
      gameManagerRef.current.resize(dimensions.width, dimensions.height);
    }
  }, [dimensions]);

  const handleThrustChange = useCallback((angle: number, magnitude: number) => {
    if (gameManagerRef.current) {
      gameManagerRef.current.setThrustInput(angle, magnitude);
    }
  }, []);

  const handleRestart = useCallback(() => {
    if (gameManagerRef.current) {
      gameManagerRef.current.restart();
    }
  }, []);

  const handleCanvasClick = useCallback(() => {
    if (gameState.status === 'won' || gameState.status === 'lost') {
      handleRestart();
    }
  }, [gameState.status, handleRestart]);

  const joystickSize = Math.min(120, dimensions.width * 0.2);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0a0e27]">
      <div
        ref={containerRef}
        className="relative w-full h-full"
        onClick={handleCanvasClick}
      >
        {gameManagerRef.current && (
          <GameCanvas
            gameManager={gameManagerRef.current}
            width={dimensions.width}
            height={dimensions.height}
          />
        )}

        {gameState.status === 'playing' && (
          <>
            <StatusBar
              armor={gameState.armor}
              maxArmor={gameState.maxArmor}
              energy={gameState.energy}
              maxEnergy={gameState.maxEnergy}
              energyCollected={gameState.energyCollected}
              energyTarget={gameState.energyTarget}
              score={gameState.score}
              armorFlashing={armorFlashing}
              shieldActive={gameState.shieldActive}
            />

            <ControlPanel
              onThrustChange={handleThrustChange}
              size={joystickSize}
            />

            <div
              className="absolute right-8 top-24 p-4 rounded-xl text-white"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="text-sm font-bold mb-2 text-amber-400">任务目标</div>
              <div className="text-xs text-white/70 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">◆</span>
                  <span>收集 {gameState.energyTarget} 个能量块</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">◎</span>
                  <span>抵达空间站</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/50">
                提示：使用左下角摇杆控制飞船
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
