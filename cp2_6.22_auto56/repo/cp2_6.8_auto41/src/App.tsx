import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VoteResult, formatTime, exportReport } from './utils/voteEngine';
import PollPanel from './components/PollPanel';
import ResultCharts from './components/ResultCharts';

interface Firework {
  id: number;
  left: number;
  color: string;
  delay: number;
}

function App() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [joinCode, setJoinCode] = useState<string>('');
  const [voteData, setVoteData] = useState<VoteResult | null>(null);
  const [countdownMinutes, setCountdownMinutes] = useState<number>(20);
  const [showFireworks, setShowFireworks] = useState<Firework[]>([]);
  const [wasLocked, setWasLocked] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connectWebSocket = useCallback((rid?: string) => {
    const websocket = new WebSocket('ws://localhost:3001/ws');
    websocket.onopen = () => {
      if (rid) {
        websocket.send(JSON.stringify({ type: 'join-room', payload: { roomId: rid } }));
      } else {
        websocket.send(JSON.stringify({ type: 'create-room' }));
      }
    };
    websocket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'room-created') {
        setRoomId(msg.data.roomId);
      } else if (msg.type === 'update') {
        setVoteData(msg.data);
      } else if (msg.type === 'error') {
        alert(msg.message);
      }
    };
    websocket.onclose = () => {
      setTimeout(() => connectWebSocket(rid || roomId), 1000);
    };
    wsRef.current = websocket;
    setWs(websocket);
  }, [roomId]);

  useEffect(() => {
    if (voteData?.isLocked && !wasLocked) {
      setWasLocked(true);
      const fireworks: Firework[] = [];
      const warmColors = ['#ff4500', '#ff6347', '#ffa500', '#ffd700', '#ff1493', '#ff69b4'];
      for (let i = 0; i < 30; i++) {
        fireworks.push({
          id: i,
          left: Math.random() * 100,
          color: warmColors[Math.floor(Math.random() * warmColors.length)],
          delay: Math.random() * 0.5,
        });
      }
      setShowFireworks(fireworks);
      setTimeout(() => setShowFireworks([]), 2000);
    }
  }, [voteData?.isLocked, wasLocked]);

  const handleCreateRoom = () => {
    connectWebSocket();
  };

  const handleJoinRoom = () => {
    if (joinCode.trim()) {
      connectWebSocket(joinCode.trim().toUpperCase());
    }
  };

  const handleCountdownChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setCountdownMinutes(val);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'set-countdown', payload: { minutes: val } }));
    }
  };

  const handleExportReport = () => {
    if (!voteData) return;
    const report = exportReport(voteData);
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vote-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(link);
    alert('邀请链接已复制到剪贴板');
  };

  if (!roomId) {
    return (
      <div className="min-h-screen bg-bg-dark text-white flex items-center justify-center p-4">
        <div className="bg-card-dark rounded-xl p-8 w-full max-w-md animate-pulse-glow">
          <h1 className="text-3xl font-bold text-center mb-8 text-accent">团队决策加权投票</h1>
          <div className="space-y-6">
            <button
              onClick={handleCreateRoom}
              className="w-full py-4 bg-accent hover:bg-purple-500 text-white rounded-lg transition-colors duration-200 font-semibold text-lg"
            >
              创建投票房间
            </button>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-600"></div>
              <span className="text-gray-400 text-sm">或</span>
              <div className="flex-1 h-px bg-gray-600"></div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="输入房间短码"
                maxLength={6}
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-accent uppercase tracking-widest"
              />
              <button
                onClick={handleJoinRoom}
                className="px-6 py-3 bg-accent hover:bg-purple-500 text-white rounded-lg transition-colors duration-200 font-semibold"
              >
                加入
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isLastTenSeconds = voteData && voteData.remainingTime <= 10 && voteData.remainingTime > 0;

  return (
    <div className="min-h-screen bg-bg-dark text-white p-4 md:p-6">
      {showFireworks.map((fw) => (
        <div
          key={fw.id}
          className="firework-particle"
          style={{
            left: `${fw.left}%`,
            backgroundColor: fw.color,
            animationDelay: `${fw.delay}s`,
          }}
        />
      ))}

      <div className="max-w-7xl mx-auto">
        <div className="bg-card-dark rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-2xl font-bold text-accent">团队决策加权投票</h1>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">房间码:</span>
              <span className="font-mono text-lg bg-gray-800 px-3 py-1 rounded tracking-wider">{roomId}</span>
              <button
                onClick={handleCopyLink}
                className="text-sm px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors duration-200"
              >
                复制邀请
              </button>
            </div>
            {voteData && (
              <div className="text-gray-400">
                参与者: <span className="text-white font-semibold">{voteData.participantCount}</span>/20
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">倒计时:</span>
              <span
                className={`font-mono text-2xl font-bold min-w-[80px] text-center ${
                  isLastTenSeconds ? 'text-red-500 animate-countdown-blink' : 'text-white'
                }`}
              >
                {voteData ? formatTime(voteData.remainingTime) : formatTime(countdownMinutes * 60)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="5"
                max="60"
                value={countdownMinutes}
                onChange={handleCountdownChange}
                className="w-32"
                disabled={voteData?.isLocked}
              />
              <span className="text-sm text-gray-400">{countdownMinutes}分钟</span>
            </div>
            <button
              onClick={handleExportReport}
              className="px-4 py-2 bg-accent hover:bg-purple-500 rounded-lg transition-colors duration-200 font-semibold"
            >
              导出报告
            </button>
          </div>
        </div>

        {voteData?.isLocked && (
          <div className="bg-red-900/50 border border-red-500 rounded-xl p-4 mb-6 text-center">
            <span className="text-xl font-bold text-red-300">投票已结束！</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {voteData && wsRef.current && (
            <>
              <PollPanel
                ws={wsRef.current}
                voteData={voteData}
              />
              <ResultCharts
                voteData={voteData}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
