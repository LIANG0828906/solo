import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import PlayerCard from '../components/PlayerCard';
import VerseChain from '../components/VerseChain';
import type { Player, Verse, RoomState } from '../types';

interface VerseResultEvent {
  success: boolean;
  message: string;
  chain?: Verse[];
  lastVerse?: Verse;
}

function useAudio() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const ensure = () => {
    if (!audioCtxRef.current) {
      const AC = (window.AudioContext || (window as any).webkitAudioContext);
      if (AC) audioCtxRef.current = new AC();
    }
    return audioCtxRef.current;
  };

  const playFlute = useCallback(() => {
    const ctx = ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(1174, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(784, now + 0.35);
    osc.frequency.exponentialRampToValueAtTime(523, now + 0.7);

    filter.type = 'lowpass';
    filter.frequency.value = 2500;
    filter.Q.value = 2;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.8);
  }, []);

  const playDrum = useCallback(() => {
    const ctx = ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const t = now + i * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.1);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.4, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    }
  }, []);

  const playGong = useCallback(() => {
    const ctx = ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [523, 659, 784, 1047];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.2, now + i * 0.04 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.04 + 1.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 1.3);
    });
  }, []);

  return { playFlute, playDrum, playGong };
}

export default function Room() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);
  const myPlayerId = localStorage.getItem('playerId');
  const storedNickname = localStorage.getItem('nickname') || '';

  const [state, setState] = useState<RoomState>({
    players: [],
    chain: [],
    currentPlayerId: null,
    promptVerse: null,
    timeLeft: 60,
    round: 0,
  });
  const [inputVerse, setInputVerse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [blessing, setBlessing] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastVerseId, setLastVerseId] = useState<string | undefined>(undefined);
  const [connected, setConnected] = useState(false);
  const [urgentTick, setUrgentTick] = useState(false);

  const { playFlute, playDrum, playGong } = useAudio();

  useEffect(() => {
    if (!id) return;
    const socket = io({ transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      const nickname = localStorage.getItem('nickname') || '无名诗人';
      socket.emit('joinRoom', { roomId: id, nickname });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('roomState', (s: RoomState) => {
      setState(s);
      setUrgentTick(s.timeLeft <= 3);
    });

    socket.on('newPrompt', ({ verse, playerId }: { verse: Verse; playerId: string }) => {
      setState((prev) => ({
        ...prev,
        promptVerse: verse,
        currentPlayerId: playerId,
        timeLeft: 60,
      }));
      setInputVerse('');
      setSubmitting(false);
    });

    socket.on('timeTick', ({ timeLeft }: { timeLeft: number }) => {
      setState((prev) => ({ ...prev, timeLeft }));
      setUrgentTick(timeLeft <= 3);
    });

    socket.on('urgentTick', () => {
      playDrum();
    });

    socket.on('playerJoined', ({ player }: { player: Player }) => {
      playFlute();
    });

    socket.on('playerLeft', ({ playerId }: { playerId: string }) => {
      setState((prev) => ({
        ...prev,
        players: prev.players.filter((p) => p.id !== playerId),
      }));
    });

    socket.on('verseResult', (r: VerseResultEvent) => {
      if (r.chain) setState((prev) => ({ ...prev, chain: r.chain! }));
      if (r.success) {
        setLastVerseId(r.lastVerse?.id);
        playGong();
        setBlessing(r.message || '妙！接龙成功！');
        setTimeout(() => setBlessing(null), 1800);
      } else {
        setErrorMsg(r.message);
        setTimeout(() => setErrorMsg(null), 2500);
      }
      setSubmitting(false);
    });

    socket.on('fluteSound', () => {
      playFlute();
    });

    socket.on('error', ({ message }: { message: string }) => {
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(null), 3000);
    });

    socket.on('roomJoined', ({ playerId }: { playerId: string }) => {
      localStorage.setItem('playerId', playerId);
    });

    return () => {
      socket.emit('leaveRoom');
      socket.disconnect();
    };
  }, [id, playFlute, playDrum, playGong]);

  const isMyTurn = myPlayerId && state.currentPlayerId === myPlayerId;
  const sortedPlayers = [...state.players].sort((a, b) => a.joinTime - b.joinTime);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputVerse.trim() || submitting || !isMyTurn || !id) return;
    setSubmitting(true);
    socketRef.current?.emit('submitVerse', { roomId: id, verse: inputVerse.trim() });
  };

  const handleLeave = () => {
    socketRef.current?.emit('leaveRoom');
    localStorage.removeItem('playerId');
    navigate('/');
  };

  return (
    <>
      <button
        className="menu-toggle"
        aria-label="打开玩家列表"
        onClick={() => setSidebarOpen(true)}
        style={{ fontSize: '1.4rem' }}
      >
        ☰
      </button>

      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className="room-layout">
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="section-title" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
              诗友雅集
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{ fontSize: '1.5rem', color: '#1a1a1a', padding: '0 0.4rem' }}
              aria-label="关闭"
            >
              ×
            </button>
          </div>

          <div className="flex items-center justify-between mb-4" style={{
            padding: '0.8rem 1rem',
            background: 'rgba(26,26,26,0.06)',
            borderRadius: 6,
          }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2a2a2a' }}>房间号</span>
            <span className="room-badge">{id}</span>
          </div>

          <div className="text-center mb-4" style={{
            fontSize: '0.9rem',
            color: '#5a4a3a',
            paddingBottom: '0.8rem',
            borderBottom: '1px dashed #d9ccaf',
          }}>
            第 <span style={{ color: '#c9302c', fontWeight: 700 }}>{state.round}</span> 轮
            · 共 <span style={{ color: '#1a1a1a', fontWeight: 700 }}>{state.players.length}</span> 位诗人
            {connected ? (
              <span style={{ color: '#5a7f5e', marginLeft: 8 }}>● 在线</span>
            ) : (
              <span style={{ color: '#c9302c', marginLeft: 8 }}>○ 连接中</span>
            )}
          </div>

          <div className="player-grid" style={{ padding: '0.5rem 0 1rem' }}>
            {sortedPlayers.map((p, i) => (
              <PlayerCard
                key={p.id}
                player={p}
                isMe={p.id === myPlayerId}
                isCurrent={p.id === state.currentPlayerId}
                index={i}
              />
            ))}
            {sortedPlayers.length === 0 && (
              <div className="text-center" style={{ padding: '2rem 0', color: '#8a7a6a' }}>
                <div className="loading-spinner" style={{ marginBottom: '0.8rem' }} />
                正在召集诗友...
              </div>
            )}
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button
              className="brush-btn w-full"
              onClick={() => {
                navigator.clipboard?.writeText(id || '');
                const btn = document.createElement('div');
                btn.className = 'gold-blessing';
                btn.innerHTML = '<div style="font-family:\'Ma Shan Zheng\',serif;font-size:1.6rem;">房间号已复制！</div>';
                document.body.appendChild(btn);
                setTimeout(() => btn.remove(), 1600);
              }}
            >
              📋 复制房间号
            </button>
            <div style={{ height: '0.8rem' }} />
            <button className="brush-btn w-full" onClick={handleLeave}>
              🚪 离开房间
            </button>
          </div>
        </aside>

        <main className="main-content">
          <section className="prompt-panel">
            <div className="flex justify-between items-center mb-4">
              <h2 className="section-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
                {state.currentPlayerId
                  ? sortedPlayers.find((p) => p.id === state.currentPlayerId)?.nickname + ' 出题中'
                  : '等待玩家入座'}
              </h2>
              <div className={`countdown ${urgentTick ? 'urgent' : ''}`}>
                {state.timeLeft}s
              </div>
            </div>

            {state.promptVerse ? (
              <div style={{ marginBottom: '1.5rem' }}>
                <div className="prompt-verse">
                  {state.promptVerse.text}
                </div>
                <div className="text-center mt-2" style={{
                  fontSize: '0.9rem',
                  color: '#7a6a5a',
                  fontStyle: 'italic',
                }}>
                  —— {state.promptVerse.dynasty && `[${state.promptVerse.dynasty}]`} {state.promptVerse.author}《{state.promptVerse.source}》
                </div>
                <div className="text-center mt-3" style={{ fontSize: '0.95rem', color: '#c9302c', fontWeight: 700 }}>
                  尾字：【<span style={{ fontSize: '1.3em' }}>{state.promptVerse.lastChar}</span>】 请对出首字相同或押韵的下一句
                </div>
              </div>
            ) : (
              <div className="text-center" style={{ padding: '2rem', color: '#8a7a6a' }}>
                <div className="loading-spinner" style={{ marginBottom: '1rem' }} />
                正在研墨选题...
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="brush-input-wrapper mb-4">
                <textarea
                  className="brush-textarea"
                  placeholder={
                    isMyTurn
                      ? '请在此挥毫泼墨，输入您的诗句...'
                      : sortedPlayers.find((p) => p.id === state.currentPlayerId)
                        ? `正待 ${sortedPlayers.find((p) => p.id === state.currentPlayerId)?.nickname} 落笔...`
                        : '静候其他诗人入座'
                  }
                  value={inputVerse}
                  onChange={(e) => setInputVerse(e.target.value)}
                  disabled={!isMyTurn || submitting}
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e as any);
                    }
                  }}
                />
              </div>

              <div className="flex justify-center gap-4 flex-wrap">
                <button
                  className="brush-btn primary"
                  type="submit"
                  disabled={!isMyTurn || submitting || !inputVerse.trim()}
                >
                  {submitting ? '核对中...' : '✍ 挥毫落笔'}
                </button>
                <button
                  type="button"
                  className="brush-btn"
                  onClick={() => setInputVerse('')}
                  disabled={!isMyTurn}
                >
                  清空重写
                </button>
              </div>

              {!isMyTurn && state.currentPlayerId && (
                <div className="text-center mt-4" style={{
                  fontSize: '0.9rem',
                  color: '#8b6a1f',
                  fontStyle: 'italic',
                }}>
                  非您执笔，请欣赏诗友对句
                </div>
              )}
            </form>
          </section>

          <section className="prompt-panel">
            <h2 className="section-title">
              接龙卷轴
              <span style={{
                marginLeft: 'auto',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                color: '#7a6a5a',
                fontWeight: 'normal',
              }}>
                共 {state.chain.length} 句
              </span>
            </h2>
            <VerseChain chain={state.chain} lastVerseId={lastVerseId} />
          </section>
        </main>
      </div>

      {blessing && (
        <div className="gold-blessing">
          <div style={{
            fontFamily: "'Ma Shan Zheng', 'STKaiti', serif",
            fontSize: '2rem',
            color: '#8b6a1f',
            textAlign: 'center',
          }}>
            ✦ {blessing} ✦
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="error-dialog">
          <div style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: '1rem',
            color: '#9e2522',
            fontWeight: 600,
          }}>
            {errorMsg}
          </div>
        </div>
      )}
    </>
  );
}
