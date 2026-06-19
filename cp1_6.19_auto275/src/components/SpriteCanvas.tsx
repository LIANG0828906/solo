import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  drawPixelFrame,
  drawGrass,
  drawClouds,
  getSpriteFrameByMood,
  getStatusBarColor,
  HAMBURGER_ICON,
  WATER_ICON,
  EXCLAMATION_ICON,
  RUN_ICON,
  BUBBLE_ICON,
  SAD_BUBBLE_ICON,
  COLORS,
} from '../utils/pixelArt';

const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 300;
const SPRITE_SIZE = 16;
const PIXEL_SCALE = 6;

const spriteCanvasSelector = (state: {
  position: { x: number; y: number };
  animation: {
    type: string;
    frame: number;
    direction: string;
    rotation: number;
    actionTimer: number;
  };
  stats: { mood: number; hunger: number; cleanliness: number; energy: number };
  showSadBubble: boolean;
  updateAnimation: (deltaTime: number) => void;
  updateStats: () => void;
  updatePosition: () => void;
}) => ({
  position: state.position,
  animation: state.animation,
  stats: state.stats,
  showSadBubble: state.showSadBubble,
  updateAnimation: state.updateAnimation,
  updateStats: state.updateStats,
  updatePosition: state.updatePosition,
});

export default function SpriteCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const statsIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const positionIntervalRef = useRef<ReturnType<typeof setInterval>>();

  const {
    position,
    animation,
    stats,
    showSadBubble,
    updateAnimation,
    updateStats,
    updatePosition,
  } = useGameStore(spriteCanvasSelector);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    const animate = (currentTime: number) => {
      const deltaTime = lastTimeRef.current ? currentTime - lastTimeRef.current : 16;
      lastTimeRef.current = currentTime;

      updateAnimation(deltaTime);

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = COLORS.SKY;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      drawClouds(ctx, CANVAS_WIDTH, 80);
      drawGrass(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);

      const mood = stats.mood;
      const spriteFrame = getSpriteFrameByMood(mood, animation.type, animation.frame);
      const spriteX = position.x;
      const spriteY = position.y;

      if (animation.direction === 'left') {
        ctx.save();
        ctx.translate(spriteX + SPRITE_SIZE * PIXEL_SCALE, spriteY);
        ctx.scale(-1, 1);
        drawPixelFrame(ctx, spriteFrame, 0, 0, PIXEL_SCALE, animation.rotation);
        ctx.restore();
      } else {
        drawPixelFrame(ctx, spriteFrame, spriteX, spriteY, PIXEL_SCALE, animation.rotation);
      }

      if (animation.actionTimer > 0) {
        const actionIconX = spriteX + SPRITE_SIZE * PIXEL_SCALE - 10;
        const actionIconY = spriteY - 40;
        const iconScale = 2;
        const rotation = (animation.frame * 90) % 360;

        let actionIcon = null;
        switch (animation.type) {
          case 'feed':
            actionIcon = HAMBURGER_ICON;
            break;
          case 'clean':
            actionIcon = WATER_ICON;
            break;
          case 'train':
            actionIcon = EXCLAMATION_ICON;
            break;
          case 'play':
            actionIcon = RUN_ICON;
            break;
        }

        if (actionIcon) {
          drawPixelFrame(ctx, actionIcon, actionIconX, actionIconY, iconScale, rotation);
        }
      }

      if (showSadBubble) {
        const bubbleX = spriteX + SPRITE_SIZE * PIXEL_SCALE - 20;
        const bubbleY = spriteY - 35;
        const bubbleIcon = mood <= 0 ? SAD_BUBBLE_ICON : BUBBLE_ICON;
        const blinkOpacity = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        ctx.globalAlpha = blinkOpacity;
        drawPixelFrame(ctx, bubbleIcon, bubbleX, bubbleY, 2);
        ctx.globalAlpha = 1;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    statsIntervalRef.current = setInterval(() => {
      updateStats();
    }, 1000);

    positionIntervalRef.current = setInterval(() => {
      updatePosition();
    }, 1000);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
      }
    };
  }, [updateAnimation, updateStats, updatePosition]);

  const getBarValue = (value: number) => {
    if (value >= 60) return 'high';
    if (value >= 30) return 'medium';
    return 'low';
  };

  const getStatusText = () => {
    const minStat = Math.min(stats.mood, stats.hunger, stats.cleanliness, stats.energy);
    if (minStat <= 0) return '...';
    if (stats.hunger <= 20) return '好饿...';
    if (stats.mood <= 20) return '呜呜...';
    if (stats.cleanliness <= 20) return '脏脏的...';
    if (stats.energy <= 20) return '好累...';
    if (minStat >= 80) return '超开心！';
    return '心情不错~';
  };

  return (
    <div className="sprite-canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="sprite-canvas"
        style={{
          imageRendering: 'pixelated' as const,
        }}
      />
      <div className="sprite-mini-status">
        <div className="mini-status-bar">
          <span className="mini-status-label">HP</span>
          <div className="mini-status-bars">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`mini-status-block ${getBarValue(stats.hunger)}`}
                style={{
                  backgroundColor: i <= Math.ceil(stats.hunger / 20)
                    ? getStatusBarColor(stats.hunger)
                    : '#ddd',
                }}
              />
            ))}
          </div>
        </div>
        <div className="sprite-status-text">{getStatusText()}</div>
      </div>
    </div>
  );
}
