import React, { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { useGameLoop } from '../hooks/useGameLoop';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BALL_RADIUS,
  BALL_COLOR,
  PIN_WIDTH,
  PIN_HEIGHT,
  GROUND_COLOR,
  BACKGROUND_COLOR,
  TOTAL_ROUNDS,
} from '../game/constants';

export const GameBoard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const groundPatternRef = useRef<CanvasPattern | null>(null);

  const ball = useGameStore((state) => state.ball);
  const pins = useGameStore((state) => state.pins);
  const aimAngle = useGameStore((state) => state.aimAngle);
  const power = useGameStore((state) => state.power);
  const isCharging = useGameStore((state) => state.isCharging);
  const gameStatus = useGameStore((state) => state.gameStatus);
  const showScorePopup = useGameStore((state) => state.showScorePopup);
  const scorePopupValue = useGameStore((state) => state.scorePopupValue);
  const lastScore = useGameStore((state) => state.lastScore);
  const round = useGameStore((state) => state.round);
  const score = useGameStore((state) => state.score);

  const setAimAngle = useGameStore((state) => state.setAimAngle);
  const setIsAiming = useGameStore((state) => state.setIsAiming);
  const startCharging = useGameStore((state) => state.startCharging);
  const stopCharging = useGameStore((state) => state.stopCharging);
  const nextRound = useGameStore((state) => state.nextRound);
  const resetGame = useGameStore((state) => state.resetGame);

  useGameLoop();

  useEffect(() => {
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 200;
    patternCanvas.height = 200;
    const pctx = patternCanvas.getContext('2d');
    if (pctx) {
      pctx.fillStyle = GROUND_COLOR;
      pctx.fillRect(0, 0, 200, 200);

      pctx.strokeStyle = '#d4c094';
      pctx.lineWidth = 0.5;
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * 200;
        const y = Math.random() * 200;
        const length = 10 + Math.random() * 30;
        const angle = Math.random() * Math.PI;
        pctx.beginPath();
        pctx.moveTo(x, y);
        pctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
        pctx.stroke();
      }

      for (let i = 0; i < 100; i++) {
        pctx.fillStyle = `rgba(180, 150, 100, ${0.1 + Math.random() * 0.2})`;
        pctx.beginPath();
        pctx.arc(Math.random() * 200, Math.random() * 200, 1 + Math.random() * 2, 0, Math.PI * 2);
        pctx.fill();
      }

      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        groundPatternRef.current = ctx.createPattern(patternCanvas, 'repeat');
      }
    }
  }, []);

  const drawWoodGrain = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, rotation: number = 0) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);

    const gradient = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
    gradient.addColorStop(0, '#b8956a');
    gradient.addColorStop(0.3, '#d4a574');
    gradient.addColorStop(0.5, '#c8a45a');
    gradient.addColorStop(0.7, '#d4a574');
    gradient.addColorStop(1, '#b8956a');

    ctx.fillStyle = gradient;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    ctx.strokeStyle = 'rgba(139, 105, 20, 0.2)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < height; i += 3) {
      ctx.beginPath();
      ctx.moveTo(-width / 2, -height / 2 + i);
      ctx.bezierCurveTo(
        -width / 4, -height / 2 + i + Math.sin(i * 0.5) * 2,
        width / 4, -height / 2 + i + Math.cos(i * 0.5) * 2,
        width / 2, -height / 2 + i
      );
      ctx.stroke();
    }

    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 1;
    ctx.strokeRect(-width / 2, -height / 2, width, height);

    ctx.restore();
  }, []);

  const drawBall = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.save();

    const shadowOffset = 3;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(
      ball.x + shadowOffset,
      ball.y + shadowOffset,
      BALL_RADIUS * 0.8,
      BALL_RADIUS * 0.4,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.rotation);

    const gradient = ctx.createRadialGradient(-BALL_RADIUS * 0.3, -BALL_RADIUS * 0.3, 0, 0, 0, BALL_RADIUS);
    gradient.addColorStop(0, '#e8c47a');
    gradient.addColorStop(0.5, BALL_COLOR);
    gradient.addColorStop(1, '#a08040');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(139, 105, 20, 0.3)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      const angle = (i / 6) * Math.PI * 2;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * BALL_RADIUS, Math.sin(angle) * BALL_RADIUS);
      ctx.stroke();
    }

    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }, [ball.x, ball.y, ball.rotation]);

  const drawPin = useCallback((ctx: CanvasRenderingContext2D, pin: typeof pins[0]) => {
    if (pin.isDown && Math.abs(pin.rotation) >= 90) return;

    ctx.save();
    ctx.translate(pin.x, pin.y);

    if (pin.isDown) {
      ctx.rotate((pin.fallDirection * Math.PI) / 180);
      ctx.rotate((pin.rotation * Math.PI) / 180);
    }

    const shadowOffset = 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(-PIN_WIDTH / 2 + shadowOffset, -PIN_HEIGHT + shadowOffset, PIN_WIDTH, PIN_HEIGHT);

    drawWoodGrain(ctx, 0, -PIN_HEIGHT / 2, PIN_WIDTH, PIN_HEIGHT);

    ctx.font = 'bold 16px "Ma Shan Zheng", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = pin.type === 'red' ? '#d32f2f' : '#1a1a1a';
    ctx.fillText(pin.word, 0, -PIN_HEIGHT / 2);

    ctx.restore();
  }, [drawWoodGrain]);

  const drawAimingLine = useCallback((ctx: CanvasRenderingContext2D) => {
    if (gameStatus !== 'ready' && gameStatus !== 'roundEnd') return;

    const angleRad = (aimAngle * Math.PI) / 180;
    const lineLength = 150;
    const endX = ball.x + Math.cos(angleRad) * lineLength;
    const endY = ball.y + Math.sin(angleRad) * lineLength;

    ctx.save();
    ctx.strokeStyle = isCharging ? '#d32f2f' : 'rgba(139, 105, 20, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(ball.x, ball.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    const arrowSize = 10;
    ctx.setLineDash([]);
    ctx.fillStyle = isCharging ? '#d32f2f' : 'rgba(139, 105, 20, 0.8)';
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowSize * Math.cos(angleRad - Math.PI / 6),
      endY - arrowSize * Math.sin(angleRad - Math.PI / 6)
    );
    ctx.lineTo(
      endX - arrowSize * Math.cos(angleRad + Math.PI / 6),
      endY - arrowSize * Math.sin(angleRad + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }, [aimAngle, ball.x, ball.y, gameStatus, isCharging]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const render = () => {
      ctx.fillStyle = BACKGROUND_COLOR;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (groundPatternRef.current) {
        ctx.fillStyle = groundPatternRef.current;
        ctx.fillRect(20, 20, CANVAS_WIDTH - 40, CANVAS_HEIGHT - 40);
      }

      ctx.strokeStyle = '#8b6914';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, CANVAS_WIDTH - 40, CANVAS_HEIGHT - 40);

      drawAimingLine(ctx);

      pins.forEach((pin) => drawPin(ctx, pin));

      drawBall(ctx);

      requestAnimationFrame(render);
    };

    const animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [drawAimingLine, drawBall, drawPin, pins]);

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX ?? 0;
      clientY = e.touches[0]?.clientY ?? 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const handlePointerMove = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (gameStatus !== 'ready') return;
    if ('touches' in e && e.touches.length === 0) return;

    const { x, y } = getCanvasCoords(e);
    const angle = Math.atan2(y - ball.y, x - ball.x) * (180 / Math.PI);
    setAimAngle(angle);
  }, [ball.x, ball.y, gameStatus, getCanvasCoords, setAimAngle]);

  const handlePointerDown = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (gameStatus !== 'ready') return;

    setIsAiming(true);
    startCharging();
  }, [gameStatus, setIsAiming, startCharging]);

  const handlePointerUp = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (gameStatus !== 'ready') return;

    setIsAiming(false);
    stopCharging();
  }, [gameStatus, setIsAiming, stopCharging]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-4 border-amber-800 rounded-lg shadow-2xl cursor-crosshair max-w-full"
        style={{ maxHeight: '70vh' }}
        onMouseMove={handlePointerMove}
        onMouseDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchMove={handlePointerMove}
        onTouchStart={handlePointerDown}
        onTouchEnd={handlePointerUp}
      />

      <AnimatePresence>
        {showScorePopup && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: -30, scale: 1.2 }}
            exit={{ opacity: 0, y: -60, scale: 1.5 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            <span
              className={`text-6xl font-bold drop-shadow-lg`}
              style={{
                fontFamily: '"Ma Shan Zheng", serif',
                color: scorePopupValue > 0 ? '#d32f2f' : '#1a1a1a',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              {scorePopupValue > 0 ? `+${scorePopupValue}` : scorePopupValue}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCharging && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-4 top-1/2 -translate-y-1/2"
          >
            <div className="bg-amber-100 border-4 border-amber-800 rounded-lg p-3 shadow-xl">
              <div
                className="text-center mb-2 text-amber-900 font-bold"
                style={{ fontFamily: '"Ma Shan Zheng", serif' }}
              >
                蓄力
              </div>
              <div className="w-8 h-48 bg-amber-200 border-2 border-amber-700 rounded relative overflow-hidden">
                <motion.div
                  className="absolute bottom-0 left-0 right-0"
                  style={{
                    height: `${power}%`,
                    background: `linear-gradient(to top, #d32f2f, #ff6b6b)`,
                  }}
                />
                <div className="absolute inset-0 flex justify-center items-start pt-2">
                  <span className="text-xs font-bold text-amber-900">
                    {Math.round(power)}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameStatus === 'roundEnd' && round <= TOTAL_ROUNDS && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg"
          >
            <div className="bg-amber-100 border-4 border-amber-800 rounded-lg p-8 shadow-2xl text-center">
              <h3
                className="text-3xl mb-4 text-amber-900"
                style={{ fontFamily: '"Ma Shan Zheng", serif' }}
              >
                第 {round} 轮结束
              </h3>
              <p
                className={`text-2xl mb-6 font-bold ${lastScore >= 0 ? 'text-red-700' : 'text-gray-800'}`}
                style={{ fontFamily: '"Ma Shan Zheng", serif' }}
              >
                本轮得分: {lastScore >= 0 ? `+${lastScore}` : lastScore}
              </p>
              <p
                className="text-xl mb-6 text-amber-800"
                style={{ fontFamily: '"Ma Shan Zheng", serif' }}
              >
                当前总分: {score}
              </p>
              <button
                onClick={nextRound}
                className="px-8 py-3 bg-amber-700 hover:bg-amber-600 text-white text-xl rounded-lg transition-all transform hover:scale-105 shadow-lg"
                style={{ fontFamily: '"Ma Shan Zheng", serif' }}
              >
                {round < TOTAL_ROUNDS ? '下一轮' : '查看结果'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameStatus === 'gameOver' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-lg"
          >
            <div className="bg-amber-100 border-4 border-amber-800 rounded-lg p-10 shadow-2xl text-center">
              <h2
                className="text-5xl mb-6 text-amber-900"
                style={{ fontFamily: '"Ma Shan Zheng", serif' }}
              >
                游戏结束
              </h2>
              <div
                className="text-3xl mb-4 text-amber-800"
                style={{ fontFamily: '"Ma Shan Zheng", serif' }}
              >
                最终得分
              </div>
              <div
                className={`text-7xl mb-8 font-bold ${score >= 0 ? 'text-red-700' : 'text-gray-800'}`}
                style={{ fontFamily: '"Ma Shan Zheng", serif' }}
              >
                {score}
              </div>
              <div
                className="text-xl mb-8 text-amber-700"
                style={{ fontFamily: '"Ma Shan Zheng", serif' }}
              >
                {score >= 50 ? '🏆 品德高尚，堪称楷模！' :
                 score >= 0 ? '👍 修身有道，继续努力！' :
                 '💪 引以为戒，改过自新！'}
              </div>
              <button
                onClick={resetGame}
                className="px-10 py-4 bg-red-700 hover:bg-red-600 text-white text-2xl rounded-lg transition-all transform hover:scale-105 shadow-lg"
                style={{ fontFamily: '"Ma Shan Zheng", serif' }}
              >
                再来一局
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
