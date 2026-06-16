import { useState, useEffect, useRef } from 'react';
import type { Message } from '../types';

interface MessageCardProps {
  message: Message;
  onLike: (id: string) => void;
  index: number;
}

const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return '很久之前';
};

const generateConstellationPoints = (width: number, height: number, starCount: number) => {
  const points = [];
  const padding = 20;

  for (let i = 0; i < starCount; i++) {
    points.push({
      x: padding + Math.random() * (width - padding * 2),
      y: padding + Math.random() * (height - padding * 2),
      size: 1 + Math.random() * 2,
    });
  }

  return points;
};

const MessageCard = ({ message, onLike, index }: MessageCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLikedAnimating, setIsLikedAnimating] = useState(false);
  const [relativeTime, setRelativeTime] = useState(formatRelativeTime(message.timestamp));
  const [liked, setLiked] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const constellationRef = useRef<{
    points: { x: number; y: number; size: number }[];
    connections: [number, number][];
  } | null>(null);
  const animRef = useRef<number>(0);
  const flipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setRelativeTime(formatRelativeTime(message.timestamp));
    }, 10000);

    return () => clearInterval(timer);
  }, [message.timestamp]);

  useEffect(() => {
    if (!isFlipped || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;

    if (!constellationRef.current) {
      const points = generateConstellationPoints(width, height, 8 + Math.floor(Math.random() * 5));
      const connections: [number, number][] = [];

      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dist = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
          if (dist < 80 && Math.random() > 0.3) {
            connections.push([i, j]);
          }
        }
      }

      const visited = new Set<number>();
      const dfs = (node: number) => {
        if (visited.has(node)) return;
        visited.add(node);
        for (const [a, b] of connections) {
          if (a === node) dfs(b);
          if (b === node) dfs(a);
        }
      };

      if (points.length > 0) {
        dfs(0);
        for (let i = 0; i < points.length; i++) {
          if (!visited.has(i)) {
            const nearest = Array.from(visited).reduce((min, j) => {
              const d = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
              const minD = Math.hypot(points[i].x - points[min].x, points[i].y - points[min].y);
              return d < minD ? j : min;
            }, 0);
            connections.push([i, nearest]);
            dfs(i);
          }
        }
      }

      constellationRef.current = { points, connections };
    }

    const { points, connections } = constellationRef.current;
    let startTime = performance.now();
    const duration = 2000;

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);

      ctx.clearRect(0, 0, width, height);

      const bgGradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, width / 2
      );
      bgGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
      bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      const lineProgress = progress;
      for (const [a, b] of connections) {
        const p1 = points[a];
        const p2 = points[b];
        const t = Math.min(lineProgress * 1.5, 1);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p1.x + (p2.x - p1.x) * t, p1.y + (p2.y - p1.y) * t);
        ctx.strokeStyle = `rgba(153, 204, 255, ${0.3 * t})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const starProgress = Math.min(Math.max((progress - i * 0.08) / 0.2, 0), 1);
        const twinkle = 0.5 + 0.5 * Math.sin((elapsed / 500) + i);

        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size * starProgress, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * starProgress * twinkle + 0.4 * starProgress})`;
        ctx.fill();

        if (starProgress > 0.5) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, point.size * 3 * starProgress, 0, Math.PI * 2);
          const glowGradient = ctx.createRadialGradient(
            point.x, point.y, 0,
            point.x, point.y, point.size * 3 * starProgress
          );
          glowGradient.addColorStop(0, `rgba(255, 255, 255, ${0.2 * starProgress})`);
          glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = glowGradient;
          ctx.fill();
        }
      }

      if (progress < 1 || isFlipped) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [isFlipped]);

  useEffect(() => {
    if (isFlipped) {
      flipTimeoutRef.current = setTimeout(() => {
        setIsFlipped(false);
      }, 2000);
    }

    return () => {
      if (flipTimeoutRef.current) {
        clearTimeout(flipTimeoutRef.current);
      }
    };
  }, [isFlipped]);

  const handleDoubleClick = () => {
    if (!isFlipped) {
      setIsFlipped(true);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!liked) {
      setLiked(true);
      setIsLikedAnimating(true);
      onLike(message.id);
      setTimeout(() => setIsLikedAnimating(false), 200);
    }
  };

  const cardStyle: React.CSSProperties = {
    animationDelay: `${message.floatOffset}s, ${message.floatOffset}s`,
    animationDuration: `${message.floatDuration}s, ${message.floatDuration}s`,
  };

  return (
    <div
      className={`message-card ${message.isNew ? 'new-message' : ''}`}
      style={cardStyle}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className="message-color-bar"
        style={{ backgroundColor: message.color }}
      />
      <div className={`card-inner ${isFlipped ? 'flipped' : ''}`}>
        <div className="card-front">
          <p className="message-content">{message.content}</p>
          <div className="card-footer">
            <span className="message-time">{relativeTime}</span>
            <button
              className={`like-btn ${liked ? 'liked' : ''}`}
              onClick={handleLike}
            >
              <span className={`heart-icon ${isLikedAnimating ? 'bounce' : ''}`}>
                {liked ? '♥' : '♡'}
              </span>
              <span>{message.likes}</span>
            </button>
          </div>
        </div>
        <div className="card-back">
          <canvas ref={canvasRef} className="constellation-canvas" />
        </div>
      </div>
    </div>
  );
};

export default MessageCard;
