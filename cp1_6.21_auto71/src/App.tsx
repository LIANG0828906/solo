import { useEffect, useRef, useState, useCallback } from 'react';
import { createInitialState, update, flipGravity, type GameState } from './engine';
import { render } from './renderer';

type Screen = 'menu' | 'game' | 'leaderboard' | 'settings' | 'gameover';

interface ScoreEntry {
  name: string;
  score: number;
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [screen, setScreen] = useState<Screen>('menu');
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [highScore, setHighScore] = useState<number>(0);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [playerName, setPlayerName] = useState<string>('玩家');
  const [volume, setVolume] = useState<number>(80);

  const CANVAS_WIDTH = 900;
  const CANVAS_HEIGHT = 500;

  useEffect(() => {
    const saved = localStorage.getItem('gravityFlipHighScore');
    if (saved) setHighScore(parseInt(saved, 10));
    const savedName = localStorage.getItem('gravityFlipPlayerName');
    if (savedName) setPlayerName(savedName);
    const savedVolume = localStorage.getItem('gravityFlipVolume');
    if (savedVolume) setVolume(parseInt(savedVolume, 10));
  }, []);

  const loadLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/leaderboard');
      const data = await res.json();
      setLeaderboard(data);
    } catch {
      setLeaderboard([
        { name: '重力大师', score: 2850 },
        { name: '跑酷王者', score: 2430 },
        { name: '翻转达人', score: 1980 },
      ]);
    }
  }, []);

  const submitScore = useCallback(async (name: string, score: number) => {
    try {
      await fetch('http://localhost:3001/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, score }),
      });
    } catch {
      // ignore
    }
  }, []);

  const startGame = useCallback(() => {
    gameStateRef.current = createInitialState(highScore);
    setScreen('game');
  }, [highScore]);

  const handleGameOver = useCallback((state: GameState) => {
    const score = state.score;
    setFinalScore(score);
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('gravityFlipHighScore', score.toString());
    }
    submitScore(playerName, score);
    setScreen('gameover');
  }, [highScore, playerName, submitScore]);

  useEffect(() => {
    if (screen !== 'game') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    lastTimeRef.current = performance.now();

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      const state = gameStateRef.current;
      if (!state) return;

      update(state, deltaTime, currentTime);
      render(ctx, state, CANVAS_WIDTH, CANVAS_HEIGHT, currentTime);

      if (state.gameOver) {
        setTimeout(() => handleGameOver(state), 500);
        return;
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        const state = gameStateRef.current;
        if (state) flipGravity(state, performance.now());
      }
    };

    const handleClick = () => {
      const state = gameStateRef.current;
      if (state) flipGravity(state, performance.now());
    };

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('click', handleClick);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('click', handleClick);
    };
  }, [screen, handleGameOver]);

  const bgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    overflow: 'hidden',
    position: 'relative',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '48px',
    fontWeight: 'bold',
    background: 'linear-gradient(90deg, #667eea, #764ba2)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '48px',
    textAlign: 'center',
    letterSpacing: '2px',
  };

  const buttonStyle = (hover: boolean): React.CSSProperties => ({
    width: '200px',
    height: '48px',
    borderRadius: '24px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#ffffff',
    background: hover ? 'linear-gradient(90deg, #667eea, #764ba2)' : '#1a1a2e',
    transform: hover ? 'scale(1.05)' : 'scale(1)',
    transition: 'all 0.3s ease',
    margin: '10px 0',
    boxShadow: hover ? '0 8px 25px rgba(102, 126, 234, 0.4)' : 'none',
  });

  const Button = ({ label, onClick }: { label: string; onClick: () => void }) => {
    const [hover, setHover] = useState(false);
    return (
      <button
        style={buttonStyle(hover)}
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {label}
      </button>
    );
  };

  if (screen === 'menu') {
    return (
      <div style={bgStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1 style={titleStyle}>重力翻转跑酷者</h1>
          <Button label="开始游戏" onClick={startGame} />
          <Button label="排行榜" onClick={() => { loadLeaderboard(); setScreen('leaderboard'); }} />
          <Button label="设置" onClick={() => setScreen('settings')} />
          <div style={{ marginTop: '40px', color: '#888', fontSize: '14px' }}>
            按 空格键 或 点击屏幕 切换重力方向
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'leaderboard') {
    return (
      <div style={bgStyle}>
        <div style={{ width: '90%', maxWidth: '600px' }}>
          <h1 style={{ ...titleStyle, fontSize: '36px' }}>排行榜</h1>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            {leaderboard.map((entry, index) => (
              <div
                key={index}
                style={{
                  width: '80%',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 20px',
                  background: index % 2 === 0 ? '#1a1a2e' : '#16213e',
                  borderRadius: '8px',
                }}
              >
                <span style={{ color: '#ffd700', width: '40px', fontSize: '18px', fontWeight: 'bold' }}>
                  {index + 1}
                </span>
                <span style={{ color: '#ffffff', flex: 1, fontSize: '16px' }}>{entry.name}</span>
                <span style={{ color: '#ffd700', fontSize: '18px', fontWeight: 'bold' }}>{entry.score}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
            <Button label="返回" onClick={() => setScreen('menu')} />
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'settings') {
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const name = e.target.value;
      setPlayerName(name);
      localStorage.setItem('gravityFlipPlayerName', name);
    };
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseInt(e.target.value, 10);
      setVolume(v);
      localStorage.setItem('gravityFlipVolume', v.toString());
    };

    return (
      <div style={bgStyle}>
        <div style={{ width: '90%', maxWidth: '500px' }}>
          <h1 style={{ ...titleStyle, fontSize: '36px' }}>设置</h1>
          <div style={{ color: '#ffffff', marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '16px' }}>玩家名称</label>
            <input
              type="text"
              value={playerName}
              onChange={handleNameChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#1a1a2e',
                color: '#ffffff',
                fontSize: '16px',
                outline: 'none',
              }}
              maxLength={12}
            />
          </div>
          <div style={{ color: '#ffffff', marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '16px' }}>音量: {volume}%</label>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={handleVolumeChange}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button label="返回" onClick={() => setScreen('menu')} />
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'gameover') {
    return (
      <div style={bgStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1 style={{ ...titleStyle, fontSize: '36px', color: '#ff0044', WebkitTextFillColor: '#ff0044' }}>游戏结束</h1>
          <div style={{ color: '#ffffff', fontSize: '28px', marginBottom: '10px' }}>
            本局得分: <span style={{ color: '#ffd700', fontWeight: 'bold' }}>{finalScore}</span>
          </div>
          <div style={{ color: '#ffd700', fontSize: '20px', marginBottom: '40px' }}>
            最高分: {highScore}
          </div>
          <Button label="再玩一次" onClick={startGame} />
          <Button label="返回主菜单" onClick={() => setScreen('menu')} />
        </div>
      </div>
    );
  }

  return (
    <div style={bgStyle}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          borderRadius: '16px',
          boxShadow: '0 0 60px rgba(102, 126, 234, 0.3)',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}

export default App;
