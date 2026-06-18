import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, PlayerActions } from '../engine/GameEngine';
import { GameState } from '../engine/GameState';
import { SupermarketLayout } from './SupermarketLayout';
import { InfoPanel } from './InfoPanel';
import { ControlBar } from './ControlBar';

export default function App() {
  const engineRef = useRef<GameEngine | null>(null);
  const actionsRef = useRef<PlayerActions | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);

  const handleStateUpdate = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  useEffect(() => {
    const engine = new GameEngine(handleStateUpdate);
    engineRef.current = engine;
    actionsRef.current = engine.getActions();
    engine.start();

    return () => {
      engine.stop();
    };
  }, [handleStateUpdate]);

  const toggleCashier = (id: number) => {
    actionsRef.current?.toggleCashier(id);
  };

  const toggleSelfCheckout = (id: number) => {
    actionsRef.current?.toggleSelfCheckout(id);
  };

  const restockShelf = (id: number) => {
    actionsRef.current?.restockShelf(id);
  };

  const quickRestock = () => {
    actionsRef.current?.quickRestock();
  };

  if (!gameState) {
    return (
      <div className="game-root">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="game-root">
      <div className="game-title">
        <span className="title-text">SUPERMARKET TYCOON</span>
        <span className="title-sub">超市收银台模拟策略游戏</span>
      </div>

      <InfoPanel state={gameState} />

      <SupermarketLayout
        state={gameState}
        onShelfClick={restockShelf}
        onCashierClick={toggleCashier}
        onSelfClick={toggleSelfCheckout}
      />

      <ControlBar
        state={gameState}
        onToggleCashier={toggleCashier}
        onToggleSelf={toggleSelfCheckout}
        onQuickRestock={quickRestock}
      />
    </div>
  );
}
