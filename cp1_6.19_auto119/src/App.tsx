import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { FleetCanvas } from './ui/FleetCanvas';
import { ControlPanel } from './ui/ControlPanel';
import { WeaponEditor } from './ui/WeaponEditor';
import { ReplayBar } from './ui/ReplayBar';
import { CombatSimulator } from './combat/simulator';
import { eventBus, type CombatState, type FormationType, type WeaponType, type WeaponConfig } from './eventBus';

interface GameContextType {
  state: CombatState | null;
  simulator: CombatSimulator | null;
}

const GameContext = createContext<GameContextType>({
  state: null,
  simulator: null,
});

export const useGame = () => useContext(GameContext);

const App: React.FC = () => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const simulatorRef = useRef<CombatSimulator | null>(null);
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateSize = () => {
      if (canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        setCanvasSize({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height),
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const simulator = new CombatSimulator(canvasSize.width, canvasSize.height);
    simulatorRef.current = simulator;
    setCombatState(simulator.getState());
    simulator.start();

    const unsubscribe = eventBus.on('frame:update', () => {
      if (simulatorRef.current) {
        setCombatState({ ...simulatorRef.current.getDisplayState() });
      }
    });

    return () => {
      simulator.stop();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (simulatorRef.current) {
      simulatorRef.current.setCanvasSize(canvasSize.width, canvasSize.height);
    }
  }, [canvasSize]);

  const handleShipClick = useCallback((shipId: string, isEnemy: boolean) => {
    eventBus.emit('ship:click', { shipId, isEnemy });
  }, []);

  if (!combatState) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: '#0B0C10',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#C5C6C7',
        }}
      >
        加载中...
      </div>
    );
  }

  return (
    <GameContext.Provider value={{ state: combatState, simulator: simulatorRef.current }}>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: '#0B0C10',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: '"SF Mono", "Fira Code", "Consolas", monospace',
        }}
      >
        <header
          style={{
            padding: '12px 24px',
            borderBottom: '1px solid #1F2833',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                fontSize: '24px',
                color: '#66FCF1',
              }}
            >
              ⚔️
            </span>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: '18px',
                  color: '#66FCF1',
                  fontWeight: 600,
                  letterSpacing: '2px',
                }}
              >
                FLEET COMMAND SIMULATOR
              </h1>
              <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>
                太空舰队阵型与集火模拟系统 v1.0
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#666' }}>
            <div>
              己方舰船: <span style={{ color: '#45A29E' }}>{combatState.playerFleet.length}</span>
            </div>
            <div>
              敌方舰船: <span style={{ color: '#E74C3C' }}>{combatState.enemyFleet.length}</span>
            </div>
            <div>
              攻击线: <span style={{ color: '#FFB347' }}>{combatState.attackLines.length}</span>
            </div>
          </div>
        </header>

        <div
          style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
            flexDirection: window.innerWidth < 768 ? 'column' : 'row',
          }}
        >
          <div
            ref={canvasContainerRef}
            style={{
              flex: window.innerWidth < 768 ? '1' : '0 0 70%',
              position: 'relative',
              overflow: 'hidden',
              minHeight: window.innerWidth < 768 ? '300px' : '0',
            }}
          >
            <FleetCanvas
              playerFleet={combatState.playerFleet}
              enemyFleet={combatState.enemyFleet}
              attackLines={combatState.attackLines}
              showRange={combatState.showRange}
              selectedTargetId={combatState.selectedTargetId}
              selectedShipId={combatState.selectedShipId}
              weaponConfigs={combatState.weaponConfigs}
              onShipClick={handleShipClick}
              width={canvasSize.width}
              height={canvasSize.height}
            />
          </div>

          <div
            style={{
              flex: window.innerWidth < 768 ? 'none' : '1',
              width: window.innerWidth < 768 ? '100%' : 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              overflowY: 'auto',
              borderLeft: window.innerWidth < 768 ? 'none' : '1px solid #1F2833',
              borderTop: window.innerWidth < 768 ? '1px solid #1F2833' : 'none',
            }}
          >
            <ControlPanel
              currentFormation={combatState.currentFormation}
              showRange={combatState.showRange}
              selectedTargetId={combatState.selectedTargetId}
              enemyCount={combatState.enemyFleet.length}
            />
            <WeaponEditor weaponConfigs={combatState.weaponConfigs as Record<WeaponType, WeaponConfig>} />
          </div>
        </div>

        <div style={{ padding: '12px 24px', borderTop: '1px solid #1F2833' }}>
          <ReplayBar
            isRecording={combatState.isRecording}
            isPlaying={combatState.isPlaying}
            currentFrame={combatState.currentFrame}
            totalFrames={combatState.recordedFrames.length}
            playbackSpeed={combatState.playbackSpeed}
          />
        </div>
      </div>
    </GameContext.Provider>
  );
};

export default App;
