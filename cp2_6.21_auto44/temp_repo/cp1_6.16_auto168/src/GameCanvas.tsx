import { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { NetworkNode } from '@/types';
import { createAudioSystem } from '@/utils/audio';

interface CodeStream {
  x: number;
  y: number;
  chars: string[];
  speed: number;
  opacity: number;
}

function formatTime(s: number): string {
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef(createAudioSystem());
  const containerRef = useRef<HTMLDivElement>(null);
  const codeStreamsRef = useRef<CodeStream[]>([]);
  const rafRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);
  const lastFragmentRef = useRef<number>(0);
  const bgStartedRef = useRef<boolean>(false);

  const {
    nodes,
    entryNodeId,
    targetNodeId,
    capturedCount,
    totalNodes,
    animationEvents,
    generateNetwork,
    hackNode,
    tickTime,
    regenerateFragments,
    clearExpiredAnimations,
    getEffectiveDefense,
  } = useGameStore();

  const initCodeStreams = useCallback((width: number, height: number) => {
    const streams: CodeStream[] = [];
    const count = Math.floor(width / 60);
    const hexChars = '0123456789ABCDEF';
    for (let i = 0; i < count; i++) {
      const charCount = Math.floor(Math.random() * 8) + 5;
      const chars: string[] = [];
      for (let j = 0; j < charCount; j++) {
        chars.push(hexChars[Math.floor(Math.random() * hexChars.length)]);
      }
      streams.push({
        x: Math.random() * width,
        y: Math.random() * height,
        chars,
        speed: 0.3 + Math.random() * 0.7,
        opacity: 0.2 + Math.random() * 0.4,
      });
    }
    codeStreamsRef.current = streams;
  }, []);

  const getNodeColor = useCallback((node: NetworkNode): string => {
    if (node.status === 'entry') return '#00FF00';
    if (node.status === 'captured') return '#B388FF';
    if (node.defenseLevel === 'low') return '#00FF88';
    if (node.defenseLevel === 'medium') return '#FFAA00';
    return '#FF3355';
  }, []);

  const getNodeRadius = useCallback((node: NetworkNode, entryId: string, targetId: string): number => {
    if (node.id === entryId || node.id === targetId) return 28;
    return 22;
  }, []);

  const darkenColor = useCallback((hex: string, factor: number = 0.6): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.floor((num >> 16) * factor);
    const g = Math.floor(((num >> 8) & 0x00ff) * factor);
    const b = Math.floor((num & 0x0000ff) * factor);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }, []);

  const getNodeAtPosition = useCallback(
    (x: number, y: number): NetworkNode | null => {
      const entries = Array.from(nodes.entries());
      for (const [, node] of entries) {
        const r = getNodeRadius(node, entryNodeId, targetNodeId) + 5;
        const dx = x - node.x;
        const dy = y - node.y;
        if (dx * dx + dy * dy <= r * r) {
          return node;
        }
      }
      return null;
    },
    [nodes, entryNodeId, targetNodeId, getNodeRadius]
  );

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, now: number) => {
      const time = now / 1000;

      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, width, height);

      const gridSpacing = 40;
      const timeOffset = (time * 10) % gridSpacing;
      ctx.strokeStyle = 'rgba(10, 26, 42, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = -timeOffset; x <= width; x += gridSpacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = -timeOffset; y <= height; y += gridSpacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      const streams = codeStreamsRef.current;
      ctx.font = '12px Courier New';
      for (const stream of streams) {
        stream.y += stream.speed;
        if (stream.y > height + stream.chars.length * 14) {
          stream.y = -stream.chars.length * 14;
          stream.x = Math.random() * width;
        }
        ctx.fillStyle = `rgba(0, 255, 65, ${stream.opacity})`;
        for (let i = 0; i < stream.chars.length; i++) {
          const charOpacity = stream.opacity * (1 - i / stream.chars.length);
          ctx.fillStyle = `rgba(0, 255, 65, ${charOpacity})`;
          if (Math.random() < 0.02) {
            stream.chars[i] = '0123456789ABCDEF'[Math.floor(Math.random() * 16)];
          }
          ctx.fillText(stream.chars[i], stream.x, stream.y + i * 14);
        }
      }

      const nodeEntries = Array.from(nodes.entries());

      for (const [, node] of nodeEntries) {
        for (const childId of node.childrenIds) {
          const child = nodes.get(childId);
          if (!child) continue;

          const bothCaptured =
            (node.status === 'captured' || node.status === 'entry') &&
            (child.status === 'captured' || child.status === 'entry');

          const grad = ctx.createLinearGradient(node.x, node.y, child.x, child.y);
          grad.addColorStop(0, '#00FFFF');
          grad.addColorStop(1, bothCaptured ? '#00FFFF' : 'rgba(0, 255, 255, 0.4)');

          ctx.strokeStyle = grad;
          ctx.lineWidth = bothCaptured ? 3 : 1.5;
          ctx.shadowColor = '#00FFFF';
          ctx.shadowBlur = bothCaptured ? 8 : 4;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(child.x, child.y);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      for (const [, node] of nodeEntries) {
        const color = getNodeColor(node);
        const r = getNodeRadius(node, entryNodeId, targetNodeId);

        ctx.shadowColor = color;
        ctx.shadowBlur = 12;

        ctx.fillStyle = darkenColor(color, 0.3);
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = darkenColor(color, 0.6);
        ctx.beginPath();
        ctx.arc(node.x, node.y, r - 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const displayName = node.name.slice(0, 2);
        ctx.fillText(displayName, node.x, node.y);

        const effectiveDef = getEffectiveDefense(node.id);
        ctx.fillStyle = color;
        ctx.font = '10px Courier New';
        ctx.fillText(String(effectiveDef), node.x, node.y + r + 10);

        if (effectiveDef !== node.defense) {
          ctx.fillStyle = '#FF3355';
          ctx.font = 'bold 9px Courier New';
          ctx.fillText('减半', node.x, node.y + r + 22);
        }

        if (node.id === entryNodeId) {
          ctx.fillStyle = '#00FF00';
          ctx.font = 'bold 10px Courier New';
          ctx.fillText('入口', node.x, node.y - r - 14);
          ctx.beginPath();
          ctx.moveTo(node.x - 8, node.y - r - 8);
          ctx.lineTo(node.x + 8, node.y - r - 8);
          ctx.lineTo(node.x, node.y - r - 16);
          ctx.closePath();
          ctx.fill();
        }

        if (node.id === targetNodeId) {
          const pulse = 1 + Math.sin(time * 3) * 0.15;
          ctx.strokeStyle = '#FF3355';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#FF3355';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r * pulse, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#FF3355';
          ctx.font = 'bold 10px Courier New';
          ctx.fillText('目标', node.x, node.y - r - 14);
        }
      }

      for (const event of animationEvents) {
        const node = nodes.get(event.nodeId);
        if (!node) continue;
        const r = getNodeRadius(node, entryNodeId, targetNodeId);
        const elapsed = now - event.startTime;
        const progress = Math.min(1, elapsed / event.duration);

        if (event.type === 'pulse') {
          const pulseR = r + progress * 30;
          const opacity = 0.8 * (1 - progress);
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(node.x, node.y, pulseR, 0, Math.PI * 2);
          ctx.stroke();
        } else if (event.type === 'flash') {
          const opacity = 0.6 * (1 - progress);
          const blink = Math.sin(elapsed / 50) * 0.5 + 0.5;
          ctx.fillStyle = `rgba(255, 0, 0, ${opacity * blink})`;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(255, 68, 68, ${1 - progress})`;
          ctx.font = 'bold 14px Courier New';
          ctx.textAlign = 'center';
          ctx.fillText('拦截', node.x, node.y - r - 24);
        }
      }

      clearExpiredAnimations(now);

      ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
      ctx.font = '12px Courier New';
      ctx.textAlign = 'left';
      ctx.fillText(
        `进度: ${capturedCount}/${totalNodes}  时间: ${formatTime(useGameStore.getState().elapsedTime)}`,
        16,
        height - 16
      );
    },
    [
      nodes,
      entryNodeId,
      targetNodeId,
      animationEvents,
      capturedCount,
      totalNodes,
      getNodeColor,
      getNodeRadius,
      darkenColor,
      getEffectiveDefense,
      clearExpiredAnimations,
    ]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);

      const node = getNodeAtPosition(x, y);
      if (!node) return;

      if (node.status === 'locked') {
        const result = hackNode(node.id);
        if (result === 'success') {
          audioRef.current.playSuccess();
        } else if (result === 'failure') {
          audioRef.current.playFailure();
        }
      }
    },
    [getNodeAtPosition, hackNode]
  );

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = container.clientWidth;
    let height = container.clientHeight;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    ctx.scale(dpr, dpr);

    initCodeStreams(width, height);
    generateNetwork(width, height);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth === width && newHeight === height) continue;
        width = newWidth;
        height = newHeight;
        const newDpr = window.devicePixelRatio || 1;
        canvas.width = width * newDpr;
        canvas.height = height * newDpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(newDpr, newDpr);
        initCodeStreams(width, height);
      }
    });

    resizeObserver.observe(container);

    const startTime = performance.now();
    lastTickRef.current = startTime;
    lastFragmentRef.current = startTime;

    const loop = (now: number) => {
      draw(ctx, width, height, now);

      if (now - lastTickRef.current >= 1000) {
        tickTime();
        lastTickRef.current = now;
        const state = useGameStore.getState();
        const progress = state.totalNodes > 0 ? state.capturedCount / state.totalNodes : 0;
        audioRef.current.updateProgress(progress);

        if (state.capturedCount === 1 && !bgStartedRef.current) {
          audioRef.current.startBackground();
          bgStartedRef.current = true;
        }
      }

      if (now - lastFragmentRef.current >= 10000) {
        regenerateFragments();
        lastFragmentRef.current = now;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(rafRef.current);
      audioRef.current.stopBackground();
    };
  }, [draw, generateNetwork, initCodeStreams, tickTime, regenerateFragments]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}
