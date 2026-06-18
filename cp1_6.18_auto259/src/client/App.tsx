import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Users, LogOut, BarChart3 } from 'lucide-react';
import { RoomEntry } from './components/RoomEntry';
import { BrainstormWall } from './components/BrainstormWall';
import { VotingPanel } from './components/VotingPanel';
import { HistoryBar } from './components/HistoryBar';
import { useAppStore } from './store';
import type { ClientToServerEvents, ServerToClientEvents } from './types';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('应用错误:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F0E17] flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-xl text-white mb-4">发生了一些错误</h2>
            <p className="text-[#888899] mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-[#FF8906] text-white rounded-xl hover:bg-[#FF9500] transition-all"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const {
    userId,
    roomId,
    nickname,
    isCreator,
    users,
    error,
    isVotingPanelOpen,
    setUser,
    setRoomState,
    addCard,
    deleteCard,
    addUser,
    removeUser,
    openVote,
    updateVotes,
    closeVote,
    setHistory,
    toggleVotingPanel,
    setError,
    reset,
  } = useAppStore();

  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  useEffect(() => {
    const socket = io({
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('WebSocket 连接成功');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('WebSocket 断开连接');
    });

    socket.on('room:joined', (data) => {
      const socketId = socket.id || '';
      const currentUser = data.users.find((u: { socketId: string; }) => u.socketId === socketId);
      const userData = {
        userId: socketId,
        nickname: currentUser?.nickname || '',
        roomId: data.roomId,
        isCreator: currentUser?.isCreator || false,
      };
      setUser(userData);
      setRoomState({
        users: data.users,
        cards: data.cards,
        voteState: data.voteState,
      });
      setError(null);
    });

    socket.on('room:error', (data) => {
      setError(data.message);
    });

    socket.on('user:joined', (data) => {
      addUser(data.user);
    });

    socket.on('user:left', (data) => {
      removeUser(data.userId);
    });

    socket.on('card:added', (data) => {
      addCard(data.card);
    });

    socket.on('card:deleted', (data) => {
      deleteCard(data.cardId);
    });

    socket.on('vote:opened', (data) => {
      openVote(data.voteState);
    });

    socket.on('vote:updated', (data) => {
      updateVotes(data.votes, data.totalVotes);
    });

    socket.on('vote:closed', (data) => {
      closeVote(data.history);
    });

    socket.on('history:list', (data) => {
      setHistory(data.history);
    });

    return () => {
      socket.disconnect();
    };
  }, [setUser, setRoomState, addUser, removeUser, addCard, deleteCard, openVote, updateVotes, closeVote, setHistory, setError]);

  const handleLeaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = io({
        transports: ['websocket', 'polling'],
      });
      socketRef.current.on('connect', () => setIsConnected(true));
      socketRef.current.on('disconnect', () => setIsConnected(false));
    }
    reset();
  }, [reset]);

  if (!userId || !roomId) {
    return (
      <ErrorBoundary>
        <div className="h-full bg-[#0F0E17]">
          <RoomEntry socket={socketRef.current} />
          {error && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-[#FF4D6D] text-white rounded-xl shadow-lg z-50 animate-bounce">
              {error}
            </div>
          )}
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-full flex flex-col bg-[#0F0E17] text-[#E0E0E0]">
        <nav className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-[#0F0E17]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[#888899] text-sm">房间</span>
              <span className="font-mono text-lg font-bold text-[#FF8906] tracking-wider">
                {roomId}
              </span>
            </div>
            
            <div className="h-5 w-px bg-white/10" />
            
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A2E]">
              <Users className="w-4 h-4 text-[#FF8906]" />
              <span className="text-sm">{users.length}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#6BCB77]' : 'bg-[#FF4D6D]'} animate-pulse`} />
              <span className="text-xs text-[#888899]">{nickname}</span>
              {isCreator && (
                <span className="text-xs px-2 py-0.5 rounded bg-[#FF8906]/20 text-[#FF8906]">
                  管理员
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isMobile && (
              <button
                onClick={toggleVotingPanel}
                className="
                  flex items-center gap-2 px-4 py-2 rounded-xl
                  bg-[#1A1A2E] text-white text-sm
                  hover:bg-[#16213E]
                  transition-all duration-200
                "
              >
                <BarChart3 className="w-4 h-4 text-[#FF8906]" />
                投票
              </button>
            )}
            
            <button
              onClick={handleLeaveRoom}
              className="
                flex items-center gap-2 px-4 py-2 rounded-xl
                bg-[#1A1A2E] text-[#888899] text-sm
                hover:bg-[#FF4D6D]/20 hover:text-[#FF4D6D]
                transition-all duration-200
              "
            >
              <LogOut className="w-4 h-4" />
              离开
            </button>
          </div>
        </nav>

        <main className={`flex-1 flex ${isTablet ? 'flex-col' : ''} overflow-hidden`}>
          <div 
            className={`
              ${isTablet ? 'w-full h-1/2' : 'w-[45%] h-full'}
              p-6 border-r border-white/5
            `}
          >
            <BrainstormWall socket={socketRef.current} />
          </div>
          
          {!isMobile && (
            <div 
              className={`
                ${isTablet ? 'w-full h-1/2' : 'w-[50%] h-full'}
                p-6
              `}
            >
              <VotingPanel socket={socketRef.current} />
            </div>
          )}
        </main>

        {isMobile && isVotingPanelOpen && (
          <div 
            className="
              fixed inset-0 z-50
              animate-[slideUp_0.3s_cubic-bezier(0.4,0,0.2,1)]
            "
          >
            <div 
              className="absolute inset-0 bg-black/60"
              onClick={toggleVotingPanel}
            />
            <div className="absolute bottom-0 left-0 right-0 h-[85vh] bg-[#0F0E17] rounded-t-3xl overflow-hidden">
              <VotingPanel 
                socket={socketRef.current} 
                isMobile 
                onClose={toggleVotingPanel} 
              />
            </div>
          </div>
        )}

        <HistoryBar socket={socketRef.current} />

        {error && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 bg-[#FF4D6D] text-white rounded-xl shadow-lg z-50">
            {error}
          </div>
        )}

        <style>{`
          @keyframes slideUp {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }
          
          @keyframes cardEnter {
            0% {
              opacity: 0;
              transform: scale(0.9);
            }
            50% {
              opacity: 1;
              transform: scale(1.1);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          .animate-card-enter {
            animation: cardEnter 0.3s ease-out;
          }
          
          * {
            scrollbar-width: thin;
            scrollbar-color: #1A1A2E transparent;
          }
          
          *::-webkit-scrollbar {
            width: 6px;
          }
          
          *::-webkit-scrollbar-track {
            background: transparent;
          }
          
          *::-webkit-scrollbar-thumb {
            background: #1A1A2E;
            border-radius: 3px;
          }
          
          *::-webkit-scrollbar-thumb:hover {
            background: #16213E;
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
};

export default App;
