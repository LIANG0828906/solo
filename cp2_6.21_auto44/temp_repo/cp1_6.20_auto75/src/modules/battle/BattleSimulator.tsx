import { useState, useEffect, useCallback, useRef } from 'react';
import type { Dragon, TeamConfig, BattleResult, BattleDragon, BattleLogEntry } from '../../shared/types';
import { eventBus, EVENTS } from '../../shared/EventBus';
import { dataService } from '../editor/DataService';
import { BattleEngine } from './BattleEngine';
import BattleUnit from './BattleUnit';
import BattleLogPanel from './BattleLogPanel';
import BattleResultModal from './BattleResultModal';
import './BattleSimulator.css';

const GRID_COLS = 6;
const GRID_ROWS = 5;

export default function BattleSimulator() {
  const [playerTeam, setPlayerTeam] = useState<BattleDragon[]>([]);
  const [enemyTeam, setEnemyTeam] = useState<BattleDragon[]>([]);
  const [logs, setLogs] = useState<BattleLogEntry[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [actingDragonId, setActingDragonId] = useState<string | null>(null);
  const [targetDragonId, setTargetDragonId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasBattleStarted, setHasBattleStarted] = useState(false);

  const engineRef = useRef<BattleEngine | null>(null);
  const animationRef = useRef<number | null>(null);
  const logIndexRef = useRef(0);

  useEffect(() => {
    const handleTeamSubmitted = (data: unknown) => {
      const teamConfig = data as TeamConfig;
      if (teamConfig && teamConfig.dragons.length > 0) {
        startBattle(teamConfig.dragons);
      }
    };

    eventBus.on(EVENTS.TEAM_SUBMITTED, handleTeamSubmitted);

    return () => {
      eventBus.off(EVENTS.TEAM_SUBMITTED, handleTeamSubmitted);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const generateEnemyTeam = useCallback((playerCount: number): Dragon[] => {
    const allDragons = dataService.getAllDragons();
    const shuffled = [...allDragons].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(playerCount, 5));
  }, []);

  const startBattle = useCallback((playerDragons: Dragon[]) => {
    setIsSimulating(true);
    setHasBattleStarted(true);

    setTimeout(() => {
      const enemyDragons = generateEnemyTeam(playerDragons.length);
      const engine = new BattleEngine(playerDragons, enemyDragons);
      engineRef.current = engine;

      setPlayerTeam(engine.getPlayerTeam());
      setEnemyTeam(engine.getEnemyTeam());
      setLogs([]);
      setCurrentTurn(0);
      setBattleResult(null);
      setShowResultModal(false);
      logIndexRef.current = 0;

      setIsSimulating(false);
      setIsPlaying(true);

      setTimeout(() => {
        runSimulation();
      }, 500);
    }, 800);
  }, [generateEnemyTeam]);

  const runSimulation = useCallback(() => {
    if (!engineRef.current) return;

    const result = engineRef.current.simulate(30);
    setBattleResult(result);

    animateLogs(result.logs);
  }, []);

  const animateLogs = useCallback((allLogs: BattleLogEntry[]) => {
    let index = 0;
    const playerTeamState = engineRef.current?.getPlayerTeam() || [];
    const enemyTeamState = engineRef.current?.getEnemyTeam() || [];

    const animate = () => {
      if (index < allLogs.length) {
        const batchSize = 1;
        const newLogs = allLogs.slice(0, index + batchSize);
        setLogs(newLogs);

        const currentLog = allLogs[Math.max(0, index)];
        if (currentLog) {
          setCurrentTurn(currentLog.turn);

          if (currentLog.target) {
            const allDragons = [...playerTeamState, ...enemyTeamState];
            const target = allDragons.find((d) => d.name === currentLog.target);
            if (target) {
              setTargetDragonId(target.id);
              setTimeout(() => setTargetDragonId(null), 300);
            }
          }

          if (currentLog.actorTeam === 'player' || currentLog.actorTeam === 'enemy') {
            const allDragons = [...playerTeamState, ...enemyTeamState];
            const actor = allDragons.find((d) => d.name === currentLog.actor);
            if (actor && currentLog.actor !== '系统') {
              setActingDragonId(actor.id);
              setTimeout(() => setActingDragonId(null), 400);
            }
          }
        }

        index += batchSize;
        setTimeout(() => {
          animationRef.current = requestAnimationFrame(animate);
        }, 150);
      } else {
        setIsPlaying(false);
        setActingDragonId(null);
        setTargetDragonId(null);

        if (engineRef.current) {
          setPlayerTeam(engineRef.current.getPlayerTeam());
          setEnemyTeam(engineRef.current.getEnemyTeam());
        }

        setTimeout(() => {
          setShowResultModal(true);
        }, 500);

        eventBus.emit(EVENTS.BATTLE_RESULT, battleResult);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [battleResult]);

  const handleCloseModal = useCallback(() => {
    setShowResultModal(false);
  }, []);

  const handleRestart = useCallback(() => {
    setShowResultModal(false);
    setLogs([]);
    setCurrentTurn(0);
    setPlayerTeam([]);
    setEnemyTeam([]);
    setBattleResult(null);
    setHasBattleStarted(false);
    logIndexRef.current = 0;
    engineRef.current = null;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  const getDragonAtPosition = (row: number, col: number, side: 'player' | 'enemy'): BattleDragon | undefined => {
    const team = side === 'player' ? playerTeam : enemyTeam;
    return team.find((d) => d.position.row === row && d.position.col === col && d.isAlive);
  };

  const renderGrid = () => {
    const cells = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const isPlayerSide = col < 3;
        const dragon = getDragonAtPosition(row, col % 3, isPlayerSide ? 'player' : 'enemy');

        cells.push(
          <div
            key={`${row}-${col}`}
            className={`grid-cell ${isPlayerSide ? 'player-side' : 'enemy-side'}`}
          >
            {dragon && (
              <BattleUnit
                dragon={dragon}
                isActing={actingDragonId === dragon.id}
                isTarget={targetDragonId === dragon.id}
                size={70}
              />
            )}
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <div className="battle-simulator">
      <div className="battle-arena">
        <div className="arena-header">
          <div className="side-label player">
            <span className="side-dot" />
            我方
          </div>
          <div className="vs-text">VS</div>
          <div className="side-label enemy">
            敌方
            <span className="side-dot" />
          </div>
        </div>

        <div className="battle-grid">
          {hasBattleStarted ? (
            <div className={`grid-container ${isSimulating ? 'loading' : ''}`}>
              <div className="grid" style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
                gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
                gap: '8px',
                width: '100%',
                height: '100%',
              }}>
                {renderGrid()}
              </div>
              {isSimulating && (
                <div className="battle-loading">
                  <div className="loading-spinner" />
                  <span>准备战斗...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-arena">
              <div className="empty-arena-icon">⚔️</div>
              <p>选择阵容后开始战斗</p>
              <span className="empty-hint">从左侧选择最多5条龙组建你的战队</span>
            </div>
          )}
        </div>
      </div>

      <BattleLogPanel
        logs={logs}
        currentTurn={currentTurn}
        isPlaying={isPlaying}
      />

      <BattleResultModal
        isOpen={showResultModal}
        result={battleResult}
        playerTeam={playerTeam}
        enemyTeam={enemyTeam}
        onClose={handleCloseModal}
        onRestart={handleRestart}
      />
    </div>
  );
}
