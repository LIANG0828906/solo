import React, { useEffect, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import PlayerPanel from './components/PlayerPanel';
import MatchModal from './components/MatchModal';
import ResultModal from './components/ResultModal';
import { useBoardStore } from './game/board';
import { initSocket, disconnectSocket } from './network/roomManager';
import { initSyncClient, destroySyncClient, syncFireLaser } from './network/syncClient';
import { Zap } from 'lucide-react';

const App: React.FC = () => {
  const { phase, round, roomCode, timeRemaining, turnPhase, currentTurn } = useBoardStore();

  useEffect(() => {
    initSocket();
    initSyncClient();

    return () => {
      destroySyncClient();
      disconnectSocket();
    };
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      syncFireLaser();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/[0.02] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/[0.02] rounded-full" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-8 py-4 border-b border-white/5">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-orbitron text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  LASER MAZE
                </h1>
              </div>
            </div>

            {roomCode && (
              <div className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-xl border border-white/5">
                <span className="font-rajdhani text-gray-400 text-sm uppercase tracking-wider">房间</span>
                <span className="font-orbitron text-lg font-bold text-cyan-400 tracking-wider">{roomCode}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            {phase === 'playing' && (
              <>
                <div className="flex items-center gap-3 px-5 py-2 bg-black/30 rounded-xl border border-white/5">
                  <span className="font-rajdhani text-gray-400 text-sm uppercase tracking-wider">回合</span>
                  <span className="font-orbitron text-lg font-bold text-yellow-400">{round}</span>
                  <span className="font-rajdhani text-gray-600 text-sm">/ 10</span>
                </div>

                <div className={`flex items-center gap-3 px-5 py-2 rounded-xl border ${timeRemaining <= 5 ? 'bg-red-500/20 border-red-500/50 animate-pulse' : 'bg-black/30 border-white/5'}`}>
                  <span className="font-rajdhani text-gray-400 text-sm uppercase tracking-wider">时间</span>
                  <span className={`font-orbitron text-lg font-bold tabular-nums ${timeRemaining <= 5 ? 'text-red-400' : 'text-white'}`}>
                    {String(timeRemaining).padStart(2, '0')}s
                  </span>
                </div>

                <div className={`flex items-center gap-3 px-5 py-2 rounded-xl border ${turnPhase === 'adjust' ? (currentTurn === 'playerA' ? 'bg-[#FF4444]/10 border-[#FF4444]/30' : 'bg-[#4444FF]/10 border-[#4444FF]/30') : 'bg-orange-500/10 border-orange-500/30'}`}>
                  <span className={`font-rajdhani text-sm uppercase tracking-wider font-bold ${turnPhase === 'adjust' ? (currentTurn === 'playerA' ? 'text-[#FF4444]' : 'text-[#4444FF]') : 'text-orange-400'}`}>
                    {turnPhase === 'adjust' ? '调整阶段' : '发射阶段'}
                  </span>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center gap-8 px-8 py-6">
          <PlayerPanel player="playerA" />
          <GameCanvas />
          <PlayerPanel player="playerB" />
        </main>

        <footer className="px-8 py-4 border-t border-white/5">
          <div className="flex items-center justify-center gap-4 font-rajdhani text-gray-500 text-sm">
            <span>拖拽移动己方阻挡器</span>
            <span className="text-gray-700">|</span>
            <kbd className="px-2 py-1 bg-white/5 rounded border border-white/10 font-orbitron text-xs text-gray-400">SPACE</kbd>
            <span>发射激光</span>
          </div>
        </footer>
      </div>

      {phase === 'matching' && <MatchModal />}
      {phase === 'ended' && <ResultModal />}
    </div>
  );
};

export default App;
