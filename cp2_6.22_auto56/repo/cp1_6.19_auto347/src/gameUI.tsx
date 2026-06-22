import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGameStore } from './store';
import { TURRET_CONFIG, Asteroid, Ship, Turret, Projectile, Pirate, MineralDrop } from './types';

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [displayMinerals, setDisplayMinerals] = useState(0);
  const [displayWave, setDisplayWave] = useState(0);
  const [displayHealth, setDisplayHealth] = useState(100);
  const [cargoWarning, setCargoWarning] = useState(false);

  const {
    status,
    score,
    wave,
    ship,
    asteroids,
    turrets,
    projectiles,
    pirates,
    mineralDrops,
    isMining,
    miningTargetId,
    canvasWidth,
    canvasHeight,
    setCanvasSize,
    handleKeyDown,
    handleKeyUp,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    update,
    startNewGame,
    initSocket,
    socket,
    leaderboard,
    gameOverReason,
    submitScore,
  } = useGameStore();

  const [playerName, setPlayerName] = useState('');
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  useEffect(() => {
    const handleResize = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        const width = Math.max(800, container.clientWidth * 0.8);
        const height = Math.max(600, window.innerHeight * 0.7);
        setCanvasSize(width, height);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setCanvasSize]);

  useEffect(() => {
    const handleKeyDownEvent = (e: KeyboardEvent) => {
      handleKeyDown(e.key);
    };
    const handleKeyUpEvent = (e: KeyboardEvent) => {
      handleKeyUp(e.key);
    };

    window.addEventListener('keydown', handleKeyDownEvent);
    window.addEventListener('keyup', handleKeyUpEvent);

    return () => {
      window.removeEventListener('keydown', handleKeyDownEvent);
      window.removeEventListener('keyup', handleKeyUpEvent);
    };
  }, [handleKeyDown, handleKeyUp]);

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      handleMouseMove(x, y);
    },
    [handleMouseMove]
  );

  const handleCanvasMouseDown = useCallback(() => {
    handleMouseDown();
  }, [handleMouseDown]);

  const handleCanvasMouseUp = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayScore((prev) => {
        if (prev < score) {
          return Math.min(prev + Math.ceil((score - prev) / 10), score);
        }
        return prev;
      });
      setDisplayMinerals((prev) => {
        const target = ship.minerals;
        if (prev < target) {
          return Math.min(prev + Math.ceil((target - prev) / 10), target);
        } else if (prev > target) {
          return Math.max(prev - Math.ceil((prev - target) / 10), target);
        }
        return prev;
      });
      setDisplayWave((prev) => {
        if (prev < wave) return Math.min(prev + 1, wave);
        return prev;
      });
      setDisplayHealth((prev) => {
        const target = ship.health;
        if (prev < target) {
          return Math.min(prev + Math.ceil((target - prev) / 5), target);
        } else if (prev > target) {
          return Math.max(prev - Math.ceil((prev - target) / 5), target);
        }
        return prev;
      });
    }, 150);

    return () => clearInterval(timer);
  }, [score, ship.minerals, ship.health, wave]);

  useEffect(() => {
    if (ship.minerals >= ship.maxMinerals * 0.95) {
      setCargoWarning(true);
    } else {
      setCargoWarning(false);
    }
  }, [ship.minerals, ship.maxMinerals]);

  useEffect(() => {
    if (status !== 'playing') return;

    const gameLoop = (currentTime: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
      }
      const deltaTime = Math.min(currentTime - lastTimeRef.current, 50);
      lastTimeRef.current = currentTime;

      update(deltaTime, currentTime);
      render();

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [status, update]);

  useEffect(() => {
    if (status === 'playing') {
      lastTimeRef.current = 0;
    }
  }, [status]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawStars(ctx, canvas.width, canvas.height);
    drawAsteroids(ctx, asteroids);
    drawMineralDrops(ctx, mineralDrops);
    drawTurrets(ctx, turrets);
    drawProjectiles(ctx, projectiles);
    drawPirates(ctx, pirates);
    drawShip(ctx, ship);

    if (isMining && miningTargetId) {
      const target = asteroids.find((a) => a.id === miningTargetId);
      if (target) {
        drawMiningBeam(ctx, ship, target);
      }
    }
  }, [asteroids, turrets, projectiles, pirates, mineralDrops, ship, isMining, miningTargetId]);

  const drawStars = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 100; i++) {
      const x = (i * 137.5) % w;
      const y = (i * 73.3) % h;
      const size = (i % 3) * 0.5 + 0.5;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawAsteroids = (ctx: CanvasRenderingContext2D, asteroids: Asteroid[]) => {
    for (const asteroid of asteroids) {
      if (asteroid.isBreaking) {
        const scale = asteroid.breakTimer / 200;
        for (const frag of asteroid.fragments) {
          if (frag.life > 0) {
            const fragScale = (frag.life / frag.maxLife) * scale;
            ctx.save();
            ctx.translate(frag.x, frag.y);
            ctx.scale(fragScale, fragScale);
            ctx.fillStyle = frag.color;
            ctx.beginPath();
            ctx.arc(0, 0, frag.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      } else {
        ctx.save();
        ctx.translate(asteroid.x, asteroid.y);

        ctx.fillStyle = asteroid.color;
        ctx.beginPath();

        const points = asteroid.noisePattern.length;
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const r = asteroid.radius * asteroid.noisePattern[i % points];
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        for (let i = 0; i < 5; i++) {
          const nx = Math.cos(i * 1.3) * asteroid.radius * 0.4;
          const ny = Math.sin(i * 1.7) * asteroid.radius * 0.4;
          ctx.beginPath();
          ctx.arc(nx, ny, asteroid.radius * 0.15, 0, Math.PI * 2);
          ctx.fill();
        }

        if (asteroid.flashTimer > 0) {
          ctx.globalAlpha = asteroid.flashTimer / 100;
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          for (let i = 0; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const r = asteroid.radius * asteroid.noisePattern[i % points];
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();

        if (asteroid.minerals < asteroid.maxMinerals && asteroid.minerals > 0) {
          const barWidth = asteroid.radius * 1.5;
          const barHeight = 4;
          const barX = asteroid.x - barWidth / 2;
          const barY = asteroid.y - asteroid.radius - 10;

          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(barX, barY, barWidth, barHeight);
          ctx.fillStyle = '#45A29E';
          ctx.fillRect(barX, barY, barWidth * (asteroid.minerals / asteroid.maxMinerals), barHeight);
        }
      }
    }
  };

  const drawShip = (ctx: CanvasRenderingContext2D, ship: Ship) => {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);

    ctx.fillStyle = '#45A29E';
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-15, -12);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-15, 12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#66FCF1';
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-5, -6);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  const drawMiningBeam = (
    ctx: CanvasRenderingContext2D,
    ship: Ship,
    target: Asteroid
  ) => {
    const beamStartX = ship.x + Math.cos(ship.angle) * 22;
    const beamStartY = ship.y + Math.sin(ship.angle) * 22;

    ctx.save();
    ctx.strokeStyle = 'rgba(100, 181, 246, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(beamStartX, beamStartY);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(100, 181, 246, 0.3)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(beamStartX, beamStartY);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    ctx.restore();
  };

  const drawTurrets = (ctx: CanvasRenderingContext2D, turrets: Turret[]) => {
    for (const turret of turrets) {
      const config = TURRET_CONFIG[turret.type];
      const size = 20;

      ctx.save();
      ctx.translate(turret.x, turret.y);

      ctx.fillStyle = '#1F2833';
      ctx.fillRect(-size / 2, -size / 2, size, size);

      ctx.strokeStyle = config.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(-size / 2, -size / 2, size, size);

      ctx.rotate(turret.angle);
      ctx.fillStyle = config.color;
      ctx.fillRect(0, -3, 15, 6);

      ctx.restore();

      const healthPercent = turret.health / turret.maxHealth;
      const barWidth = 24;
      const barHeight = 3;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(turret.x - barWidth / 2, turret.y - 15, barWidth, barHeight);
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(turret.x - barWidth / 2, turret.y - 15, barWidth * healthPercent, barHeight);

      if (turret.flashTimer > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${turret.flashTimer / 100})`;
        ctx.fillRect(turret.x - size / 2, turret.y - size / 2, size, size);
      }
    }
  };

  const drawProjectiles = (ctx: CanvasRenderingContext2D, projectiles: Projectile[]) => {
    for (const proj of projectiles) {
      const config = TURRET_CONFIG[proj.type];

      ctx.save();
      ctx.translate(proj.x, proj.y);

      if (proj.type === 'laser') {
        ctx.fillStyle = config.color;
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = config.color;
        ctx.fill();
      } else if (proj.type === 'missile') {
        const angle = Math.atan2(proj.vy, proj.vx);
        ctx.rotate(angle);
        ctx.fillStyle = config.color;
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-5, -4);
        ctx.lineTo(-5, 4);
        ctx.closePath();
        ctx.fill();
      } else if (proj.type === 'em') {
        ctx.fillStyle = config.color;
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 15;
        ctx.shadowColor = config.color;
        ctx.fill();
      } else if (proj.type === 'gatling') {
        ctx.fillStyle = config.color;
        ctx.fillRect(-4, -1, 8, 2);
      }

      ctx.restore();
    }
  };

  const drawPirates = (ctx: CanvasRenderingContext2D, pirates: Pirate[]) => {
    for (const pirate of pirates) {
      if (pirate.isDying) {
        const progress = 1 - pirate.deathTimer / 300;
        const radius = 20 + progress * 30;
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.strokeStyle = '#D32F2F';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(pirate.x, pirate.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(211, 47, 47, 0.3)';
        ctx.fill();
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(pirate.x, pirate.y);
        ctx.rotate(pirate.angle);

        ctx.fillStyle = '#D32F2F';
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#B71C1C';
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-5, -6);
        ctx.lineTo(-5, 6);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        const healthPercent = pirate.health / pirate.maxHealth;
        const barWidth = 24;
        const barHeight = 3;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(pirate.x - barWidth / 2, pirate.y - 18, barWidth, barHeight);
        ctx.fillStyle = '#D32F2F';
        ctx.fillRect(pirate.x - barWidth / 2, pirate.y - 18, barWidth * healthPercent, barHeight);

        if (pirate.slowTimer > 0) {
          ctx.strokeStyle = '#7C4DFF';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(pirate.x, pirate.y, 18, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }
  };

  const drawMineralDrops = (ctx: CanvasRenderingContext2D, drops: MineralDrop[]) => {
    for (const drop of drops) {
      const pulse = Math.sin(Date.now() / 200) * 2 + 8;

      ctx.save();
      ctx.fillStyle = '#45A29E';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#45A29E';
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#66FCF1';
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, pulse * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  const handleStartGame = () => {
    setScoreSubmitted(false);
    startNewGame();
  };

  const handleSubmitScore = () => {
    if (playerName.trim()) {
      submitScore(playerName.trim());
      setScoreSubmitted(true);
    }
  };

  return (
    <div className="game-container">
      <div className="hud">
        <div className="hud-item">
          <span className="hud-label">矿物</span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(displayMinerals / ship.maxMinerals) * 100}%` }}
            />
          </div>
          <span className="hud-value">{Math.floor(displayMinerals)}/{ship.maxMinerals}</span>
        </div>

        <div className="hud-item">
          <span className="hud-label">分数</span>
          <span className="hud-value score-value">{displayScore}</span>
        </div>

        <div className="hud-item">
          <span className="hud-label">波次</span>
          <span className="hud-value wave-value">{displayWave}</span>
        </div>

        <div className="hud-item">
          <span className="hud-label">生命</span>
          <div className="progress-bar health-bar">
            <div
              className="progress-fill health-fill"
              style={{ width: `${(displayHealth / ship.maxHealth) * 100}%` }}
            />
          </div>
          <span className="hud-value">{Math.floor(displayHealth)}</span>
        </div>
      </div>

      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onMouseMove={handleCanvasMouseMove}
          onMouseDown={handleCanvasMouseDown}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        />

        {cargoWarning && status === 'playing' && (
          <div className="cargo-warning">
            ⚠️ 货仓即将满载！
          </div>
        )}

        {status === 'menu' && (
          <div className="modal-overlay">
            <div className="modal start-modal">
              <h1 className="modal-title">太空矿工防御</h1>
              <p className="modal-subtitle">采集矿物 · 部署炮塔 · 抵御海盗</p>
              <div className="instructions">
                <p><strong>操作说明：</strong></p>
                <p>WASD - 移动飞船</p>
                <p>鼠标左键 - 开采矿物</p>
                <p>数字键 1-4 - 部署炮塔</p>
                <p className="turret-keys">
                  <span style={{ color: '#FF5252' }}>1-激光</span>{' '}
                  <span style={{ color: '#FFC107' }}>2-导弹</span>{' '}
                  <span style={{ color: '#7C4DFF' }}>3-电磁</span>{' '}
                  <span style={{ color: '#4CAF50' }}>4-加特林</span>
                </p>
              </div>
              <button className="start-button" onClick={handleStartGame}>
                开始游戏
              </button>
              {leaderboard.length > 0 && (
                <div className="leaderboard-preview">
                  <h3>排行榜</h3>
                  {leaderboard.slice(0, 5).map((entry, i) => (
                    <div key={i} className="leaderboard-entry">
                      <span className="rank">{i + 1}.</span>
                      <span className="name">{entry.name}</span>
                      <span className="score">{entry.score}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {status === 'gameover' && (
          <div className="modal-overlay">
            <div className="modal gameover-modal">
              <div className="gameover-content">
                <div className="leaderboard-panel">
                  <h2>🏆 排行榜</h2>
                  <div className="leaderboard-list">
                    {leaderboard.map((entry, i) => (
                      <div key={i} className={`leaderboard-item ${i < 3 ? 'top' : ''}`}>
                        <span className="rank">{i + 1}</span>
                        <span className="name">{entry.name}</span>
                        <span className="score">{entry.score}</span>
                      </div>
                    ))}
                    {leaderboard.length === 0 && (
                      <p className="empty-leaderboard">暂无记录</p>
                    )}
                  </div>
                </div>
                <div className="gameover-info">
                  <h1 className="modal-title">游戏结束</h1>
                  <p className="gameover-reason">{gameOverReason}</p>
                  <div className="final-stats">
                    <div className="stat-item">
                      <span className="stat-label">最终分数</span>
                      <span className="stat-value">{score}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">到达波次</span>
                      <span className="stat-value">{wave}</span>
                    </div>
                  </div>

                  {!scoreSubmitted ? (
                    <div className="submit-score">
                      <input
                        type="text"
                        placeholder="输入你的名字"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        maxLength={20}
                      />
                      <button className="submit-button" onClick={handleSubmitScore}>
                        提交分数
                      </button>
                    </div>
                  ) : (
                    <p className="submitted-text">✓ 分数已提交！</p>
                  )}

                  <button className="start-button" onClick={handleStartGame}>
                    再来一局
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Roboto', sans-serif;
          background: linear-gradient(135deg, #0B0C10 0%, #1F2833 100%);
          min-height: 100vh;
          color: #C5C6C7;
        }

        .game-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          min-height: 100vh;
        }

        .hud {
          display: flex;
          gap: 30px;
          padding: 15px 25px;
          background: rgba(31, 40, 51, 0.9);
          border-radius: 12px;
          margin-bottom: 15px;
          border: 2px solid #45A29E;
        }

        .hud-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          min-width: 100px;
        }

        .hud-label {
          font-size: 12px;
          color: #66FCF1;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .hud-value {
          font-size: 18px;
          font-weight: 700;
          color: #FFFFFF;
          transition: all 0.15s ease;
        }

        .score-value {
          font-size: 24px;
          color: #66FCF1;
        }

        .wave-value {
          color: #FFC107;
        }

        .progress-bar {
          width: 100px;
          height: 8px;
          background: #0B0C10;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #45A29E;
          transition: width 0.15s ease;
          border-radius: 4px;
        }

        .health-fill {
          background: linear-gradient(90deg, #F44336 0%, #FF9800 50%, #4CAF50 100%);
          background-size: 100px 100%;
        }

        .canvas-wrapper {
          position: relative;
          border: 6px solid #45A29E;
          border-radius: 8px;
          box-shadow: 0 0 30px rgba(69, 162, 158, 0.3);
        }

        canvas {
          display: block;
          background: #0B0C10;
          cursor: crosshair;
        }

        .cargo-warning {
          position: absolute;
          top: 50px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(244, 67, 54, 0.9);
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 16px;
          animation: blink 0.5s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(11, 12, 16, 0.7);
          backdrop-filter: blur(4px);
        }

        .modal {
          background: rgba(31, 40, 51, 0.95);
          border: 2px solid #45A29E;
          border-radius: 16px;
          padding: 40px;
          text-align: center;
          min-width: 400px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }

        .start-modal {
          min-width: 450px;
        }

        .modal-title {
          font-size: 36px;
          color: #FFFFFF;
          margin-bottom: 10px;
          font-weight: 700;
        }

        .modal-subtitle {
          color: #66FCF1;
          font-size: 16px;
          margin-bottom: 25px;
        }

        .instructions {
          text-align: left;
          background: rgba(11, 12, 16, 0.5);
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 25px;
        }

        .instructions p {
          margin: 8px 0;
          color: #C5C6C7;
          font-size: 14px;
        }

        .instructions strong {
          color: #66FCF1;
        }

        .turret-keys {
          margin-top: 10px !important;
          font-size: 13px !important;
        }

        .start-button {
          background: #45A29E;
          color: #0B0C10;
          border: none;
          padding: 15px 50px;
          font-size: 18px;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Roboto', sans-serif;
        }

        .start-button:hover {
          background: #66FCF1;
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(102, 252, 241, 0.3);
        }

        .leaderboard-preview {
          margin-top: 25px;
          text-align: left;
        }

        .leaderboard-preview h3 {
          color: #66FCF1;
          margin-bottom: 10px;
          font-size: 16px;
        }

        .leaderboard-entry {
          display: flex;
          gap: 10px;
          padding: 5px 10px;
          font-size: 14px;
        }

        .leaderboard-entry .rank {
          width: 25px;
          color: #45A29E;
          font-weight: 700;
        }

        .leaderboard-entry .name {
          flex: 1;
          color: #C5C6C7;
        }

        .leaderboard-entry .score {
          color: #FFC107;
          font-weight: 700;
        }

        .gameover-modal {
          min-width: 600px;
          padding: 30px;
        }

        .gameover-content {
          display: flex;
          gap: 30px;
        }

        .leaderboard-panel {
          flex: 1;
          text-align: left;
          border-right: 1px solid #45A29E;
          padding-right: 25px;
        }

        .leaderboard-panel h2 {
          color: #FFC107;
          font-size: 20px;
          margin-bottom: 15px;
        }

        .leaderboard-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .leaderboard-item {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          margin-bottom: 4px;
          background: rgba(11, 12, 16, 0.5);
          border-radius: 6px;
          font-size: 14px;
        }

        .leaderboard-item.top {
          background: rgba(255, 193, 7, 0.1);
          border-left: 3px solid #FFC107;
        }

        .leaderboard-item .rank {
          width: 25px;
          font-weight: 700;
          color: #45A29E;
        }

        .leaderboard-item.top .rank {
          color: #FFC107;
        }

        .leaderboard-item .name {
          flex: 1;
          color: #C5C6C7;
        }

        .leaderboard-item .score {
          color: #66FCF1;
          font-weight: 700;
        }

        .empty-leaderboard {
          color: #666;
          font-style: italic;
          text-align: center;
          padding: 20px;
        }

        .gameover-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .gameover-reason {
          color: #F44336;
          margin-bottom: 20px;
          font-size: 16px;
        }

        .final-stats {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 25px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(11, 12, 16, 0.5);
          padding: 12px 20px;
          border-radius: 8px;
        }

        .stat-label {
          color: #C5C6C7;
          font-size: 14px;
        }

        .stat-value {
          color: #66FCF1;
          font-size: 24px;
          font-weight: 700;
        }

        .submit-score {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .submit-score input {
          flex: 1;
          padding: 10px 15px;
          background: #0B0C10;
          border: 2px solid #45A29E;
          border-radius: 6px;
          color: #FFFFFF;
          font-family: 'Roboto', sans-serif;
          font-size: 14px;
        }

        .submit-score input:focus {
          outline: none;
          border-color: #66FCF1;
        }

        .submit-button {
          padding: 10px 20px;
          background: #45A29E;
          color: #0B0C10;
          border: none;
          border-radius: 6px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Roboto', sans-serif;
        }

        .submit-button:hover {
          background: #66FCF1;
        }

        .submitted-text {
          color: #4CAF50;
          font-weight: 700;
          margin-bottom: 15px;
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: #0B0C10;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb {
          background: #45A29E;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #66FCF1;
        }
      `}</style>
    </div>
  );
};

export default GameCanvas;
