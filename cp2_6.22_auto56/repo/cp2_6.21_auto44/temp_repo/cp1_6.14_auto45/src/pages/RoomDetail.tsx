import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Users, Play, Square, Download, Wifi, WifiOff, Vote } from 'lucide-react';
import type { Room, Card, WSMessage } from '../types';
import { getRoom, castVote, startVoting, endVoting, exportResults } from '../utils/api';
import { joinRoom } from '../utils/api';
import { useUserId, useUsername } from '../hooks/useLocalStorage';
import { useWebSocket } from '../hooks/useWebSocket';
import CardBoard from '../components/CardBoard';
import CanvasDraw from '../components/CanvasDraw';

export default function RoomDetail() {
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useUserId();
  const { username } = useUsername();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showCanvas, setShowCanvas] = useState(true);

  const isHost = useMemo(() => room?.hostId === userId, [room, userId]);

  const handleWSMessage = useCallback((msg: WSMessage) => {
    if (msg.type === 'SYNC_STATE' && msg.payload) {
      setRoom(msg.payload as Room);
    } else if (msg.type === 'CARD_CREATE' && msg.payload && roomId) {
      setRoom((prev) => {
        if (!prev) return prev;
        const newCard = msg.payload as Card;
        const exists = prev.cards.some((c) => c.id === newCard.id);
        if (exists) return prev;
        return { ...prev, cards: [...prev.cards, newCard] };
      });
    } else if (msg.type === 'VOTING_START' && roomId) {
      setRoom((prev) => prev ? { ...prev, isVoting: true } : prev);
    } else if (msg.type === 'VOTING_END' && roomId) {
      setRoom((prev) => prev ? { ...prev, isVoting: false } : prev);
    }
  }, [roomId]);

  const wsUrl = roomId && userId
    ? `ws://${window.location.hostname}:${window.location.port || '5173'}/ws?roomId=${roomId}&userId=${userId}`
    : '';

  const { sendMessage, isConnected } = useWebSocket({
    url: wsUrl,
    onMessage: handleWSMessage,
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
  });

  const fetchRoom = useCallback(async () => {
    if (!roomId) return;
    try {
      const data = await getRoom(roomId);
      setRoom(data);
    } catch (err) {
      console.error('Failed to fetch room:', err);
      setError('房间不存在');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    const joinAndFetch = async () => {
      if (!roomId || !userId || !username) {
        await fetchRoom();
        return;
      }

      try {
        await joinRoom(roomId, userId, username);
      } catch (err) {
        console.error('Failed to join room:', err);
      }
      await fetchRoom();
    };

    joinAndFetch();
  }, [roomId, userId, username, fetchRoom]);

  const handleVote = useCallback(
    async (cardId: string, value: 1 | -1) => {
      if (!roomId || !userId) return;
      try {
        await castVote(roomId, cardId, userId, value);
        setRoom((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            cards: prev.cards.map((c) =>
              c.id === cardId
                ? {
                    ...c,
                    votes: [...c.votes, { id: `local_${Date.now()}`, cardId, userId, value, timestamp: Date.now() }],
                  }
                : c
            ),
          };
        });
      } catch (err) {
        console.error('Vote failed:', err);
      }
    },
    [roomId, userId]
  );

  const handleStartVoting = useCallback(async () => {
    if (!roomId || !isHost) return;
    try {
      await startVoting(roomId, userId!);
      setRoom((prev) => prev ? { ...prev, isVoting: true } : prev);
    } catch (err) {
      console.error('Start voting failed:', err);
    }
  }, [roomId, isHost, userId]);

  const handleEndVoting = useCallback(async () => {
    if (!roomId || !isHost) return;
    try {
      await endVoting(roomId, userId!);
      setRoom((prev) => prev ? { ...prev, isVoting: false } : prev);
    } catch (err) {
      console.error('End voting failed:', err);
    }
  }, [roomId, isHost, userId]);

  const handleExport = useCallback(async () => {
    if (!roomId) return;
    try {
      await exportResults(roomId);
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, [roomId]);

  const handleAddCard = useCallback((card: Card) => {
    setRoom((prev) => {
      if (!prev) return prev;
      return { ...prev, cards: [...prev.cards, card] };
    });
  }, []);

  const handleCopyCode = useCallback(() => {
    if (!room) return;
    navigator.clipboard.writeText(room.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [room]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#ffd700] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#9ca3af]">加载房间中...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-lg text-[#e0e0e0] mb-2">{error || '房间不存在'}</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-4">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/10 bg-[#16213e]/50 backdrop-blur-md sticky top-0 z-40">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => navigate('/')}
                className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#1a1a2e] flex items-center justify-center text-[#9ca3af] hover:text-[#e0e0e0] border border-white/10 transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-[#e0e0e0] truncate">{room.name}</h1>
                <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {room.participants.length} 人
                  </span>
                  <span>·</span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 hover:text-[#ffd700] transition-colors mono"
                  >
                    {copied ? '已复制!' : room.inviteCode}
                    <Copy size={10} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
                isConnected ? 'bg-[#2ed573]/10 text-[#2ed573]' : 'bg-[#ff4757]/10 text-[#ff4757]'
              }`}>
                {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                {isConnected ? '已连接' : '断开'}
              </div>

              {isHost && (
                <>
                  {!room.isVoting ? (
                    <button
                      onClick={handleStartVoting}
                      disabled={room.cards.length === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#2ed573]/20 text-[#2ed573] border border-[#2ed573]/30 hover:bg-[#2ed573]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play size={14} />
                      开始投票
                    </button>
                  ) : (
                    <button
                      onClick={handleEndVoting}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#ff4757]/20 text-[#ff4757] border border-[#ff4757]/30 hover:bg-[#ff4757]/30 transition-all"
                    >
                      <Square size={14} />
                      结束投票
                    </button>
                  )}
                </>
              )}

              {room.isVoting && !isHost && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#ffa502]/20 text-[#ffa502] border border-[#ffa502]/30">
                  <Vote size={14} />
                  投票进行中
                </div>
              )}

              {!room.isVoting && room.cards.some((c) => c.votes.length > 0) && (
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#1a1a2e] text-[#e0e0e0] border border-white/10 hover:border-[#ffd700]/30 transition-all"
                >
                  <Download size={14} />
                  导出
                </button>
              )}

              <button
                onClick={() => setShowCanvas(!showCanvas)}
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#1a1a2e] text-[#9ca3af] hover:text-[#ffd700] border border-white/10 hover:border-[#ffd700]/30 transition-all sm:hidden"
              >
                🎨
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="flex-1 lg:w-[60%] p-4 sm:p-6 overflow-hidden">
          <CardBoard
            cards={room.cards}
            roomId={room.id}
            isVoting={room.isVoting}
            userId={userId || ''}
            isHost={isHost}
            onVote={handleVote}
            sendMessage={sendMessage}
            onAddCard={handleAddCard}
          />
        </div>

        <div className={`lg:w-[40%] lg:border-l border-t lg:border-t-0 border-white/10 p-4 sm:p-6 ${
          showCanvas ? 'block' : 'hidden lg:block'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-[#e0e0e0]">手绘草图</h3>
            <button
              onClick={() => setShowCanvas(false)}
              className="lg:hidden text-sm text-[#9ca3af] hover:text-[#e0e0e0]"
            >
              隐藏画布
            </button>
          </div>
          <CanvasDraw onSketchReady={() => {}} />
        </div>
      </div>
    </div>
  );
}
