import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

type Phase = 'lobby' | 'waiting' | 'playing' | 'roundEnd';

interface RankingPlayer {
  rank: number; id: string; nickname: string; avatar: string;
  score: number; isHost: boolean;
  feedback?: { type: 'success' | 'error'; timestamp: number } | null;
}

interface GameRecord {
  id: string; playerId: string; nickname: string; avatar: string;
  input: string; correct: boolean; scoreDelta: number;
  timestamp: number; songTitle: string;
}

interface CurrentSong {
  id: string; title: string; artist: string; chorusStart: number;
  chorusEnd: number; duration: number; audioUrl: string;
  targetLyric: string; nextLyric: string;
}

const App: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('lobby');
  const [nickname, setNickname] = useState('');
  const [roomName, setRoomName] = useState('');
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [isHost, setIsHost] = useState(false);
  const [ranking, setRanking] = useState<RankingPlayer[]>([]);
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [currentSong, setCurrentSong] = useState<CurrentSong | null>(null);
  const [countdown, setCountdown] = useState(15);
  const [roundNumber, setRoundNumber] = useState(0);
  const [inputLyric, setInputLyric] = useState('');
  const [hostInfo, setHostInfo] = useState<{ nickname: string; avatar: string } | null>(null);
  const [lastAnswer, setLastAnswer] = useState<string>('');
  const [newHostToast, setNewHostToast] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [buttonPressed, setButtonPressed] = useState(false);
  const [toast, setToast] = useState<string>('');

  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioProgressRef = useRef<HTMLDivElement | null>(null);
  const audioTimeRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const resizeRef = useRef<number>(0);
  const rankAnimRef = useRef<number>(0);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  // Socket initialization
  useEffect(() => {
    const socket = io('/', { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('playerJoined', (data: any) => {
      showToast(`${data.player.nickname} 加入了房间`);
    });
    socket.on('playerLeft', (data: any) => {
      showToast(`${data.nickname} 离开了房间`);
    });
    socket.on('updateRanking', (data: { ranking: RankingPlayer[]; hostId: string }) => {
      setRanking(data.ranking);
      const host = data.ranking.find(r => r.id === data.hostId);
      if (host) setHostInfo({ nickname: host.nickname, avatar: host.avatar });
    });
    socket.on('updateRecords', (data: { records: GameRecord[] }) => {
      setRecords([...data.records].reverse());
    });
    socket.on('roundStarted', (data: any) => {
      setCurrentSong(data.song);
      setCountdown(data.countdown);
      setRoundNumber(data.roundNumber);
      setPhase('playing');
      setInputLyric('');
      setLastAnswer('');
      setNewHostToast(null);
      if (audioRef.current) {
        audioRef.current.src = data.song.audioUrl;
        audioRef.current.currentTime = data.song.chorusStart;
        audioRef.current.play().catch(() => {});
        audioTimeRef.current = data.song.chorusStart;
      }
    });
    socket.on('countdownTick', (data: { countdown: number }) => {
      setCountdown(data.countdown);
    });
    socket.on('roundEnded', (data: { correctAnswer: string; newHost: { nickname: string; avatar: string } }) => {
      setLastAnswer(data.correctAnswer);
      setPhase('roundEnd');
      if (audioRef.current) audioRef.current.pause();
      setNewHostToast(`🏆 新主持人：${data.newHost.avatar} ${data.newHost.nickname}`);
      setTimeout(() => setNewHostToast(null), 3000);
    });
    socket.on('broadcastResult', (_data: any) => {
      // handled via updateRanking & updateRecords
    });

    return () => { socket.disconnect(); };
  }, []);

  // Audio progress animation
  useEffect(() => {
    let raf = 0;
    const animate = () => {
      if (audioRef.current && currentSong && phase === 'playing') {
        const dur = currentSong.chorusEnd - currentSong.chorusStart;
        const cur = audioRef.current.currentTime - currentSong.chorusStart;
        const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
        if (audioProgressRef.current) {
          audioProgressRef.current.style.width = pct + '%';
        }
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [currentSong, phase]);

  // Canvas ranking chart
  useEffect(() => {
    let raf = 0;
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) { raf = requestAnimationFrame(draw); return; }
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const W = Math.max(100, rect.width);
      const H = Math.max(100, rect.height);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      const R = Math.min(W, H) * 0.4;
      const rInner = R * 0.65;

      const n = Math.max(1, ranking.length);
      const total = ranking.reduce((s, p) => s + Math.max(1, p.score), 0);
      const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
      const coolPalette = ['#4FC3F7', '#64B5F6', '#7986CB', '#9575CD', '#BA68C8', '#F06292'];

      rankAnimRef.current += 0.008;
      const wobble = Math.sin(rankAnimRef.current) * 0.01;

      let startAngle = -Math.PI / 2 + wobble;

      // outer bg
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = R - rInner;
      ctx.stroke();

      for (let i = 0; i < n; i++) {
        const p = ranking[i];
        const val = Math.max(1, p.score);
        const frac = val / total;
        const sweep = Math.max(0.04, frac) * Math.PI * 2;
        const endAngle = startAngle + sweep;
        ctx.beginPath();
        ctx.arc(cx, cy, (R + rInner) / 2, startAngle, endAngle);
        let color: string;
        if (i < 3) color = medalColors[i];
        else color = coolPalette[(i - 3) % coolPalette.length];
        ctx.strokeStyle = color;
        ctx.lineWidth = R - rInner - 2;
        ctx.lineCap = 'butt';
        ctx.stroke();
        // tick at outer edge
        const midAng = (startAngle + endAngle) / 2;
        const tx = cx + Math.cos(midAng) * (R + 4);
        const ty = cy + Math.sin(midAng) * (R + 4);
        ctx.fillStyle = color;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = W < 220 ? String(i + 1) : p.nickname.slice(0, 4);
        ctx.fillText(label, tx, ty);
        startAngle = endAngle;
      }

      // inner host display
      ctx.beginPath();
      ctx.arc(cx, cy, rInner - 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fill();
      const isMobileSmall = W < 260;
      ctx.fillStyle = '#FFD700';
      ctx.font = isMobileSmall ? '18px sans-serif' : '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👑', cx, cy - (isMobileSmall ? 10 : 18));
      ctx.fillStyle = '#fff';
      ctx.font = isMobileSmall ? 'bold 9px sans-serif' : 'bold 13px sans-serif';
      ctx.fillText(hostInfo?.nickname ? '主持人' : '等待中', cx, cy + (isMobileSmall ? 2 : 8));
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = isMobileSmall ? '13px sans-serif' : '20px sans-serif';
      const hostLabel = hostInfo ? `${hostInfo.avatar} ${hostInfo.nickname.slice(0, 6)}` : '—';
      ctx.fillText(hostLabel, cx, cy + (isMobileSmall ? 18 : 30));

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [ranking, hostInfo]);

  // Resize observer
  useEffect(() => {
    const onResize = () => { resizeRef.current += 1; };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const joinOrCreateRoom = (action: 'create' | 'join') => {
    if (!nickname.trim() || !roomName.trim()) {
      showToast('请填写昵称和房间名');
      return;
    }
    socketRef.current?.emit('joinRoom', { roomName, nickname }, (res: any) => {
      if (res?.success) {
        setMyPlayerId(res.playerId);
        setIsHost(res.isHost);
        setPhase('waiting');
        if (action === 'create') showToast('🎉 房间创建成功！');
        else showToast('✅ 加入房间成功！');
      } else {
        showToast('操作失败，请重试');
      }
    });
  };

  const startRound = () => {
    socketRef.current?.emit('startRound', {}, (res: any) => {
      if (!res?.success) showToast('开始失败，请稍后');
    });
  };

  const submitLyric = useCallback(() => {
    if (!inputLyric.trim() || phase !== 'playing') return;
    setButtonPressed(true);
    setTimeout(() => setButtonPressed(false), 180);
    socketRef.current?.emit('submitLyric', { input: inputLyric }, (res: any) => {
      if (res?.success) {
        if (res.correct) {
          showToast(`✅ 正确！+${res.scoreDelta}分`);
        } else {
          showToast('❌ 再想想...');
        }
        setInputLyric('');
      }
    });
  }, [inputLyric, phase]);

  // Enter key submit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && phase === 'playing') {
        e.preventDefault();
        submitLyric();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [submitLyric, phase]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const getMediaQuery = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  };
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(getMediaQuery());
    const h = () => setIsMobile(getMediaQuery());
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const sortedRecords = records;

  // ===== RENDER LOBBY =====
  if (phase === 'lobby') {
    return (
      <div style={styles.page}>
        <div style={styles.lobbyCard}>
          <div style={{ fontSize: 52, marginBottom: 8, textAlign: 'center' }}>🎤</div>
          <h1 style={styles.lobbyTitle}>歌词接龙演唱会</h1>
          <p style={styles.lobbySubtitle}>和朋友们一起在线K歌，接歌词，争当麦霸！</p>

          <div style={styles.inputGroup}>
            <label style={styles.label}>你的昵称</label>
            <input
              style={styles.lobbyInput}
              placeholder="请输入昵称..."
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              maxLength={12}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>房间名（支持中文）</label>
            <input
              style={styles.lobbyInput}
              placeholder="如：欢乐K歌房"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              maxLength={20}
            />
          </div>

          <div style={styles.btnRow}>
            <button style={{ ...styles.lobbyBtn, background: 'linear-gradient(135deg,#FF4081,#9C27B0)' }}
              onClick={() => joinOrCreateRoom('create')}>
              🎬 创建房间
            </button>
            <button style={{ ...styles.lobbyBtn, background: 'linear-gradient(135deg,#00E676,#00BCD4)' }}
              onClick={() => joinOrCreateRoom('join')}>
              🚪 加入房间
            </button>
          </div>

          <div style={styles.features}>
            <div style={styles.featureItem}>🎵 20+热门歌曲随机播放</div>
            <div style={styles.featureItem}>⏱️ 15秒倒计时挑战</div>
            <div style={styles.featureItem}>🏆 实时排名PK麦霸</div>
          </div>
        </div>
        {toast && <div style={styles.toast}>{toast}</div>}
      </div>
    );
  }

  // ===== RENDER ROOM / GAME =====
  return (
    <div style={styles.page}>
      {/* Header bar with light flow effect */}
      <div style={styles.headerBar}>
        <div style={styles.headerGlow} />
        <div style={styles.headerInner}>
          <div style={styles.headerRoom}>
            <span style={styles.headerIcon}>🎤</span>
            <span style={styles.headerTitle}>{roomName || '我的演唱会房间'}</span>
            {phase !== 'waiting' && (
              <span style={styles.roundBadge}>第 {roundNumber} 轮</span>
            )}
          </div>
          <div style={styles.headerUser}>
            {ranking.find(p => p.id === myPlayerId)?.avatar} {nickname}
            {isHost && <span style={styles.hostBadge}>主持人</span>}
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      {isMobile ? (
        <div style={styles.mobileContainer}>
          {/* Small ranking ring on top left */}
          <div style={styles.mobileRankCard}>
            <canvas ref={canvasRef} style={{ width: '100%', height: 180 }} />
          </div>

          {/* Main content */}
          <div style={styles.mobileMain}>
            {renderPlayerAvatars()}
            {renderGameCenter()}
            {renderRecordCard()}
          </div>
        </div>
      ) : (
        // Desktop layout
        <div style={styles.desktopGrid}>
          <div style={styles.leftCol}>
            {renderRankCard()}
            {renderPlayerAvatars()}
          </div>

          <div style={styles.centerCol}>
            {renderGameCenter()}
          </div>

          <div style={styles.rightCol}>
            {renderRecordCard()}
          </div>
        </div>
      )}

      {newHostToast && <div style={styles.newHostToast}>{newHostToast}</div>}
      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );

  function renderPlayerAvatars() {
    return (
      <div style={styles.avatarBar}>
        {ranking.map(p => {
          const now = Date.now();
          const fb = p.feedback && (now - p.feedback.timestamp < 500) ? p.feedback : null;
          const me = p.id === myPlayerId;
          return (
            <div key={p.id}
              style={{
                ...styles.avatarWrap,
                animation: fb ? (fb.type === 'success' ? 'bounceY 0.5s ease' : 'shakeX 0.3s ease') : undefined,
                boxShadow: fb?.type === 'success' ? '0 0 20px 4px #00E676' :
                  fb?.type === 'error' ? '0 0 16px 3px #FF1744' :
                    p.isHost ? '0 0 12px 2px #FFD700' : '0 0 6px rgba(255,255,255,0.2)',
                borderColor: fb?.type === 'error' ? '#FF1744' : p.isHost ? '#FFD700' : 'rgba(255,255,255,0.3)',
                background: fb?.type === 'error' ? 'rgba(255,23,68,0.15)' :
                  p.isHost ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.05)'
              }}
              title={`${p.nickname} ${p.score}分${p.isHost ? ' (主持人)' : ''}`}>
              <div style={styles.avatarEmoji}>{p.avatar}</div>
              {p.isHost && <div style={styles.crownMini}>👑</div>}
              <div style={{ ...styles.avatarName, color: me ? '#FFD700' : 'rgba(255,255,255,0.9)' }}>
                {p.nickname.slice(0, 5)}
              </div>
              <div style={styles.avatarScore}>{p.score}</div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderRankCard() {
    return (
      <div style={styles.glassCard}>
        <h3 style={styles.cardTitle}>🏆 实时排名</h3>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1' }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        </div>
        <div style={styles.rankList}>
          {ranking.slice(0, 5).map((p, i) => (
            <div key={p.id} style={styles.rankRow}>
              <span style={{
                ...styles.rankNo,
                color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'rgba(255,255,255,0.7)'
              }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${p.rank}`}
              </span>
              <span style={{ fontSize: 18 }}>{p.avatar}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.nickname}
              </span>
              <span style={{ fontWeight: 700, color: '#FFD700' }}>{p.score}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderGameCenter() {
    const songTime = audioRef.current ? audioRef.current.currentTime : (currentSong?.chorusStart || 0);
    const remain = phase === 'playing' ? countdown : 15;

    return (
      <>
        {/* Waiting phase */}
        {phase === 'waiting' && (
          <div style={styles.glassCard}>
            <div style={{ textAlign: 'center', padding: '24px 8px' }}>
              <div style={{ fontSize: 64, marginBottom: 12 }}>🎙️</div>
              <h2 style={styles.waitTitle}>等待主持人开始...</h2>
              <p style={styles.waitSub}>
                当前房间：<b style={{ color: '#FFD700' }}>{ranking.length}</b> 人已就位
              </p>
              {isHost && (
                <button style={styles.startBtn} onClick={startRound}>
                  🎬 开始本轮（随机歌曲）
                </button>
              )}
              <div style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                提示：每轮答对得分 = 10 + 剩余秒数×2，得分最高者成为下轮主持人
              </div>
            </div>
          </div>
        )}

        {/* Round ended */}
        {phase === 'roundEnd' && (
          <div style={styles.glassCard}>
            <div style={{ textAlign: 'center', padding: '16px 8px' }}>
              <div style={{ fontSize: 48 }}>⏰</div>
              <h2 style={styles.waitTitle}>本轮结束！</h2>
              {lastAnswer && (
                <div style={styles.answerReveal}>
                  正确答案：<span style={{ color: '#00E676', fontWeight: 700 }}>{lastAnswer}</span>
                </div>
              )}
              {isHost && (
                <button style={styles.startBtn} onClick={startRound}>
                  🎬 开启下一轮
                </button>
              )}
              {!isHost && (
                <p style={{ marginTop: 16, color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                  等待主持人开启下一轮...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Playing phase - Song player */}
        {phase === 'playing' && currentSong && (
          <>
            <div style={styles.songCard}>
              <div style={styles.songHeader}>
                <div>
                  <div style={styles.songTitle}>{currentSong.title}</div>
                  <div style={styles.songArtist}>{currentSong.artist}</div>
                </div>
                <div style={remain <= 5 ? { ...styles.timer, color: '#FF1744', animation: 'pulse 0.5s ease infinite' } : styles.timer}>
                  ⏱️ {remain}s
                </div>
              </div>

              <audio ref={audioRef} preload="auto" />

              <div style={styles.lyricBox}>
                <div style={styles.lyricLabel}>🎶 当前播放歌词</div>
                <div style={styles.currentLyric}>{currentSong.targetLyric}</div>
                <div style={styles.lyricDivider}>⬇ 请接下一句 ⬇</div>
              </div>

              <div style={styles.progressBar}>
                <div style={styles.progressTrack}>
                  <div ref={audioProgressRef} style={{
                    ...styles.progressFill,
                    background: 'linear-gradient(90deg,#FF4081,#FFD700,#00E676)'
                  }} />
                </div>
                <div style={styles.progressTime}>
                  <span>{formatTime(songTime)}</span>
                  <span>{formatTime(currentSong.chorusEnd)}</span>
                </div>
              </div>
            </div>

            <div style={styles.glassCard}>
              <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                <input
                  style={{
                    ...styles.gameInput,
                    ...(inputFocused ? styles.gameInputFocused : {}),
                    transform: inputFocused ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.25s cubic-bezier(.22,1.5,.36,1)'
                  }}
                  placeholder="快速输入下一句歌词，按Enter提交..."
                  value={inputLyric}
                  onChange={e => setInputLyric(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  maxLength={80}
                />
                <button
                  style={{
                    ...styles.submitBtn,
                    transform: buttonPressed ? 'scale(0.92)' : 'scale(1)',
                    transition: 'transform 0.15s cubic-bezier(.22,2,.36,1)'
                  }}
                  onClick={submitLyric}
                >
                  提交
                </button>
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  function renderRecordCard() {
    return (
      <div style={styles.glassCard}>
        <h3 style={styles.cardTitle}>📜 接龙记录</h3>
        <div style={styles.recordsList}>
          {sortedRecords.length === 0 && (
            <div style={styles.emptyRecords}>暂无记录，等待第一轮开启...</div>
          )}
          {sortedRecords.map(r => {
            const time = new Date(r.timestamp);
            const ts = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;
            return (
              <div key={r.id} style={styles.recordItem}>
                <div style={styles.recordAvatar}>{r.avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.recordTop}>
                    <span style={{
                      background: r.correct
                        ? 'linear-gradient(90deg,#00E676,#00BCD4)'
                        : 'linear-gradient(90deg,#FF1744,#FF4081)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontWeight: 700, fontSize: 11
                    }}>
                      {ts}
                    </span>
                    <span style={{ marginLeft: 6, fontWeight: 600, color: '#fff' }}>
                      {r.nickname.slice(0, 6)}
                    </span>
                    {r.correct && (
                      <span style={{
                        marginLeft: 'auto', background: 'rgba(0,230,118,0.18)',
                        color: '#00E676', padding: '1px 6px', borderRadius: 10,
                        fontSize: 11, fontWeight: 700
                      }}>+{r.scoreDelta}</span>
                    )}
                  </div>
                  <div style={{
                    ...styles.recordInput,
                    color: r.correct ? 'rgba(255,255,255,0.95)' : 'rgba(255,100,100,0.85)',
                    textDecoration: r.correct ? 'none' : 'line-through'
                  }}>
                    {r.correct ? '✅ ' : '❌ '}{r.input}
                  </div>
                  <div style={styles.recordSong}>🎵 {r.songTitle}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
};

// ===== STYLES =====
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    padding: 0,
    position: 'relative',
    color: '#fff'
  },
  lobbyCard: {
    maxWidth: 460,
    margin: '0 auto',
    padding: '48px 36px 36px',
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(16px)',
    borderRadius: 28,
    border: '1px solid rgba(255,255,255,0.15)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    marginTop: '8vh'
  },
  lobbyTitle: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
    background: 'linear-gradient(90deg,#FFD700,#FF4081,#9C27B0)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: 900,
    letterSpacing: 1
  },
  lobbySubtitle: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 28
  },
  inputGroup: { marginBottom: 18 },
  label: {
    display: 'block',
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 6,
    fontWeight: 600
  },
  lobbyInput: {
    width: '100%',
    padding: '14px 16px',
    fontSize: 16,
    background: 'rgba(255,255,255,0.06)',
    border: '2px solid rgba(255,255,255,0.12)',
    borderRadius: 14,
    color: '#fff',
    outline: 'none',
    transition: 'all 0.25s ease',
    boxSizing: 'border-box'
  },
  btnRow: {
    display: 'flex',
    gap: 12,
    marginTop: 24,
    marginBottom: 20
  },
  lobbyBtn: {
    flex: 1,
    padding: '14px 16px',
    fontSize: 15,
    fontWeight: 700,
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
    transition: 'transform 0.15s ease'
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginTop: 16,
    paddingTop: 16,
    borderTop: '1px solid rgba(255,255,255,0.1)'
  },
  featureItem: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center'
  },

  headerBar: {
    position: 'relative',
    overflow: 'hidden',
    padding: '14px 24px',
    background: 'linear-gradient(90deg, rgba(156,39,176,0.5), rgba(255,64,129,0.5))',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,255,255,0.1)'
  },
  headerGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.45) 25%, rgba(255,182,193,0.5) 50%, rgba(0,230,118,0.45) 75%, transparent 100%)',
    animation: 'flowLight 4s linear infinite'
  },
  headerInner: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerRoom: { display: 'flex', alignItems: 'center', gap: 10 },
  headerIcon: { fontSize: 24 },
  headerTitle: { fontSize: 20, fontWeight: 800, letterSpacing: 1 },
  roundBadge: {
    background: 'rgba(255,64,129,0.7)',
    padding: '3px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    marginLeft: 6
  },
  headerUser: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  hostBadge: {
    background: 'linear-gradient(135deg,#FFD700,#FF8F00)',
    color: '#2a1a3a',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 800
  },

  desktopGrid: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr 340px',
    gap: 20,
    padding: '20px 24px 40px',
    maxWidth: 1600,
    margin: '0 auto'
  },
  leftCol: { display: 'flex', flexDirection: 'column', gap: 20 },
  centerCol: { display: 'flex', flexDirection: 'column', gap: 20 },
  rightCol: { display: 'flex', flexDirection: 'column', gap: 20, maxHeight: 'calc(100vh - 120px)' },

  mobileContainer: {
    display: 'flex',
    flexDirection: 'column',
    padding: 12,
    gap: 12
  },
  mobileRankCard: {
    width: 180,
    alignSelf: 'flex-start',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 6,
    margin: '-8px 0 0 8px'
  },
  mobileMain: { display: 'flex', flexDirection: 'column', gap: 12 },

  glassCard: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 18,
    backdropFilter: 'blur(14px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 800,
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },

  avatarBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    padding: 14,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.12)',
    backdropFilter: 'blur(10px)'
  },
  avatarWrap: {
    position: 'relative',
    width: 68,
    padding: '8px 6px 6px',
    border: '2px solid rgba(255,255,255,0.2)',
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'all 0.3s ease'
  },
  avatarEmoji: { fontSize: 28, lineHeight: 1.2 },
  crownMini: {
    position: 'absolute',
    top: -6,
    right: -4,
    fontSize: 16
  },
  avatarName: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: 600,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%'
  },
  avatarScore: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: 800,
    marginTop: 2
  },

  rankList: {
    marginTop: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    maxHeight: 200,
    overflowY: 'auto'
  },
  rankRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    fontSize: 13
  },
  rankNo: { fontWeight: 800, minWidth: 28, fontSize: 13 },

  songCard: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 24,
    backdropFilter: 'blur(14px)'
  },
  songHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  songTitle: { fontSize: 26, fontWeight: 900, letterSpacing: 1 },
  songArtist: { color: 'rgba(255,255,255,0.65)', fontSize: 14, marginTop: 4 },
  timer: {
    fontSize: 32,
    fontWeight: 900,
    color: '#FFD700',
    fontFamily: '"Courier New", monospace',
    textShadow: '0 0 12px rgba(255,215,0,0.5)'
  },

  lyricBox: {
    background: 'linear-gradient(135deg, rgba(156,39,176,0.25), rgba(255,64,129,0.2))',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 18,
    textAlign: 'center',
    marginBottom: 18
  },
  lyricLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 },
  currentLyric: {
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.6,
    background: 'linear-gradient(90deg,#FFD700,#FF4081)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  lyricDivider: {
    marginTop: 10,
    fontSize: 12,
    color: '#00E676',
    fontWeight: 700,
    letterSpacing: 2
  },

  progressBar: { marginTop: 4 },
  progressTrack: {
    width: '100%',
    height: 8,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    overflow: 'hidden'
  },
  progressFill: { height: '100%', borderRadius: 8, transition: 'width 0.1s linear' },
  progressTime: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 6,
    fontFamily: '"Courier New", monospace'
  },

  gameInput: {
    flex: 1,
    padding: '16px 18px',
    fontSize: 16,
    background: 'rgba(255,255,255,0.06)',
    border: '2px solid rgba(255,255,255,0.15)',
    borderRadius: 14,
    color: '#fff',
    outline: 'none',
    fontWeight: 500,
    boxSizing: 'border-box'
  },
  gameInputFocused: {
    borderColor: '#00E676',
    boxShadow: '0 0 0 4px rgba(0,230,118,0.25), 0 0 20px rgba(0,230,118,0.4)'
  },
  submitBtn: {
    padding: '14px 28px',
    fontSize: 16,
    fontWeight: 800,
    color: '#2a1a3a',
    background: 'linear-gradient(135deg,#FFD700,#FF8F00)',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
    boxShadow: '0 6px 18px rgba(255,215,0,0.4)'
  },

  waitTitle: { fontSize: 22, marginBottom: 8, fontWeight: 800 },
  waitSub: { color: 'rgba(255,255,255,0.65)', fontSize: 14, marginBottom: 22 },
  startBtn: {
    padding: '16px 36px',
    fontSize: 17,
    fontWeight: 800,
    color: '#2a1a3a',
    background: 'linear-gradient(135deg,#FFD700,#FF4081,#9C27B0)',
    border: 'none',
    borderRadius: 16,
    cursor: 'pointer',
    boxShadow: '0 10px 28px rgba(255,64,129,0.4)',
    letterSpacing: 1,
    marginTop: 8
  },
  answerReveal: {
    fontSize: 16,
    padding: '12px 16px',
    background: 'rgba(0,230,118,0.1)',
    border: '1px solid rgba(0,230,118,0.3)',
    borderRadius: 12,
    margin: '14px 0 18px',
    display: 'inline-block'
  },

  recordsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    maxHeight: 'calc(100vh - 280px)',
    minHeight: 300,
    overflowY: 'auto',
    paddingRight: 4
  },
  emptyRecords: {
    textAlign: 'center',
    padding: 40,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13
  },
  recordItem: {
    display: 'flex',
    gap: 10,
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    animation: 'slideIn 0.5s cubic-bezier(.16,1,.3,1)',
    borderLeft: '3px solid rgba(255,255,255,0.2)'
  },
  recordAvatar: {
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    flexShrink: 0
  },
  recordTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    marginBottom: 4
  },
  recordInput: {
    fontSize: 13,
    lineHeight: 1.4,
    wordBreak: 'break-all'
  },
  recordSong: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4
  },

  toast: {
    position: 'fixed',
    bottom: 40,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(8px)',
    padding: '10px 20px',
    borderRadius: 24,
    fontSize: 14,
    fontWeight: 600,
    zIndex: 9999,
    border: '1px solid rgba(255,255,255,0.15)',
    animation: 'fadeUp 0.3s ease'
  },
  newHostToast: {
    position: 'fixed',
    top: '40%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
    background: 'linear-gradient(135deg, rgba(255,215,0,0.95), rgba(255,64,129,0.95))',
    color: '#2a1a3a',
    padding: '20px 40px',
    borderRadius: 20,
    fontSize: 22,
    fontWeight: 900,
    zIndex: 9998,
    boxShadow: '0 20px 60px rgba(255,215,0,0.5)',
    animation: 'popIn 0.4s cubic-bezier(.16,1.6,.3,1)'
  }
};

// Inject keyframes
if (typeof document !== 'undefined') {
  const id = 'lc-keyframes';
  if (!document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.innerHTML = `
@keyframes flowLight { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
@keyframes bounceY { 0%,100% { transform: translateY(0); } 30% { transform: translateY(-12px); } 60% { transform: translateY(4px); } }
@keyframes shakeX { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
@keyframes fadeUp { 0% { opacity: 0; transform: translate(-50%, 20px); } 100% { opacity: 1; transform: translate(-50%, 0); } }
@keyframes popIn { 0% { opacity: 0; transform: translate(-50%,-50%) scale(0.5); } 60% { transform: translate(-50%,-50%) scale(1.1); } 100% { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
@keyframes slideIn { 0% { opacity: 0; transform: translateY(-12px); } 100% { opacity: 1; transform: translateY(0); } }
input:focus { outline: none; }
button:active { transform: scale(0.97) !important; }
::selection { background: rgba(255,64,129,0.4); }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 6px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
`;
    document.head.appendChild(el);
  }
}

export default App;
