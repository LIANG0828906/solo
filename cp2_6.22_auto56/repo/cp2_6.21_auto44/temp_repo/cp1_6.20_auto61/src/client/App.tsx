import { useEffect, useState } from 'react';
import { useGameStore, PageState } from '@/hooks/useGameStore';
import { useSocket } from '@/hooks/useSocket';
import {
  RoomState,
  RoundState,
  RoundResult,
  FinalResult,
} from '@/types';
import { cn } from '@/lib/utils';
import StarryBackground from '@/components/StarryBackground';
import ResultPage from '@/pages/ResultPage';
import LobbyPage from '@/pages/LobbyPage';
import GamePage from '@/pages/GamePage';

/**
 * 主应用组件
 * - 根据useGameStore中的page状态渲染对应页面
 * - 全局监听socket事件并更新store
 * - 始终渲染StarryBackground背景
 * - 页面切换使用CSS过渡动画
 */
export default function App() {
  const { socket } = useSocket();
  const {
    pageState,
    setPlayerInfo,
    setPlayerId,
    setRoomState,
    setRoundState,
    setRoundResult,
    setFinalResult,
    setPageState,
    resetGame,
  } = useGameStore();

  // 页面切换动画状态
  const [animateIn, setAnimateIn] = useState(true);
  const [displayPage, setDisplayPage] = useState<PageState>(pageState);

  // 监听pageState变化，实现页面切换动画
  useEffect(() => {
    if (pageState !== displayPage) {
      setAnimateIn(false);
      const timer = setTimeout(() => {
        setDisplayPage(pageState);
        setAnimateIn(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pageState, displayPage]);

  // 注册全局socket事件监听器
  useEffect(() => {
    if (!socket) return;

    console.log('[App] 注册全局Socket事件监听器');

    // 房间创建成功事件
    const handleRoomCreated = (data: { roomCode: string; playerId: string }) => {
      console.log('[Socket] room:created', data);
      setPlayerId(data.playerId);
      setPageState('room');
    };

    // 加入房间成功事件
    const handleRoomJoined = (data: { room: RoomState; playerId: string }) => {
      console.log('[Socket] room:joined', data);
      setRoomState(data.room);
      setPlayerId(data.playerId);
      setPageState('room');
    };

    // 房间错误事件
    const handleRoomError = (message: string) => {
      console.error('[Socket] room:error', message);
      alert(message);
    };

    // 房间状态更新事件
    const handleRoomUpdate = (room: RoomState) => {
      console.log('[Socket] room:update', room);
      setRoomState(room);
    };

    // 游戏开始事件
    const handleGameStarted = (state: RoomState) => {
      console.log('[Socket] game:started', state);
      setRoomState(state);
    };

    // 新回合开始事件
    const handleNewRound = (round: RoundState) => {
      console.log('[Socket] game:newRound', round);
      setRoundState(round);
      setPageState('game');
    };

    // 回合结束事件
    const handleRoundEnd = (data: RoundResult) => {
      console.log('[Socket] game:roundEnd', data);
      setRoundResult(data);
    };

    // 游戏结束事件
    const handleGameEnded = (data: FinalResult) => {
      console.log('[Socket] game:ended', data);
      setFinalResult(data);
    };

    // 回答结果事件
    const handleAnswerResult = (data: { teamId: string; correct: boolean; score: number }) => {
      console.log('[Socket] game:answerResult', data);
    };

    // 求助请求事件
    const handleHelpRequested = (data: { fromTeamId: string; toTeamId: string; hint: string }) => {
      console.log('[Socket] game:helpRequested', data);
    };

    // 断开连接事件处理
    const handleDisconnect = () => {
      console.log('[Socket] 断开连接，重置游戏状态');
      resetGame();
    };

    // 注册事件监听器
    socket.on('room:created', handleRoomCreated);
    socket.on('room:joined', handleRoomJoined);
    socket.on('room:error', handleRoomError);
    socket.on('room:update', handleRoomUpdate);
    socket.on('game:started', handleGameStarted);
    socket.on('game:newRound', handleNewRound);
    socket.on('game:answerResult', handleAnswerResult);
    socket.on('game:helpRequested', handleHelpRequested);
    socket.on('game:roundEnd', handleRoundEnd);
    socket.on('game:ended', handleGameEnded);
    socket.on('disconnect', handleDisconnect);

    // 清理函数：移除所有事件监听器
    return () => {
      console.log('[App] 移除全局Socket事件监听器');
      socket.off('room:created', handleRoomCreated);
      socket.off('room:joined', handleRoomJoined);
      socket.off('room:error', handleRoomError);
      socket.off('room:update', handleRoomUpdate);
      socket.off('game:started', handleGameStarted);
      socket.off('game:newRound', handleNewRound);
      socket.off('game:answerResult', handleAnswerResult);
      socket.off('game:helpRequested', handleHelpRequested);
      socket.off('game:roundEnd', handleRoundEnd);
      socket.off('game:ended', handleGameEnded);
      socket.off('disconnect', handleDisconnect);
    };
  }, [
    socket,
    setPlayerInfo,
    setPlayerId,
    setRoomState,
    setRoundState,
    setRoundResult,
    setFinalResult,
    setPageState,
    resetGame,
  ]);

  // 根据当前页面状态渲染对应组件
  const renderPage = () => {
    switch (displayPage) {
      case 'lobby':
      case 'room':
        return <LobbyPage />;
      case 'game':
        return <GamePage />;
      case 'roundResult':
      case 'finalResult':
        return <ResultPage />;
      default:
        return <LobbyPage />;
    }
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* 全局星空背景 */}
      <StarryBackground />

      {/* 页面内容区域，带过渡动画 */}
      <div
        className={cn(
          'relative z-10 w-full min-h-screen transition-all duration-300 ease-out',
          animateIn
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-[0.98]'
        )}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {renderPage()}
      </div>
    </div>
  );
}
