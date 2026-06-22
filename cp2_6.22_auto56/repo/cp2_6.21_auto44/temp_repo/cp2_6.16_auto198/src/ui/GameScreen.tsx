import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import GameGrid from './GameGrid';
import ChatPanel from './ChatPanel';
import { formatTime } from '@/utils/arrayHelpers';
import { Trophy, Skull, User, Clock, LogOut, RefreshCw, Wifi, WifiOff } from 'lucide-react';

function GameScreen() {
  const {
    playerName,
    opponentName,
    myShips,
    opponentShips,
    mySonarResults,
    opponentSonarResults,
    mySunkCount,
    opponentSunkCount,
    currentTurn,
    turnTimeRemaining,
    fireSonar,
    leaveRoom,
    resetGame,
    gamePhase,
    winner,
    opponentConnected,
    isReconnecting,
    activePulse,
    roomCode,
  } = useGameStore();

  const [cellSize, setCellSize] = useState(40);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setCellSize(mobile ? 30 : 40);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const totalShips = myShips.length || 10;

  if (gamePhase === 'gameover') {
    return (
      <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
        <div className="card p-8 w-full max-w-lg text-center">
          <div className="mb-6">
            <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
              winner === 'player' 
                ? 'bg-gradient-to-br from-success-green to-emerald-600' 
                : 'bg-gradient-to-br from-danger-red to-red-600'
            }`}>
              {winner === 'player' ? (
                <Trophy className="w-12 h-12 text-white" />
              ) : (
                <Skull className="w-12 h-12 text-white" />
              )}
            </div>
            <h1 className={`text-4xl font-bold font-orbitron mb-2 ${
              winner === 'player' ? 'text-success-green' : 'text-danger-red'
            }`}>
              {winner === 'player' ? '胜利！' : '失败'}
            </h1>
            <p className="text-gray-400">
              {winner === 'player' ? '恭喜你击沉了对方所有战舰！' : '你的所有战舰已被击沉'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-deep-space/50 rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">你击沉</p>
              <p className="text-3xl font-bold font-orbitron text-success-green">
                {opponentSunkCount} / {totalShips}
              </p>
            </div>
            <div className="bg-deep-space/50 rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">对方击沉</p>
              <p className="text-3xl font-bold font-orbitron text-danger-red">
                {mySunkCount} / {totalShips}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={leaveRoom} className="btn-secondary flex-1">
              返回菜单
            </button>
            <button 
              onClick={() => {
                resetGame();
                window.location.reload();
              }} 
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              再来一局
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPlayerTurn = currentTurn === 'player';
  const turnProgress = (turnTimeRemaining / 45) * 100;
  const isTurnLow = turnTimeRemaining <= 10;

  return (
    <div className="relative z-10 w-full h-full flex flex-col p-4 overflow-hidden">
      {/* Header */}
      <div className="card p-4 mb-4 flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-electric-blue to-cyan-300">
              EchoBattleship
            </h1>
            <span className="text-sm text-gray-500 font-orbitron">房间: {roomCode}</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-success-green" />
                <span className="text-sm font-medium">{playerName}</span>
                <span className="text-success-green font-bold font-orbitron">{totalShips - mySunkCount}</span>
              </div>
              <div className="text-gray-500">VS</div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-danger-red" />
                <span className="text-sm font-medium">{opponentName || '等待中...'}</span>
                <span className="text-danger-red font-bold font-orbitron">{totalShips - opponentSunkCount}</span>
                {opponentConnected ? (
                  <Wifi className="w-4 h-4 text-success-green" />
                ) : (
                  <WifiOff className="w-4 h-4 text-danger-red animate-pulse" />
                )}
              </div>
            </div>

            <button
              onClick={leaveRoom}
              className="p-2 rounded-lg bg-deep-blue hover:bg-deep-blue/80 transition-colors"
              title="退出房间"
            >
              <LogOut className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Turn indicator */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${isTurnLow ? 'text-danger-red' : 'text-electric-blue'}`} />
              <span className={`font-semibold font-orbitron ${isPlayerTurn ? 'text-electric-blue' : 'text-gray-400'}`}>
                {isPlayerTurn ? '你的回合' : '对方回合'}
              </span>
            </div>
            <span className={`font-mono font-bold ${isTurnLow ? 'text-danger-red animate-pulse' : 'text-white'}`}>
              {formatTime(turnTimeRemaining)}
            </span>
          </div>
          <div className="h-2 bg-deep-space rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                isTurnLow ? 'bg-danger-red' : isPlayerTurn ? 'bg-electric-blue' : 'bg-gray-600'
              }`}
              style={{ width: `${turnProgress}%` }}
            />
          </div>
        </div>

        {/* Reconnect message */}
        {isReconnecting && (
          <div className="mt-4 p-3 bg-warning-orange/20 border border-warning-orange/50 rounded-lg text-center">
            <p className="text-warning-orange text-sm">
              对手已断开连接，等待重连中...
            </p>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className={`flex-1 flex gap-4 overflow-hidden ${
        isMobile ? 'flex-col' : 'flex-row'
      }`}>
        {/* Grids */}
        <div className={`flex gap-5 justify-center ${
          isMobile ? 'flex-col items-center' : 'flex-row'
        }`}>
          <GameGrid
            type="own"
            ships={myShips}
            sonarResults={opponentSonarResults}
            cellSize={cellSize}
            disabled={!isPlayerTurn}
          />
          <GameGrid
            type="opponent"
            ships={opponentShips}
            sonarResults={mySonarResults}
            onCellClick={fireSonar}
            cellSize={cellSize}
            disabled={!isPlayerTurn || !!activePulse}
          />
        </div>

        {/* Chat panel */}
        <div className={`${isMobile ? 'h-64' : 'flex-1'} min-w-0`}>
          <ChatPanel />
        </div>
      </div>

      {/* Legend */}
      <div className="card p-4 mt-4 flex-shrink-0">
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-danger-red/70 glow-red" />
            <span className="text-sm text-gray-300">HIT (命中)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-warning-orange/70 glow-orange" />
            <span className="text-sm text-gray-300">CLOSE (相邻)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-400/70 glow-yellow" />
            <span className="text-sm text-gray-300">WARM (2格内)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500/70 glow-blue" />
            <span className="text-sm text-gray-300">COLD (远距离)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameScreen;
