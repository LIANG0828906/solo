import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Rarity } from '../../server/database';
import { rarityLabel, rarityLevel } from '../../server/database';
import ApiClient, { type ApiItem } from '../api/ApiClient';
import RatingPanel from './RatingPanel';
import { useNavigate } from 'react-router-dom';

const CANVAS_W = 600;
const CANVAS_H = 500;
const CARD_W = 400;
const CARD_H = 300;
const CARD_X = (CANVAS_W - CARD_W) / 2;
const CARD_Y = 50;
const COUNTDOWN_SECONDS = 8;
const TOTAL_ROUNDS = 10;

const rarityColor: Record<Rarity, string> = {
  common: '#94a3b8',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

const rarityGrad: Record<Rarity, [string, string]> = {
  common: ['#334155', '#475569'],
  rare: ['#1e40af', '#3b82f6'],
  epic: ['#6b21a8', '#a855f7'],
  legendary: ['#b45309', '#f59e0b'],
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

interface FeedbackFx {
  kind: 'perfect' | 'miss';
  startAt: number;
}

type GameState = 'loading' | 'playing' | 'showing-result' | 'finished';

interface GameScoreInfo {
  score: number;
  accuracy: number;
  duration: number;
  submitted: boolean;
  rank?: number;
}

function genPlayerName(): string {
  const prefix = [
    '鉴定大师', '寻宝猎人', '传说收藏家', '稀有物品王', '史诗鉴定师',
    '古董鉴赏家', '宝石猎人', '神话追寻者', '武器大师', '新手学徒',
  ];
  return `${prefix[Math.floor(Math.random() * prefix.length)]}${Math.floor(100 + Math.random() * 900)}`;
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);

  const [item, setItem] = useState<ApiItem | null>(null);
  const [gameState, setGameState] = useState<GameState>('loading');
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [scoreBump, setScoreBump] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [gameOverInfo, setGameOverInfo] = useState<GameScoreInfo | null>(null);

  const roundStartRef = useRef<number>(0);
  const feedbackRef = useRef<FeedbackFx | null>(null);
  const flipAnimRef = useRef<{ startAt: number; playerRarity: Rarity } | null>(null);
  const lastScoreDeltaRef = useRef(0);
  const playerNameRef = useRef<string>(genPlayerName());
  const navigate = useNavigate();

  const loadItem = useCallback(async () => {
    setGameState('loading');
    try {
      const it = await ApiClient.getItem();
      setItem(it);
      roundStartRef.current = performance.now();
      feedbackRef.current = null;
      flipAnimRef.current = null;
      setGameState('playing');
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadItem();
    setStartTime(performance.now());
  }, [loadItem]);

  const calcRoundScore = useCallback(
    (playerRarity: Rarity, trueRarity: Rarity, remainingSec: number): number => {
      const diff = Math.abs(rarityLevel(playerRarity) - rarityLevel(trueRarity));
      const base = diff === 0 ? 100 : diff === 1 ? 30 : diff === 2 ? 10 : 0;
      const bonus = Math.max(0, Math.floor(remainingSec)) * 5;
      return base + bonus;
    },
    [],
  );

  const handleRate = useCallback(
    (playerRarity: Rarity) => {
      if (gameState !== 'playing' || !item) return;
      const now = performance.now();
      const elapsed = (now - roundStartRef.current) / 1000;
      const remaining = Math.max(0, COUNTDOWN_SECONDS - elapsed);

      const diff = Math.abs(rarityLevel(playerRarity) - rarityLevel(item.rarity));
      const isCorrect = diff === 0;
      const delta = calcRoundScore(playerRarity, item.rarity, remaining);
      lastScoreDeltaRef.current = delta;

      setScore((s) => s + delta);
      if (isCorrect) setCorrectCount((c) => c + 1);
      setScoreBump(true);
      setTimeout(() => setScoreBump(false), 220);

      feedbackRef.current = {
        kind: isCorrect ? 'perfect' : 'miss',
        startAt: now,
      };
      flipAnimRef.current = { startAt: now, playerRarity };

      setGameState('showing-result');

      const isLastRound = round >= TOTAL_ROUNDS;
      setTimeout(() => {
        if (isLastRound) {
          const totalDuration = (performance.now() - startTime) / 1000;
          setGameState('finished');
          const totalCorrect = isCorrect ? correctCount + 1 : correctCount;
          const finalScore = score + delta;
          const accuracy = (totalCorrect / TOTAL_ROUNDS) * 100;
          const info: GameScoreInfo = {
            score: finalScore,
            accuracy: Math.round(accuracy * 10) / 10,
            duration: totalDuration,
            submitted: false,
          };
          ApiClient.submitScore({
            playerName: playerNameRef.current,
            score: info.score,
            accuracy: info.accuracy,
            duration: Math.round(info.duration),
          })
            .then((r) => {
              setGameOverInfo({ ...info, submitted: true, rank: r.rank });
            })
            .catch(() => setGameOverInfo(info));
        } else {
          setRound((r) => r + 1);
          loadItem();
        }
      }, Math.max(800, 400));
    },
    [gameState, item, round, calcRoundScore, loadItem, correctCount, score, startTime],
  );

  useEffect(() => {
    if (gameState !== 'playing' || !item) return;
    const id = setInterval(() => {
      const elapsed = (performance.now() - roundStartRef.current) / 1000;
      if (elapsed >= COUNTDOWN_SECONDS) {
        clearInterval(id);
        handleRate('common');
      }
    }, 100);
    return () => clearInterval(id);
  }, [gameState, item, handleRate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      const drawBgGrid = () => {
        ctx.save();
        ctx.strokeStyle = 'rgba(59,130,246,0.06)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= CANVAS_W; x += 30) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, CANVAS_H);
          ctx.stroke();
        }
        for (let y = 0; y <= CANVAS_H; y += 30) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(CANVAS_W, y);
          ctx.stroke();
        }
        ctx.restore();
      };
      drawBgGrid();

      if (!item) {
        ctx.fillStyle = '#64748b';
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('正在获取物品...', CANVAS_W / 2, CANVAS_H / 2);
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      let flipProgress = 0;
      let showBack = false;
      if (flipAnimRef.current) {
        const t = (now - flipAnimRef.current.startAt) / 400;
        if (t >= 1) {
          flipProgress = 1;
          showBack = true;
        } else {
          flipProgress = easeInOutQuad(t);
          showBack = flipProgress > 0.5;
        }
      }

      const drawCard = () => {
        const cx = CARD_X + CARD_W / 2;
        const cy = CARD_Y + CARD_H / 2;
        const scaleX = Math.cos(flipProgress * Math.PI);
        const absScaleX = Math.abs(scaleX);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(absScaleX, 1);
        ctx.translate(-cx, -cy);

        const grad = rarityGrad[item.rarity];
        const g = ctx.createLinearGradient(CARD_X, CARD_Y, CARD_X + CARD_W, CARD_Y + CARD_H);
        g.addColorStop(0, grad[0]);
        g.addColorStop(1, grad[1]);

        const radius = 16;
        ctx.beginPath();
        ctx.moveTo(CARD_X + radius, CARD_Y);
        ctx.lineTo(CARD_X + CARD_W - radius, CARD_Y);
        ctx.quadraticCurveTo(CARD_X + CARD_W, CARD_Y, CARD_X + CARD_W, CARD_Y + radius);
        ctx.lineTo(CARD_X + CARD_W, CARD_Y + CARD_H - radius);
        ctx.quadraticCurveTo(CARD_X + CARD_W, CARD_Y + CARD_H, CARD_X + CARD_W - radius, CARD_Y + CARD_H);
        ctx.lineTo(CARD_X + radius, CARD_Y + CARD_H);
        ctx.quadraticCurveTo(CARD_X, CARD_Y + CARD_H, CARD_X, CARD_Y + CARD_H - radius);
        ctx.lineTo(CARD_X, CARD_Y + radius);
        ctx.quadraticCurveTo(CARD_X, CARD_Y, CARD_X + radius, CARD_Y);
        ctx.closePath();
        ctx.fillStyle = showBack ? grad[1] : 'rgba(15,23,42,0.9)';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = rarityColor[item.rarity];
        ctx.shadowColor = rarityColor[item.rarity];
        ctx.shadowBlur = 18;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.save();
        ctx.clip();
        const shine = ctx.createLinearGradient(CARD_X, CARD_Y, CARD_X + CARD_W, CARD_Y + CARD_H);
        shine.addColorStop(0, 'rgba(255,255,255,0.0)');
        shine.addColorStop(0.5, 'rgba(255,255,255,0.08)');
        shine.addColorStop(1, 'rgba(255,255,255,0.0)');
        ctx.fillStyle = shine;
        ctx.fillRect(CARD_X, CARD_Y, CARD_W, CARD_H);
        ctx.restore();

        if (!showBack) {
          ctx.fillStyle = rarityColor[item.rarity];
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(rarityLabel(item.rarity), CARD_X + CARD_W - 16, CARD_Y + 26);

          ctx.fillStyle = '#f1f5f9';
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(item.name, cx, CARD_Y + 70);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '13px sans-serif';
          const descLines = wrapText(ctx, item.description, CARD_W - 60);
          descLines.forEach((ln, i) => ctx.fillText(ln, cx, CARD_Y + 105 + i * 18));

          ctx.fillStyle = '#e2e8f0';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('属 性 标 签', cx, CARD_Y + 170);

          const attrStartY = CARD_Y + 195;
          item.attributes.forEach((a, idx) => {
            const yy = attrStartY + idx * 30;
            ctx.fillStyle = 'rgba(30,41,59,0.85)';
            const tagW = 240;
            const tagH = 22;
            const tx = cx - tagW / 2;
            roundRect(ctx, tx, yy, tagW, tagH, 11);
            ctx.fill();
            ctx.strokeStyle = 'rgba(148,163,184,0.35)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '13px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(a.name, tx + 14, yy + 15);
            ctx.textAlign = 'right';
            ctx.fillStyle = rarityColor[item.rarity];
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText(`+${a.value}`, tx + tagW - 14, yy + 16);
          });
        } else {
          ctx.fillStyle = '#fcd34d';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('鉴 定 结 果', cx, CARD_Y + 50);

          ctx.fillStyle = '#f1f5f9';
          ctx.font = 'bold 20px sans-serif';
          ctx.fillText(item.name, cx, CARD_Y + 90);

          ctx.fillStyle = rarityColor[item.rarity];
          ctx.font = 'bold 36px sans-serif';
          ctx.fillText(rarityLabel(item.rarity), cx, CARD_Y + 155);

          ctx.fillStyle = '#e2e8f0';
          ctx.font = '14px sans-serif';
          const playerChoice = flipAnimRef.current?.playerRarity ?? 'common';
          const isOk = playerChoice === item.rarity;
          const text = isOk
            ? `判断正确！本轮得分 +${lastScoreDeltaRef.current}`
            : `你判定为 ${rarityLabel(playerChoice)} / 实际 ${rarityLabel(item.rarity)} / +${lastScoreDeltaRef.current}`;
          const lines = wrapText(ctx, text, CARD_W - 80);
          lines.forEach((ln, i) => ctx.fillText(ln, cx, CARD_Y + 200 + i * 22));
        }
        ctx.restore();
      };
      drawCard();

      const drawCountdown = () => {
        const elapsed = (now - roundStartRef.current) / 1000;
        const remain = Math.max(0, COUNTDOWN_SECONDS - elapsed);
        const ratio = Math.max(0, Math.min(1, remain / COUNTDOWN_SECONDS));

        const barX = CARD_X;
        const barY = CARD_Y + CARD_H + 18;
        const barW = CARD_W;
        const barH = 14;
        roundRect(ctx, barX, barY, barW, barH, 7);
        ctx.fillStyle = 'rgba(30,41,59,0.95)';
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.stroke();

        const fillW = Math.max(0, (barW - 4) * ratio);
        const col = ratio > 0.5 ? '#22c55e' : ratio > 0.2 ? '#eab308' : '#ef4444';
        const fg = ctx.createLinearGradient(barX, barY, barX, barY + barH);
        fg.addColorStop(0, col);
        fg.addColorStop(1, shade(col, -25));
        roundRect(ctx, barX + 2, barY + 2, fillW, barH - 4, 6);
        ctx.fillStyle = fg;
        ctx.fill();

        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`倒计时 ${remain.toFixed(1)}s`, barX + barW / 2, barY + 11);
      };
      drawCountdown();

      const drawHints = () => {
        ctx.fillStyle = 'rgba(148,163,184,0.55)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('根据物品名称与属性值判断稀有度，8秒内完成', CANVAS_W / 2, CANVAS_H - 16);
      };

      const drawFeedback = () => {
        const fx = feedbackRef.current;
        if (!fx) return;
        const t = (now - fx.startAt) / (fx.kind === 'perfect' ? 800 : 600);
        if (t > 1) { feedbackRef.current = null; return; }
        const et = easeOutCubic(t);
        ctx.save();
        const cx = CARD_X + CARD_W / 2;
        const cy = CARD_Y + CARD_H - 20;
        if (fx.kind === 'perfect') {
          const scale = 1 + 0.3 * (1 - et);
          const yy = cy - et * 120;
          ctx.translate(cx, yy);
          ctx.scale(scale, scale);
          ctx.globalAlpha = 1 - et;
          ctx.fillStyle = '#22c55e';
          ctx.font = 'bold 44px sans-serif';
          ctx.textAlign = 'center';
          ctx.shadowColor = '#22c55e';
          ctx.shadowBlur = 24;
          ctx.fillText('完美！', 0, 0);
        } else {
          const offset = et * 220;
          ctx.translate(cx + offset * 0.5, cy - offset * 0.5);
          ctx.rotate(-0.35 * et);
          ctx.globalAlpha = 1 - et;
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 38px sans-serif';
          ctx.textAlign = 'center';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 20;
          ctx.fillText('判断失误', 0, 0);
        }
        ctx.restore();
      };
      drawFeedback();

      drawHints();

      if (gameState === 'finished') {
        drawFadeOverlay(ctx, now);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [item, gameState, flipAnimRef, feedbackRef, roundStartRef]);

  const handleRestart = () => {
    setRound(1);
    setScore(0);
    setCorrectCount(0);
    setGameOverInfo(null);
    playerNameRef.current = genPlayerName();
    setStartTime(performance.now());
    loadItem();
  };

  return (
    <>
      <div className="top-status-bar">
        <div>
          <span style={{ color: '#94a3b8', fontSize: 12 }}>玩家：</span>
          <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{playerNameRef.current}</span>
        </div>
        <div>
          <span style={{ color: '#94a3b8', fontSize: 12, marginRight: 6 }}>得分</span>
          <span className={`status-score ${scoreBump ? 'bump' : ''}`}>{score}</span>
        </div>
        <div className="status-round">第 {round} / {TOTAL_ROUNDS} 轮</div>
      </div>

      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          id="gameCanvas"
          width={CANVAS_W}
          height={CANVAS_H}
        />
        {gameOverInfo && (
          <div className="game-over-overlay">
            <div className="game-over-card">
              <div className="game-over-title">🎮 游戏结束</div>
              <div className="game-over-stat">
                玩家：<b style={{ color: '#fcd34d' }}>{playerNameRef.current}</b>
              </div>
              <div className="game-over-stat">
                总分：<b style={{ color: '#fcd34d', fontSize: 20 }}>{gameOverInfo.score}</b>
              </div>
              <div className="game-over-stat">
                准确率：<b style={{ color: '#22c55e' }}>{gameOverInfo.accuracy.toFixed(1)}%</b>
              </div>
              <div className="game-over-stat">
                用时：<b style={{ color: '#93c5fd' }}>
                  {Math.floor(gameOverInfo.duration / 60)}:
                  {Math.floor(gameOverInfo.duration % 60).toString().padStart(2, '0')}
                </b>
              </div>
              {gameOverInfo.submitted && gameOverInfo.rank && (
                <div className="game-over-stat" style={{ marginTop: 10 }}>
                  🏆 当前排名：<b style={{ color: '#f59e0b' }}>第 {gameOverInfo.rank} 名</b>
                </div>
              )}
              <div className="game-over-btns">
                <button className="game-btn btn-primary" onClick={handleRestart}>
                  再玩一次
                </button>
                <button
                  className="game-btn btn-success"
                  onClick={() => navigate('/ranking')}
                >
                  查看排行榜
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <RatingPanel
        item={item}
        onRate={handleRate}
        disabled={gameState !== 'playing'}
      />
    </>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const ch of text) {
    const test = current + ch;
    if (ctx.measureText(test).width > maxWidth && current.length > 0) {
      lines.push(current);
      current = ch;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function shade(hex: string, percent: number): string {
  const f = parseInt(hex.slice(1), 16);
  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent) / 100;
  const R = f >> 16;
  const G = (f >> 8) & 0x00ff;
  const B = f & 0x0000ff;
  const r = Math.round((t - R) * p) + R;
  const g = Math.round((t - G) * p) + G;
  const b = Math.round((t - B) * p) + B;
  return `rgb(${r},${g},${b})`;
}

function drawFadeOverlay(ctx: CanvasRenderingContext2D, _now: number): void {
  ctx.save();
  ctx.fillStyle = 'rgba(15,23,42,0.35)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.restore();
}
