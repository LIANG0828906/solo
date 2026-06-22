import React, { useState, useEffect, useRef, useCallback } from 'react';
import { scoreManager, SortMode } from './ScoreManager';
import { ChallengeEngine, ChallengeState, ChallengeRequest } from './ChallengeEngine';
import TowerRenderer from './TowerRenderer';
import { Player, GameType, GAME_TYPES, getPlayerMaxScore } from './utils/scores';
import './App.css';

const challengeEngine = new ChallengeEngine();

const StarCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const stars = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 0.5 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1.5,
    }));

    let animId: number;
    const draw = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        const alpha = 0.3 + 0.7 * Math.abs(Math.sin(time * 0.001 * s.speed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };
    animId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="star-canvas" />;
};

const RegistrationPanel: React.FC<{
  onRegister: (name: string) => void;
  onUploadScore: (game: GameType, score: number, url: string) => void;
  currentPlayer: Player | null;
}> = ({ onRegister, onUploadScore, currentPlayer }) => {
  const [name, setName] = useState('');
  const [scoreInput, setScoreInput] = useState('');
  const [gameType, setGameType] = useState<GameType>('raiden');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [error, setError] = useState('');

  const handleRegister = () => {
    const trimmed = name.trim();
    if (!/^[A-Za-z0-9]{2,8}$/.test(trimmed)) {
      setError('ID需为2-8位英文字母或数字');
      return;
    }
    setError('');
    onRegister(trimmed);
  };

  const handleUpload = () => {
    const score = parseInt(scoreInput, 10);
    if (isNaN(score) || score <= 0) return;
    onUploadScore(gameType, score, screenshotUrl);
    setScoreInput('');
    setScreenshotUrl('');
  };

  return (
    <div className="registration-panel glass-panel">
      <h2 className="panel-title">PLAYER ID</h2>
      {!currentPlayer ? (
        <div className="register-form">
          <div className="input-group">
            <input
              type="text"
              className="neon-input"
              placeholder="输入复古ID..."
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
              maxLength={8}
            />
            <div className="input-underline" />
            {error && <div className="input-error">{error}</div>}
          </div>
          <button className="neon-button" onClick={handleRegister}>
            我开打
          </button>
        </div>
      ) : (
        <div className="player-profile">
          <div className="profile-avatar" style={{ backgroundColor: currentPlayer.avatarColor }}>
            {currentPlayer.name.charAt(0)}
          </div>
          <div className="profile-name">{currentPlayer.name}</div>
          <div className="profile-score">
            最高分: {getPlayerMaxScore(currentPlayer).toLocaleString()}
          </div>
          <div className="upload-section">
            <h3 className="section-title">上传得分</h3>
            <select
              className="neon-select"
              value={gameType}
              onChange={e => setGameType(e.target.value as GameType)}
            >
              {GAME_TYPES.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
            <input
              type="number"
              className="neon-input"
              placeholder="输入分数..."
              value={scoreInput}
              onChange={e => setScoreInput(e.target.value)}
            />
            <input
              type="text"
              className="neon-input"
              placeholder="截图链接(可选)"
              value={screenshotUrl}
              onChange={e => setScreenshotUrl(e.target.value)}
            />
            <button className="neon-button small" onClick={handleUpload}>
              提交分数
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const FilterPanel: React.FC<{
  gameFilter: GameType | 'all';
  sortMode: SortMode;
  onGameFilterChange: (f: GameType | 'all') => void;
  onSortModeChange: (s: SortMode) => void;
}> = ({ gameFilter, sortMode, onGameFilterChange, onSortModeChange }) => (
  <div className="filter-panel glass-panel">
    <h3 className="panel-subtitle">筛选 & 排序</h3>
    <div className="filter-group">
      <label className="filter-label">游戏类型</label>
      <select
        className="neon-select"
        value={gameFilter}
        onChange={e => onGameFilterChange(e.target.value as GameType | 'all')}
      >
        <option value="all">全部</option>
        {GAME_TYPES.map(g => (
          <option key={g.value} value={g.value}>{g.label}</option>
        ))}
      </select>
    </div>
    <div className="filter-group">
      <label className="filter-label">排序方式</label>
      <select
        className="neon-select"
        value={sortMode}
        onChange={e => onSortModeChange(e.target.value as SortMode)}
      >
        <option value="score">积分</option>
        <option value="winrate">胜率</option>
        <option value="challenges">挑战次数</option>
      </select>
    </div>
  </div>
);

const ChallengeSetupPanel: React.FC<{
  challenger: Player;
  challenged: Player;
  onStart: (request: ChallengeRequest) => void;
  onCancel: () => void;
}> = ({ challenger, challenged, onStart, onCancel }) => {
  const [duration, setDuration] = useState(30);
  const [game, setGame] = useState<GameType>('raiden');

  return (
    <div className="challenge-setup-overlay" onClick={onCancel}>
      <div className="challenge-setup-panel glass-panel" onClick={e => e.stopPropagation()}>
        <h2 className="panel-title">⚔ 约战设置</h2>
        <div className="challenge-players">
          <div className="challenge-player-card red">
            <div className="challenge-avatar" style={{ backgroundColor: challenger.avatarColor }}>
              {challenger.name.charAt(0)}
            </div>
            <div className="challenge-player-name">{challenger.name}</div>
          </div>
          <div className="vs-badge">VS</div>
          <div className="challenge-player-card blue">
            <div className="challenge-avatar" style={{ backgroundColor: challenged.avatarColor }}>
              {challenged.name.charAt(0)}
            </div>
            <div className="challenge-player-name">{challenged.name}</div>
          </div>
        </div>
        <div className="challenge-options">
          <div className="filter-group">
            <label className="filter-label">挑战时长</label>
            <div className="duration-options">
              {[30, 60, 120].map(d => (
                <button
                  key={d}
                  className={`neon-button small ${duration === d ? 'active' : ''}`}
                  onClick={() => setDuration(d)}
                >
                  {d}秒
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label className="filter-label">游戏类型</label>
            <select
              className="neon-select"
              value={game}
              onChange={e => setGame(e.target.value as GameType)}
            >
              {GAME_TYPES.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="challenge-actions">
          <button className="neon-button start" onClick={() => onStart({ challengerId: challenger.id, challengedId: challenged.id, game, duration })}>
            开始挑战!
          </button>
          <button className="neon-button cancel" onClick={onCancel}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

const ChallengeOverlay: React.FC<{
  challengeState: ChallengeState;
  challenger: Player | undefined;
  challenged: Player | undefined;
}> = ({ challengeState, challenger, challenged }) => {
  const maxScore = Math.max(challengeState.challengerScore, challengeState.challengedScore, 1);

  return (
    <div className="challenge-overlay">
      <div className="challenge-timer">
        <div className="timer-ring">
          <span className="timer-text">{Math.ceil(challengeState.remainingTime)}s</span>
        </div>
      </div>
      <div className="challenge-split">
        <div className={`split-side red ${challengeState.status === 'ended' && challengeState.winnerId === challenger?.id ? 'winner-side' : ''} ${challengeState.status === 'ended' && challengeState.winnerId !== challenger?.id ? 'loser-side' : ''}`}>
          <div className="split-avatar" style={{ backgroundColor: challenger?.avatarColor }}>
            {challenger?.name.charAt(0)}
          </div>
          <div className="split-name">{challenger?.name}</div>
          <div className="split-score">{challengeState.challengerScore.toLocaleString()}</div>
          <div className="split-bar-container">
            <div
              className="split-bar red-bar"
              style={{ height: `${(challengeState.challengerScore / maxScore) * 100}%` }}
            />
          </div>
          {challengeState.status === 'ended' && challengeState.winnerId === challenger?.id && (
            <div className="split-crown">👑</div>
          )}
          {challengeState.status === 'ended' && challengeState.winnerId !== challenger?.id && (
            <div className="split-defeat">你被击败了</div>
          )}
        </div>
        <div className="split-vs">
          <span className={`vs-text ${challengeState.status === 'active' ? 'flashing' : ''}`}>VS</span>
        </div>
        <div className={`split-side blue ${challengeState.status === 'ended' && challengeState.winnerId === challenged?.id ? 'winner-side' : ''} ${challengeState.status === 'ended' && challengeState.winnerId !== challenged?.id ? 'loser-side' : ''}`}>
          <div className="split-avatar" style={{ backgroundColor: challenged?.avatarColor }}>
            {challenged?.name.charAt(0)}
          </div>
          <div className="split-name">{challenged?.name}</div>
          <div className="split-score">{challengeState.challengedScore.toLocaleString()}</div>
          <div className="split-bar-container">
            <div
              className="split-bar blue-bar"
              style={{ height: `${(challengeState.challengedScore / maxScore) * 100}%` }}
            />
          </div>
          {challengeState.status === 'ended' && challengeState.winnerId === challenged?.id && (
            <div className="split-crown">👑</div>
          )}
          {challengeState.status === 'ended' && challengeState.winnerId !== challenged?.id && (
            <div className="split-defeat">你被击败了</div>
          )}
        </div>
      </div>
      {challengeState.status === 'ended' && challengeState.winnerId === challenger?.id && (
        <ConfettiCanvas />
      )}
      {challengeState.status === 'ended' && challengeState.winnerId === challenged?.id && (
        <ConfettiCanvas />
      )}
    </div>
  );
};

const ConfettiCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#ffd700', '#ff2d95', '#b967ff', '#01cdfe', '#05ffa1', '#ff71ce'];
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      w: 4 + Math.random() * 8,
      h: 3 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
    }));

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.rotation += p.rotSpeed;
        if (p.y < canvas.height + 50) alive = true;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) animId = requestAnimationFrame(draw);
    };
    animId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} className="confetti-canvas" />;
};

const App: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [gameFilter, setGameFilter] = useState<GameType | 'all'>('all');
  const [sortMode, setSortMode] = useState<SortMode>('score');
  const [updatedPlayerIds, setUpdatedPlayerIds] = useState<Set<string>>(new Set());
  const [challengeState, setChallengeState] = useState<ChallengeState | null>(null);
  const [challengedPlayer, setChallengedPlayer] = useState<Player | null>(null);
  const [showChallengeSetup, setShowChallengeSetup] = useState(false);

  useEffect(() => {
    const unsubscribe = scoreManager.subscribe((ids) => {
      setUpdatedPlayerIds(new Set(ids));
      refreshPlayers();
    });
    refreshPlayers();
    return unsubscribe;
  }, []);

  useEffect(() => {
    refreshPlayers();
  }, [gameFilter, sortMode]);

  const refreshPlayers = useCallback(() => {
    const game = gameFilter === 'all' ? undefined : gameFilter;
    const sorted = scoreManager.getTopScores(game, sortMode);
    setPlayers(sorted);
  }, [gameFilter, sortMode]);

  useEffect(() => {
    challengeEngine.setRealTimeCallback((state) => {
      setChallengeState(state);
    });

    challengeEngine.setEndCallback(() => {
      refreshPlayers();
    });

    return () => {
      challengeEngine.setRealTimeCallback(null);
      challengeEngine.setEndCallback(null);
    };
  }, [refreshPlayers]);

  const handleRegister = (name: string) => {
    const player = scoreManager.registerPlayer(name);
    setCurrentPlayer(player);
  };

  const handleUploadScore = (game: GameType, score: number, url: string) => {
    if (!currentPlayer) return;
    scoreManager.addScore(currentPlayer.id, game, score, url || undefined);
    const updated = scoreManager.getPlayerById(currentPlayer.id);
    if (updated) setCurrentPlayer(updated);
  };

  const handleChallenge = (challengedId: string) => {
    if (!currentPlayer) return;
    const challenged = scoreManager.getPlayerById(challengedId);
    if (!challenged) return;
    setChallengedPlayer(challenged);
    setShowChallengeSetup(true);
  };

  const handleStartChallenge = (request: ChallengeRequest) => {
    setShowChallengeSetup(false);
    challengeEngine.startChallenge(request);
  };

  const handleCancelChallenge = () => {
    setShowChallengeSetup(false);
    setChallengedPlayer(null);
  };

  const challengerPlayer: Player | undefined = challengeState?.challengerId
    ? scoreManager.getPlayerById(challengeState.challengerId) ?? undefined
    : currentPlayer ?? undefined;

  const challengedPlayerForOverlay = challengeState?.challengedId
    ? scoreManager.getPlayerById(challengeState.challengedId)
    : undefined;

  const isChallengeActive = challengeState?.status === 'active' || challengeState?.status === 'ended';

  return (
    <div className="app-container">
      <StarCanvas />
      <div className="app-header">
        <h1 className="app-title">ARCADE SCORE TOWER</h1>
        <div className="app-subtitle">街机高分竞速塔</div>
      </div>
      <div className="app-body">
        <div className="left-panel">
          <RegistrationPanel
            onRegister={handleRegister}
            onUploadScore={handleUploadScore}
            currentPlayer={currentPlayer}
          />
          <FilterPanel
            gameFilter={gameFilter}
            sortMode={sortMode}
            onGameFilterChange={setGameFilter}
            onSortModeChange={setSortMode}
          />
        </div>
        <div className="right-panel">
          <div className="tower-wrapper glass-panel">
            <TowerRenderer
              players={players}
              updatedPlayerIds={updatedPlayerIds}
              gameFilter={gameFilter}
              sortMode={sortMode}
              currentPlayerId={currentPlayer?.id ?? null}
              onChallenge={handleChallenge}
              challengeState={challengeState}
            />
          </div>
        </div>
      </div>

      {showChallengeSetup && currentPlayer && challengedPlayer && (
        <ChallengeSetupPanel
          challenger={currentPlayer}
          challenged={challengedPlayer}
          onStart={handleStartChallenge}
          onCancel={handleCancelChallenge}
        />
      )}

      {isChallengeActive && challengeState && (
        <ChallengeOverlay
          challengeState={challengeState}
          challenger={challengerPlayer}
          challenged={challengedPlayerForOverlay}
        />
      )}
    </div>
  );
};

export default App;
