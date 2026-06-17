import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useGameStore, useNodesInRange } from '../store';
import type { StarNode, Fleet, ParticleFlow } from '../types';
import { NODE_RADIUS } from '../types';

interface StarParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  size: number;
}

const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;

const GameBoard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<StarParticle[]>([]);
  const animationRef = useRef<number>(0);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const nodes = useGameStore((state) => state.nodes);
  const fleets = useGameStore((state) => state.fleets);
  const selectedNodeId = useGameStore((state) => state.selectedNodeId);
  const selectedFleetId = useGameStore((state) => state.selectedFleetId);
  const currentPhase = useGameStore((state) => state.currentPhase);
  const particleFlows = useGameStore((state) => state.particleFlows);
  const selectNode = useGameStore((state) => state.selectNode);
  const moveFleet = useGameStore((state) => state.moveFleet);
  const removeExpiredParticles = useGameStore((state) => state.removeExpiredParticles);

  const selectedFleet = useMemo(
    () => fleets.find((f) => f.id === selectedFleetId),
    [fleets, selectedFleetId]
  );

  const moveRange = useMemo(() => {
    if (!selectedFleet || selectedFleet.owner !== 'player') return 0;
    if (selectedFleet.ships.length === 0) return 0;
    return Math.min(...selectedFleet.ships.map((s) => s.move));
  }, [selectedFleet]);

  const nodesInRange = useNodesInRange(
    selectedFleet ? selectedFleet.nodeId : null,
    moveRange
  );

  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;

    const scaleX = containerWidth / MAP_WIDTH;
    const scaleY = containerHeight / MAP_HEIGHT;
    const newScale = Math.min(scaleX, scaleY, 1.2);

    const scaledWidth = MAP_WIDTH * newScale;
    const scaledHeight = MAP_HEIGHT * newScale;

    setScale(newScale);
    setOffset({
      x: (containerWidth - scaledWidth) / 2,
      y: (containerHeight - scaledHeight) / 2,
    });
    setCanvasSize({ width: containerWidth, height: containerHeight });
  }, []);

  useEffect(() => {
    const particles: StarParticle[] = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * MAP_WIDTH,
        y: Math.random() * MAP_HEIGHT,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        opacity: 0.3 + Math.random() * 0.3,
        size: 1 + Math.random() * 2,
      });
    }
    particlesRef.current = particles;
  }, []);

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      updateScale();
    });
    window.addEventListener('resize', updateScale);
    return () => {
      cancelAnimationFrame(timer);
      window.removeEventListener('resize', updateScale);
    };
  }, [updateScale]);

  const screenToMap = useCallback(
    (screenX: number, screenY: number) => {
      return {
        x: (screenX - offset.x) / scale,
        y: (screenY - offset.y) / scale,
      };
    },
    [offset, scale]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (time: number) => {
      const deltaTime = (time - lastTime) / 1000;
      lastTime = time;

      const { width, height } = canvasSize;
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(offset.x, offset.y);
      ctx.scale(scale, scale);

      const particles = particlesRef.current;
      for (const p of particles) {
        p.x += p.vx * deltaTime * 60;
        p.y += p.vy * deltaTime * 60;
        if (p.x < 0) p.x = MAP_WIDTH;
        if (p.x > MAP_WIDTH) p.x = 0;
        if (p.y < 0) p.y = MAP_HEIGHT;
        if (p.y > MAP_HEIGHT) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();
      }

      for (const node of nodes) {
        for (const connId of node.connections) {
          if (node.id < connId) continue;
          const targetNode = nodes.find((n) => n.id === connId);
          if (!targetNode) continue;

          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(targetNode.x, targetNode.y);
          ctx.strokeStyle = '#4A4A6A';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      const now = Date.now();
      for (const flow of particleFlows) {
        const fromNode = nodes.find((n) => n.id === flow.fromNodeId);
        const toNode = nodes.find((n) => n.id === flow.toNodeId);
        if (!fromNode || !toNode) continue;

        const elapsed = now - flow.startTime;
        const progress = Math.min(elapsed / flow.duration, 1);

        const x = fromNode.x + (toNode.x - fromNode.x) * progress;
        const y = fromNode.y + (toNode.y - fromNode.y) * progress;

        for (let i = 0; i < 5; i++) {
          const offsetDist = (i - 2) * 6;
          const dx = toNode.x - fromNode.x;
          const dy = toNode.y - fromNode.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const perpX = -dy / len;
          const perpY = dx / len;

          ctx.beginPath();
          ctx.arc(x + perpX * offsetDist, y + perpY * offsetDist, 4, 0, Math.PI * 2);
          ctx.fillStyle = flow.color;
          ctx.globalAlpha = 1 - Math.abs(i - 2) * 0.2;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      for (const node of nodes) {
        const isSelected = node.id === selectedNodeId;
        const isInRange = nodesInRange.includes(node.id);
        const isResource = node.type === 'resource';
        const isPlayerMothership = node.type === 'mothership_player';
        const isAiMothership = node.type === 'mothership_ai';

        if (isResource) {
          const pulse = (Math.sin(time / 500) + 1) / 2;
          const glowRadius = NODE_RADIUS + 10 + pulse * 15;

          const gradient = ctx.createRadialGradient(
            node.x, node.y, NODE_RADIUS,
            node.x, node.y, glowRadius
          );
          gradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
          gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

          ctx.beginPath();
          ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        if (isSelected) {
          const pulse = (Math.sin(time / 250) + 1) / 2;
          const nodeScale = 1.05 + pulse * 0.05;

          ctx.beginPath();
          ctx.arc(node.x, node.y, NODE_RADIUS * nodeScale, 0, Math.PI * 2);
          ctx.fillStyle = '#2D2D44';
          ctx.fill();
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 3;
          ctx.stroke();
        } else if (isInRange) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, NODE_RADIUS + 6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(107, 203, 119, 0.15)';
          ctx.fill();
          ctx.strokeStyle = '#6BCB77';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          ctx.beginPath();
          ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = '#2D2D44';
          ctx.fill();
          ctx.strokeStyle = '#4ECDC4';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        if (isPlayerMothership) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, NODE_RADIUS - 10, 0, Math.PI * 2);
          ctx.strokeStyle = '#6BCB77';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        if (isAiMothership) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, NODE_RADIUS - 10, 0, Math.PI * 2);
          ctx.strokeStyle = '#FF6B6B';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        const fleetsAtNode = fleets.filter((f) => f.nodeId === node.id && f.ships.length > 0);
        if (fleetsAtNode.length > 0) {
          const totalFleets = fleetsAtNode.length;
          const spacing = 22;
          const startY = node.y - ((totalFleets - 1) * spacing) / 2;

          for (let i = 0; i < fleetsAtNode.length; i++) {
            const fleet = fleetsAtNode[i];
            const color = fleet.owner === 'player' ? '#6BCB77' : '#FF6B6B';
            const shipCount = fleet.ships.length;
            const yPos = startY + i * spacing;

            ctx.beginPath();
            ctx.arc(node.x, yPos, 11, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(shipCount), node.x, yPos);
          }
        }
      }

      ctx.restore();

      removeExpiredParticles();
      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [
    nodes,
    fleets,
    selectedNodeId,
    nodesInRange,
    particleFlows,
    canvasSize,
    scale,
    offset,
    removeExpiredParticles,
  ]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || currentPhase !== 'player') return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const screenX = (e.clientX - rect.left) * scaleX;
    const screenY = (e.clientY - rect.top) * scaleY;

    const mapPos = screenToMap(screenX, screenY);

    for (const node of nodes) {
      const dx = mapPos.x - node.x;
      const dy = mapPos.y - node.y;
      if (Math.sqrt(dx * dx + dy * dy) <= NODE_RADIUS) {
        handleNodeClick(node);
        return;
      }
    }

    selectNode(null);
  };

  const handleNodeClick = (node: StarNode) => {
    if (currentPhase !== 'player') return;

    const playerFleetsAtNode = fleets.filter(
      (f) => f.nodeId === node.id && f.owner === 'player' && f.ships.length > 0 && f.ships.some((s) => s.type !== 'mothership')
    );

    if (selectedFleet && nodesInRange.includes(node.id)) {
      moveFleet(selectedFleet.id, node.id);
      return;
    }

    if (playerFleetsAtNode.length > 0) {
      selectNode(node.id);
      useGameStore.getState().selectFleet(playerFleetsAtNode[0].id);
      return;
    }

    selectNode(node.id);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      style={{ minHeight: '400px' }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-pointer"
        style={{ display: 'block' }}
      />
    </div>
  );
};

export default GameBoard;
