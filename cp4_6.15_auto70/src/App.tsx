import { useState, useRef, useEffect, useCallback } from 'react';
import { GameEngine, Player, LoseReason } from './GameEngine';
import { ThemeType, THEME_LABELS } from './words';

type Phase = 'start' | 'playing' | 'result';

interface WordCard {
  word: string;
  playerIndex: number;
  id: string;
  colorIndex: number;
}

const CARD_COLORS = [
  'linear-gradient(135deg, #f5f0e8 0%, #e8ddd0 100%)',
  'linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%)',
  'linear-gradient(135deg, #f0fff4 0%, #d4f1d4 100%)',
  'linear-gradient(135deg, #f0f8ff 0%, #d4e9f7 100%)',
  'linear-gradient(135deg, #fffaf0 0%, #faecd4 100%)',
  'linear-gradient(135deg, #f5f0ff 0%, #e0d4f7 100%)'
];

const AVATAR_COLORS = [
  '#C8102E',
  '#008B8B',
  '#2F4F4F',
  '#8B4513',
  '#4A4A4A',
  '#6B4423'
];

function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function BrushAnimation() {
  return (
    <div className="brush-animation">
      <svg viewBox="0 0 300 300" width="200" height="200">
        <defs>
          <radialGradient id="inkGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1a1a1a" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#2a2a2a" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#4a4a4a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className="brush-group">
          <path
            d="M150 20 Q145 60 148 100 Q150 140 152 180 Q155 210 150 240"
            stroke="#8B4513"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M140 240 Q150 260 160 240 Q165 255 150 275 Q135 255 140 240"
            fill="#2a2a2a"
            className="brush-tip"
          />
        </g>
        <circle
          cx="150"
          cy="280"
          r="0"
          fill="url(#inkGrad)"
          className="ink-drop"
        />
      </svg>
    </div>
  );
}

function CountdownTimer({
  timeLeft,
  totalTime
}: {
  timeLeft: number;
  totalTime: number;
}) {
  const percentage = Math.max(0, Math.min(1, timeLeft / totalTime));
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentage);
  const isUrgent = timeLeft <= 5;

  const r = Math.round(34 + (1 - percentage) * 200);
  const g = Math.round(139 - (1 - percentage) * 89);
  const b = Math.round(34 - (1 - percentage) * 34);

  return (
    <div className={`countdown-timer ${isUrgent ? 'urgent' : ''}`}>
      <svg viewBox="0 0 180 180" width="180" height="180">
        <defs>
          <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#228B22" />
            <stop offset="50%" stopColor="#DAA520" />
            <stop offset="100%" stopColor="#C8102E" />
          </linearGradient>
        </defs>
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="rgba(255,255,255,0.5)"
          stroke="#e0d8cc"
          strokeWidth="8"
        />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={`rgb(${r},${g},${b})`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 90 90)"
          style={{ transition: 'stroke-dashoffset 0.05s linear, stroke 0.3s ease' }}
        />
        <text
          x="90"
          y="85"
          textAnchor="middle"
          className="countdown-text"
          fontSize="36"
          fill="#1a1a1a"
        >
          {Math.ceil(timeLeft)}
        </text>
        <text
          x="90"
          y="110"
          textAnchor="middle"
          fontSize="14"
          fill="#666"
        >
          秒
        </text>
      </svg>
    </div>
  );
}

function ThemeBanner({ theme }: { theme: ThemeType }) {
  return (
    <div className="theme-banner" key={theme}>
      <span className="theme-ribbon">
        {THEME_LABELS[theme]}
      </span>
    </div>
  );
}

function Avatar({ name, size = 60 }: { name: string; size?: number }) {
  const color = getAvatarColor(name);
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        backgroundColor: color
      }}
    >
      {initial}
    </div>
  );
}

function InkParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 4,
    size: 4 + Math.random() * 8
  }));

  return (
    <div className="ink-particles">
      {particles.map((p) => (
        <div
          key={p.id}
          className="ink-particle"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`
          }}
        />
      ))}
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('start');
  const [theme, setTheme] = useState<ThemeType>('idiom');
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<0 | 1>(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [wordCards, setWordCards] = useState<WordCard[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [players, setPlayers] = useState<[Player, Player]>([
    { id: '1', name: '玩家1', wordsCount: 0 },
    { id: '2', name: '玩家2', wordsCount: 0 }
  ]);
  const [gameResult, setGameResult] = useState<{
    winner: Player;
    loser: Player;
    reason: LoseReason;
  } | null>(null);

  const engineRef = useRef<GameEngine | null>(null);
  const historyListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playTickSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (timeLeft <= 5 && timeLeft > 0 && phase === 'playing') {
      playTickSound();
    }
  }, [Math.ceil(timeLeft), phase, playTickSound]);

  useEffect(() => {
    engineRef.current = new GameEngine({
      onTimeUpdate: (t) => setTimeLeft(t),
      onTurnChange: (idx) => {
        setCurrentPlayerIndex(idx);
        setInputValue('');
        setErrorMessage('');
        setTimeout(() => inputRef.current?.focus(), 100);
      },
      onWordAdded: (word, playerIndex) => {
        const colorIndex = Math.floor(Math.random() * CARD_COLORS.length);
        setWordCards((prev) => [
          ...prev,
          {
            word,
            playerIndex,
            id: `${word}-${Date.now()}-${Math.random()}`,
            colorIndex
          }
        ]);
        setCurrentWord(word);
        setInputValue('');
        setErrorMessage('');
      },
      onGameOver: (winner, loser, reason) => {
        setPlayers([winner, loser]);
        setGameResult({ winner, loser, reason });
        setPhase('result');
      },
      onError: (msg) => {
        setErrorMessage(msg);
        setTimeout(() => setErrorMessage(''), 2000);
      }
    });

    return () => {
      engineRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (historyListRef.current) {
      historyListRef.current.scrollTop = historyListRef.current.scrollHeight;
    }
  }, [wordCards]);

  const handleStartGame = () => {
    const p1 = player1Name.trim() || '玩家1';
    const p2 = player2Name.trim() || '玩家2';
    setWordCards([]);
    setGameResult(null);
    setPhase('playing');
    engineRef.current?.startGame(theme, [p1, p2]);
  };

  const handleSubmit = () => {
    if (!inputValue.trim()) {
      setErrorMessage('请输入一个词语');
      setTimeout(() => setErrorMessage(''), 2000);
      return;
    }
    engineRef.current?.submitWord(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleRestart = () => {
    setPhase('start');
    setWordCards([]);
    setCurrentWord('');
    setInputValue('');
    setErrorMessage('');
    setTimeLeft(30);
    setGameResult(null);
  };

  if (phase === 'start') {
    return (
      <div className="app start-phase">
        <div className="start-panel">
          <h1 className="game-title">词语接龙</h1>
          <p className="game-subtitle">双人对战 · 限时30秒</p>
          <BrushAnimation />
          <div className="start-form">
            <div className="input-row">
              <div className="input-group">
                <label>玩家1</label>
                <input
                  type="text"
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  placeholder="请输入玩家1名称"
                  maxLength={10}
                />
              </div>
              <div className="input-group">
                <label>玩家2</label>
                <input
                  type="text"
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  placeholder="请输入玩家2名称"
                  maxLength={10}
                />
              </div>
            </div>
            <div className="input-group">
              <label>词库主题</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as ThemeType)}
              >
                <option value="idiom">成语</option>
                <option value="daily">日常词语</option>
                <option value="english">英文单词</option>
              </select>
            </div>
            <button className="start-btn" onClick={handleStartGame}>
              开始对战
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'playing') {
    return (
      <div className="app play-phase">
        <ThemeBanner theme={theme} />
        <div className="game-layout">
          <div className="history-panel" ref={historyListRef}>
            <div className="history-title">词语记录</div>
            <div className="history-list">
              {wordCards.map((card, idx) => (
                <div
                  key={card.id}
                  className="word-card fade-in"
                  style={{
                    background: CARD_COLORS[card.colorIndex],
                    animationDelay: '0s'
                  }}
                >
                  <span className="word-index">{idx + 1}</span>
                  <span className="word-text">{card.word}</span>
                  {card.playerIndex >= 0 && (
                    <span
                      className={`word-player p${card.playerIndex + 1}`}
                    >
                      {players[card.playerIndex]?.name?.charAt(0) || '?'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="main-panel">
            <div className="players-bar">
              <div
                className={`player-info p1 ${
                  currentPlayerIndex === 0 ? 'active' : ''
                }`}
              >
                <Avatar name={players[0]?.name || '玩家1'} size={48} />
                <div className="player-detail">
                  <span className="player-name">{players[0]?.name || '玩家1'}</span>
                  <span className="player-count">
                    词语数: {players[0]?.wordsCount || 0}
                  </span>
                </div>
              </div>
              <div className="vs-text">VS</div>
              <div
                className={`player-info p2 ${
                  currentPlayerIndex === 1 ? 'active' : ''
                }`}
              >
                <Avatar name={players[1]?.name || '玩家2'} size={48} />
                <div className="player-detail">
                  <span className="player-name">{players[1]?.name || '玩家2'}</span>
                  <span className="player-count">
                    词语数: {players[1]?.wordsCount || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="center-area">
              <CountdownTimer timeLeft={timeLeft} totalTime={30} />
              <div className="current-word-box">
                <span className="current-label">当前词语</span>
                <span className="current-word">{currentWord}</span>
                <span className="hint-text">
                  请输入以「{currentWord.charAt(currentWord.length - 1)}」开头的词语
                </span>
              </div>
              <div className="input-area">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`${
                    players[currentPlayerIndex]?.name || `玩家${currentPlayerIndex + 1}`
                  }，请输入词语...`}
                  className="word-input"
                  autoFocus
                />
                <button className="submit-btn" onClick={handleSubmit}>
                  提交
                </button>
              </div>
              {errorMessage && (
                <div className="error-message fade-in">{errorMessage}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'result' && gameResult) {
    const { winner, loser, reason } = gameResult;
    const maxCount = Math.max(winner.wordsCount, loser.wordsCount, 1);
    const winnerHeight = (winner.wordsCount / maxCount) * 180;
    const loserHeight = (loser.wordsCount / maxCount) * 180;

    return (
      <div className="app result-phase">
        <ThemeBanner theme={theme} />
        <div className="game-layout result-layout">
          <div className="history-panel" ref={historyListRef}>
            <div className="history-title">词语记录</div>
            <div className="history-list">
              {wordCards.map((card, idx) => (
                <div
                  key={card.id}
                  className="word-card"
                  style={{ background: CARD_COLORS[card.colorIndex] }}
                >
                  <span className="word-index">{idx + 1}</span>
                  <span className="word-text">{card.word}</span>
                  {card.playerIndex >= 0 && (
                    <span className={`word-player p${card.playerIndex + 1}`}>
                      {players[card.playerIndex]?.name?.charAt(0) || '?'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="main-panel result-main">
            <div className="frosted-mask">
              <InkParticles />
              <div className="result-modal">
                <h2 className="result-title">游戏结束</h2>
                <p className="lose-reason">
                  {reason === 'timeout'
                    ? `${loser.name} 超时未作答`
                    : `${loser.name} 输入了重复词语`}
                </p>
                <div className="result-players">
                  <div className="result-player winner">
                    <div className="crown">👑</div>
                    <Avatar name={winner.name} size={80} />
                    <div className="result-name">{winner.name}</div>
                    <div className="result-tag">胜</div>
                  </div>
                  <div className="result-vs">VS</div>
                  <div className="result-player loser">
                    <Avatar name={loser.name} size={80} />
                    <div className="result-name">{loser.name}</div>
                    <div className="result-tag lose">负</div>
                  </div>
                </div>
                <div className="chart-container">
                  <div className="chart-title">词语总数对比</div>
                  <div className="bar-chart">
                    <div className="bar-wrapper">
                      <div
                        className="bar winner-bar"
                        style={{ height: winnerHeight }}
                      />
                      <div className="bar-label">{winner.wordsCount}</div>
                      <div className="bar-name">{winner.name}</div>
                    </div>
                    <div className="bar-wrapper">
                      <div
                        className="bar loser-bar"
                        style={{ height: loserHeight }}
                      />
                      <div className="bar-label">{loser.wordsCount}</div>
                      <div className="bar-name">{loser.name}</div>
                    </div>
                  </div>
                </div>
                <button className="restart-btn" onClick={handleRestart}>
                  再来一局
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
