import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import GameBoard from "./game/GameBoard";
import ScorePanel from "./game/ScorePanel";
import { ShapeItem, PlayerInfo, RoomState, TurnData, ScoreEntry } from "./types";
import "./App.css";

type Screen = "lobby" | "waiting" | "game" | "gameover";

function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function CelebrationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      size: number;
      color: string;
    }

    const particles: Particle[] = [];
    const goldColors = ["#FFD700", "#FFA500", "#FF8C00", "#FFE066", "#FFCC33"];
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    for (let i = 0; i < 200; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 120,
        size: 2 + Math.random() * 4,
        color: goldColors[Math.floor(Math.random() * goldColors.length)],
      });
    }

    let animId: number;
    let frame = 0;

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      for (const p of particles) {
        p.x += p.vx;
        p.vy += 3 / 60;
        p.y += p.vy;
        p.life--;

        if (p.life > 0) {
          ctx.globalAlpha = Math.min(1, p.life / 40);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;

      if (frame < 120) {
        animId = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} className="celebration-canvas" />;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("lobby");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [turnData, setTurnData] = useState<TurnData | null>(null);
  const [phase, setPhase] = useState<string>("lobby");
  const [sequence, setSequence] = useState<ShapeItem[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState("");
  const [gameOverData, setGameOverData] = useState<{
    winnerNickname: string;
    players: PlayerInfo[];
  } | null>(null);
  const [topScores, setTopScores] = useState<ScoreEntry[]>([]);
  const [myId, setMyId] = useState("");

  useEffect(() => {
    const s = io("/", { transports: ["websocket"] });
    setSocket(s);

    s.on("connect", () => {
      setMyId(s.id || "");
    });

    s.on("room-updated", (state: RoomState) => {
      setRoomState(state);
      if (state.gameStarted) {
        setScreen("game");
      }
    });

    s.on("error-msg", (msg: string) => {
      setError(msg);
      setTimeout(() => setError(""), 3000);
    });

    s.on("turn-start", (data: TurnData) => {
      setTurnData(data);
      setSequence(data.sequence);
      setCurrentPlayerId(data.currentPlayerId);
      setPhase("displaying");
      setScreen("game");
    });

    s.on("phase-change", (newPhase: string) => {
      setPhase(newPhase);
    });

    s.on("click-result", () => {
    });

    s.on("game-over", async (data: { winnerId: string; winnerNickname: string; players: PlayerInfo[] }) => {
      setPhase("game-over");
      setGameOverData({ winnerNickname: data.winnerNickname, players: data.players });
      setScreen("gameover");

      const myPlayer = data.players.find((p) => p.id === myId || p.id === s.id);
      if (myPlayer && myPlayer.score > 0) {
        try {
          await fetch("/api/scores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nickname: myPlayer.nickname, score: myPlayer.score }),
          });
        } catch { }
      }

      try {
        const res = await fetch("/api/scores");
        const scores: ScoreEntry[] = await res.json();
        setTopScores(scores);
      } catch { }
    });

    return () => {
      s.disconnect();
    };
  }, []);

  const handleCreateRoom = useCallback(() => {
    if (!socket) return;
    if (nickname.length < 2 || nickname.length > 8) {
      setError("昵称长度需2-8个字符");
      return;
    }
    const code = generateRoomCode();
    setRoomCode(code);
    socket.emit("create-room", { nickname, roomCode: code });
    setScreen("waiting");
  }, [socket, nickname]);

  const handleJoinRoom = useCallback(() => {
    if (!socket) return;
    if (nickname.length < 2 || nickname.length > 8) {
      setError("昵称长度需2-8个字符");
      return;
    }
    if (!/^[A-Z]{6}$/.test(roomCode)) {
      setError("房间码必须为6位大写字母");
      return;
    }
    socket.emit("join-room", { nickname, roomCode });
    setScreen("waiting");
  }, [socket, nickname, roomCode]);

  const handleStartGame = useCallback(() => {
    if (!socket) return;
    socket.emit("start-game");
  }, [socket]);

  const handleCellClick = useCallback(
    (gridIndex: number) => {
      if (!socket || phase !== "input") return;
      if (currentPlayerId !== myId) return;
      socket.emit("player-click", { gridIndex });
    },
    [socket, phase, currentPlayerId, myId]
  );

  if (screen === "lobby") {
    return (
      <div className="app-container">
        <div className="lobby-screen">
          <h1>幻象速记</h1>
          <p className="subtitle">多人实时记忆对战</p>
          <div className="lobby-form">
            <label>
              昵称
              <input
                type="text"
                maxLength={8}
                placeholder="输入2-8字符昵称"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </label>
            <label>
              房间码（加入时填写）
              <input
                type="text"
                maxLength={6}
                placeholder="6位大写字母"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              />
            </label>
            <div className="error-msg">{error}</div>
            <button className="btn-primary" onClick={handleCreateRoom} disabled={!nickname}>
              创建房间
            </button>
            <button className="btn-secondary" onClick={handleJoinRoom} disabled={!nickname || !roomCode}>
              加入房间
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "waiting" && roomState) {
    const isOwner = roomState.ownerId === myId;
    return (
      <div className="app-container">
        <div className="waiting-screen">
          <h1>等待玩家加入</h1>
          <div className="waiting-room-code">{roomState.roomCode}</div>
          <div className="waiting-players">
            {roomState.players.map((p) => (
              <div
                key={p.id}
                className={`player-avatar ${p.id === roomState.ownerId ? "is-owner" : ""}`}
              >
                <div className="avatar-circle">{p.nickname[0].toUpperCase()}</div>
                <div className="avatar-name">{p.nickname}</div>
              </div>
            ))}
          </div>
          <p className="waiting-info">
            {roomState.players.length < 2
              ? "等待更多玩家加入...（至少2人）"
              : `${roomState.players.length}/4 人已加入`}
          </p>
          {isOwner && roomState.players.length >= 2 && (
            <button className="btn-primary" onClick={handleStartGame}>
              开始游戏
            </button>
          )}
          {!isOwner && <p className="waiting-info">等待房主开始游戏...</p>}
        </div>
      </div>
    );
  }

  if (screen === "gameover" && gameOverData) {
    const sorted = [...gameOverData.players].sort((a, b) => b.score - a.score);
    return (
      <div className="app-container">
        <CelebrationCanvas />
        <div className="gameover-overlay">
          <h1>游戏结束</h1>
          <div className="winner-name">{gameOverData.winnerNickname} 获胜！</div>
          <div className="final-rankings">
            {sorted.map((p, i) => {
              const best = topScores.find((s) => s.nickname === p.nickname);
              return (
                <div key={p.id} className="ranking-item">
                  <span className="rank">{i + 1}</span>
                  <span className="rank-name">{p.nickname}</span>
                  <span className="rank-score">{p.score}分</span>
                  {best && <span className="rank-best">历史最高 {best.score}</span>}
                </div>
              );
            })}
          </div>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            返回大厅
          </button>
        </div>
      </div>
    );
  }

  if (screen === "game" && turnData) {
    return (
      <div className="app-container">
        <div className="game-screen">
          <div className="game-header">
            <div className="round-info">
              第 <span>{turnData.round}</span> 轮 · 序列长度{" "}
              <span>{turnData.sequenceLength}</span>
            </div>
            <div className="current-player-label">
              当前玩家：{" "}
              <span className="player-name">{turnData.currentPlayerNickname}</span>
            </div>
          </div>
          <div className="game-main">
            <div className="game-board-wrapper">
              <div className={`phase-label ${phase}`}>{phase === "displaying" ? "👁 记忆图案..." : phase === "input" ? "👆 按顺序点击" : ""}</div>
              <GameBoard
                sequence={sequence}
                phase={phase}
                isCurrentPlayer={currentPlayerId === myId}
                onCellClick={handleCellClick}
                socket={socket}
              />
              {phase === "displaying" && <CountdownBar duration={1500} />}
            </div>
            <ScorePanel
              players={turnData.players}
              currentPlayerIndex={turnData.currentPlayerIndex}
              sequenceLength={turnData.sequenceLength}
              round={turnData.round}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="waiting-screen">
        <h1>连接中...</h1>
      </div>
    </div>
  );
}

function CountdownBar({ duration }: { duration: number }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    let raf: number;

    function tick() {
      const elapsed = Date.now() - start;
      const p = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(p);
      if (p > 0) {
        raf = requestAnimationFrame(tick);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  return (
    <div className="countdown-bar-container">
      <div className="countdown-bar" style={{ width: `${progress}%` }} />
    </div>
  );
}
