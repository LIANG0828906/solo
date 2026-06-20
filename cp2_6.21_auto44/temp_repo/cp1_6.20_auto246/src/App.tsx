import React, { useState, useCallback, useEffect } from 'react';
import BoardComponent from './board/BoardComponent';
import AnalysisPanel from './analysis/AnalysisPanel';
import TurnLog from './components/TurnLog';
import { GameState, Card, Unit, AnalysisResult, LogEntry, SimulationStep } from './game/types';
import { createInitialGameState } from './game/presets';
import { generateRecommendations } from './game/engine';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedHandCard, setSelectedHandCard] = useState<Card | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [boardAnimating, setBoardAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBoardAnimating(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const addLog = useCallback((action: LogEntry['action'], description: string) => {
    const log: LogEntry = {
      id: uuidv4(),
      turn: gameState.turn,
      action,
      description,
      timestamp: Date.now()
    };
    setLogs(prev => [...prev, log]);
  }, [gameState.turn]);

  const handleCardPlay = useCallback((card: Card, position: { x: number; y: number }) => {
    if (card.cost > gameState.player.mana) return;
    if (gameState.board[position.y][position.x]) return;

    setGameState(prev => {
      const newState = JSON.parse(JSON.stringify(prev)) as GameState;

      const newUnit: Unit = {
        id: uuidv4(),
        cardId: card.id,
        name: card.name,
        attack: card.attack || 0,
        health: card.health || 0,
        maxHealth: card.maxHealth || card.health || 0,
        element: card.element || 'neutral',
        position,
        owner: 'player',
        canAttack: card.description?.includes('突袭') || false,
        hasTaunt: card.description?.includes('嘲讽') || false
      };

      newState.board[position.y][position.x] = newUnit;
      newState.player.mana -= card.cost;
      newState.player.hand = newState.player.hand.filter(c => c.id !== card.id);

      if (card.id.includes('fire_warlock')) {
        for (let y = 0; y < 4; y++) {
          for (let x = 0; x < 8; x++) {
            const enemy = newState.board[y][x];
            if (enemy && enemy.owner === 'enemy') {
              enemy.health -= 1;
              if (enemy.health <= 0) {
                newState.board[y][x] = null;
              }
              break;
            }
          }
        }
      }

      if (card.id.includes('water_healer')) {
        newState.player.health = Math.min(
          newState.player.maxHealth,
          newState.player.health + 3
        );
      }

      return newState;
    });

    setSelectedHandCard(null);
    addLog('play', `将${card.name}放置在(${position.x},${position.y})`);
  }, [gameState.player.mana, gameState.board, addLog]);

  const handleUnitClick = useCallback((unit: Unit) => {
    if (unit.owner !== 'player') return;
    setSelectedUnit(selectedUnit?.id === unit.id ? null : unit);
    setSelectedHandCard(null);
  }, [selectedUnit]);

  const handleHandCardSelect = useCallback((card: Card | null) => {
    setSelectedHandCard(card);
    setSelectedUnit(null);
  }, []);

  const handleRequestAnalysis = useCallback(async () => {
    setLoading(true);
    setAnalysisResult(null);

    try {
      const startTime = Date.now();
      
      try {
        const response = await fetch('/api/recommend', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(gameState)
        });

        if (response.ok) {
          const data = await response.json();
          setAnalysisResult(data);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.log('Backend not available, using client-side analysis');
      }

      const result = generateRecommendations(gameState);
      const elapsed = Date.now() - startTime;
      result.analysisTime = elapsed;

      setTimeout(() => {
        setAnalysisResult(result);
        setLoading(false);
      }, Math.max(0, 500 - elapsed));
    } catch (error) {
      console.error('Analysis failed:', error);
      setLoading(false);
    }
  }, [gameState]);

  const handleStepClick = useCallback((step: SimulationStep) => {
    console.log('Step clicked:', step.description);
  }, []);

  const handleReset = useCallback(() => {
    setBoardAnimating(true);
    setGameState(createInitialGameState());
    setAnalysisResult(null);
    setSelectedHandCard(null);
    setSelectedUnit(null);
    setLogs([]);
    setTimeout(() => setBoardAnimating(false), 1500);
  }, []);

  const handleEndTurn = useCallback(() => {
    addLog('end_turn', '回合结束');

    setGameState(prev => {
      const newState = JSON.parse(JSON.stringify(prev)) as GameState;
      newState.turn += 1;
      newState.player.maxMana = Math.min(10, newState.player.maxMana + 1);
      newState.player.mana = newState.player.maxMana;
      newState.player.heroPowerUsed = false;

      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const unit = newState.board[y][x];
          if (unit && unit.owner === 'player') {
            unit.canAttack = true;
          }
        }
      }

      return newState;
    });

    setSelectedUnit(null);
    setSelectedHandCard(null);
  }, [addLog]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title pixel-font">战棋AI决策分析</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleReset}>
            🔄 重置对局
          </button>
          <button className="btn btn-primary" onClick={handleEndTurn}>
            ⏭️ 结束回合
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="game-section">
          <BoardComponent
            gameState={gameState}
            onCardPlay={handleCardPlay}
            onUnitClick={handleUnitClick}
            selectedUnit={selectedUnit}
            selectedHandCard={selectedHandCard}
            onHandCardSelect={handleHandCardSelect}
            animating={boardAnimating}
          />
          <TurnLog logs={logs} turn={gameState.turn} />
        </div>

        <aside className="analysis-section">
          <AnalysisPanel
            result={analysisResult}
            loading={loading}
            onRequestAnalysis={handleRequestAnalysis}
            onStepClick={handleStepClick}
            turn={gameState.turn}
          />
        </aside>
      </main>

      <footer className="app-footer">
        <p>💡 拖拽手牌到棋盘放置随从 | 点击AI分析获取最优策略</p>
      </footer>
    </div>
  );
};

export default App;
