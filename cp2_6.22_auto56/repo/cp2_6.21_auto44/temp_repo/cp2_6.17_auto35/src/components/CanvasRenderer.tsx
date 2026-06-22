import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useExhibitionStore } from '../store/useExhibitionStore';
import { ArtifactCard } from './ArtifactCard';
import { TextCard } from './TextCard';

export const CanvasRenderer: React.FC = () => {
  const {
    artifacts,
    cards,
    connections,
    bindings,
    bindingCardId,
    isPreviewMode,
    scrollY,
    setScrollY,
    setSelectedArtifact,
    setSelectedCard,
    setContextMenu,
    isConnectingMode,
    connectingFromId,
    connectingFromType,
    setConnectingMode,
    isBindingMode,
    setBindingMode,
  } = useExhibitionStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 2000 });
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const getEntityCenter = useCallback((id: string, type: 'artifact' | 'card') => {
    if (type === 'artifact') {
      const artifact = artifacts.find(a => a.id === id);
      if (artifact) {
        return {
          x: artifact.x + artifact.width / 2,
          y: artifact.y + artifact.height / 2,
        };
      }
    } else {
      const card = cards.find(c => c.id === id);
      if (card) {
        const cardHeight = 120;
        return {
          x: card.x + card.width / 2,
          y: card.y + cardHeight / 2,
        };
      }
    }
    return { x: 0, y: 0 };
  }, [artifacts, cards]);

  const getEntityBounds = useCallback((id: string, type: 'artifact' | 'card') => {
    if (type === 'artifact') {
      const artifact = artifacts.find(a => a.id === id);
      if (artifact) {
        return {
          x: artifact.x,
          y: artifact.y,
          width: artifact.width,
          height: artifact.height,
        };
      }
    } else {
      const card = cards.find(c => c.id === id);
      if (card) {
        return {
          x: card.x,
          y: card.y,
          width: card.width,
          height: 120,
        };
      }
    }
    return { x: 0, y: 0, width: 0, height: 0 };
  }, [artifacts, cards]);

  const getPointOnBezier = useCallback((
    t: number,
    p0x: number, p0y: number,
    p1x: number, p1y: number,
    p2x: number, p2y: number,
    p3x: number, p3y: number
  ) => {
    const mt = 1 - t;
    return {
      x: mt * mt * mt * p0x + 3 * mt * mt * t * p1x + 3 * mt * t * t * p2x + t * t * t * p3x,
      y: mt * mt * mt * p0y + 3 * mt * mt * t * p1y + 3 * mt * t * t * p2y + t * t * t * p3y,
    };
  }, []);

  const getClosestPointOnRect = useCallback((
    px: number, py: number,
    rx: number, ry: number, rw: number, rh: number
  ) => {
    const cx = Math.max(rx, Math.min(px, rx + rw));
    const cy = Math.max(ry, Math.min(py, ry + rh));
    return { x: cx, y: cy };
  }, []);

  const distancePointToRect = useCallback((
    px: number, py: number,
    rx: number, ry: number, rw: number, rh: number
  ) => {
    const closest = getClosestPointOnRect(px, py, rx, ry, rw, rh);
    const dx = px - closest.x;
    const dy = py - closest.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, [getClosestPointOnRect]);

  const computeBezierPath = useCallback((
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    otherBounds: Array<{ x: number; y: number; width: number; height: number }>
  ) => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    
    let offsetX = -dy / dist * 60;
    let offsetY = dx / dist * 60;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      offsetX = 0;
      offsetY = dy > 0 ? -60 : 60;
    } else {
      offsetX = dx > 0 ? -60 : 60;
      offsetY = 0;
    }

    let cp1x = midX + offsetX * 0.5;
    let cp1y = midY + offsetY * 0.5;
    let cp2x = midX + offsetX;
    let cp2y = midY + offsetY;

    const MIN_CLEARANCE = 40;
    const MAX_ITERATIONS = 5;

    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      let maxPushX = 0;
      let maxPushY = 0;
      let hasCollision = false;

      for (let t = 0; t <= 1; t += 0.05) {
        const point = getPointOnBezier(t, fromX, fromY, cp1x, cp1y, cp2x, cp2y, toX, toY);

        for (const bounds of otherBounds) {
          const dist = distancePointToRect(
            point.x, point.y,
            bounds.x, bounds.y, bounds.width, bounds.height
          );

          if (dist < MIN_CLEARANCE) {
            hasCollision = true;

            const closest = getClosestPointOnRect(
              point.x, point.y,
              bounds.x, bounds.y, bounds.width, bounds.height
            );

            const normalX = point.x - closest.x;
            const normalY = point.y - closest.y;
            const normalLen = Math.sqrt(normalX * normalX + normalY * normalY);

            if (normalLen > 0) {
              const nx = normalX / normalLen;
              const ny = normalY / normalLen;

              const pushAmount = MIN_CLEARANCE - dist;

              if (t <= 0.5) {
                const weight = 1 - t * 2;
                maxPushX += nx * pushAmount * weight;
                maxPushY += ny * pushAmount * weight;
              } else {
                const weight = (t - 0.5) * 2;
                maxPushX += nx * pushAmount * weight;
                maxPushY += ny * pushAmount * weight;
              }
            }
          }
        }
      }

      if (!hasCollision) break;

      const pushMag = Math.sqrt(maxPushX * maxPushX + maxPushY * maxPushY);
      if (pushMag < 0.1) break;

      const scale = Math.min(pushMag, 30) / pushMag;
      cp1x += maxPushX * scale * 0.5;
      cp1y += maxPushY * scale * 0.5;
      cp2x += maxPushX * scale;
      cp2y += maxPushY * scale;
    }

    return { cp1x, cp1y, cp2x, cp2y };
  }, [getPointOnBezier, getClosestPointOnRect, distancePointToRect]);

  const drawConnections = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    bindings.forEach(binding => {
      const artifact = artifacts.find(a => a.id === binding.artifactId);
      const card = cards.find(c => c.id === binding.cardId);
      if (!artifact || !card) return;
      
      const fromX = artifact.x + artifact.width / 2;
      const fromY = artifact.y + artifact.height / 2;
      const toX = card.x + card.width / 2;
      const toY = card.y + 60;
      
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.setLineDash([4, 4]);
      ctx.lineTo(toX, toY);
      ctx.strokeStyle = binding.color;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    });
    
    const allBounds = [
      ...artifacts.map(a => ({ x: a.x, y: a.y, width: a.width, height: a.height })),
      ...cards.map(c => ({ x: c.x, y: c.y, width: c.width, height: 120 })),
    ];
    
    connections.forEach(conn => {
      const fromCenter = getEntityCenter(conn.fromId, conn.fromType);
      const toCenter = getEntityCenter(conn.toId, conn.toType);
      
      const otherBounds = allBounds.filter(b => {
        const fromBounds = getEntityBounds(conn.fromId, conn.fromType);
        const toBounds = getEntityBounds(conn.toId, conn.toType);
        return (
          (b.x !== fromBounds.x || b.y !== fromBounds.y) &&
          (b.x !== toBounds.x || b.y !== toBounds.y)
        );
      });
      
      const path = computeBezierPath(
        fromCenter.x,
        fromCenter.y,
        toCenter.x,
        toCenter.y,
        otherBounds
      );
      
      const isHovered = hoveredConnectionId === conn.id;
      const lineWidth = isHovered ? 3 : 2;
      const opacity = isHovered ? 0.9 : 0.6;
      
      ctx.beginPath();
      ctx.moveTo(fromCenter.x, fromCenter.y);
      ctx.bezierCurveTo(path.cp1x, path.cp1y, path.cp2x, path.cp2y, toCenter.x, toCenter.y);
      ctx.strokeStyle = `rgba(196, 168, 130, ${opacity})`;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
      
      const angle = Math.atan2(
        toCenter.y - path.cp2y,
        toCenter.x - path.cp2x
      );
      const arrowSize = 10;
      
      ctx.beginPath();
      ctx.moveTo(toCenter.x, toCenter.y);
      ctx.lineTo(
        toCenter.x - arrowSize * Math.cos(angle - Math.PI / 6),
        toCenter.y - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        toCenter.x - arrowSize * Math.cos(angle + Math.PI / 6),
        toCenter.y - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = `rgba(196, 168, 130, ${opacity})`;
      ctx.fill();
    });
    
    if (isConnectingMode && connectingFromId && connectingFromType) {
      const fromCenter = getEntityCenter(connectingFromId, connectingFromType);
      
      ctx.beginPath();
      ctx.moveTo(fromCenter.x, fromCenter.y);
      ctx.setLineDash([5, 5]);
      ctx.lineTo(mousePos.x, mousePos.y);
      ctx.strokeStyle = 'rgba(196, 168, 130, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [artifacts, cards, connections, bindings, hoveredConnectionId, isConnectingMode, connectingFromId, connectingFromType, mousePos, getEntityCenter, getEntityBounds, computeBezierPath]);

  useEffect(() => {
    drawConnections();
  }, [drawConnections]);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (!containerRef.current) return;
      
      const maxY = Math.max(
        ...artifacts.map(a => a.y + a.height),
        ...cards.map(c => c.y + 150),
        800
      );
      
      const width = Math.max(containerRef.current.clientWidth, 1200);
      const height = maxY + 200;
      
      setCanvasSize({ width, height });
    };
    
    updateCanvasSize();
    
    const timer = setInterval(updateCanvasSize, 500);
    return () => clearInterval(timer);
  }, [artifacts, cards]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    drawConnections();
  }, [canvasSize, drawConnections]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollY(e.currentTarget.scrollTop);
  }, [setScrollY]);

  const handleCanvasClick = useCallback(() => {
    setSelectedArtifact(null);
    setSelectedCard(null);
    setContextMenu({ visible: false });
    
    if (isConnectingMode) {
      setConnectingMode(false);
    }
    if (isBindingMode) {
      setBindingMode(false);
    }
  }, [setSelectedArtifact, setSelectedCard, setContextMenu, isConnectingMode, setConnectingMode, isBindingMode, setBindingMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const container = containerRef.current;
    const scrollTop = container?.scrollTop || 0;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top + scrollTop;
    
    setMousePos({ x, y });
    
    let foundConnection: string | null = null;
    
    for (const conn of connections) {
      const fromCenter = getEntityCenter(conn.fromId, conn.fromType);
      const toCenter = getEntityCenter(conn.toId, conn.toType);
      
      const allBounds = [
        ...artifacts.map(a => ({ x: a.x, y: a.y, width: a.width, height: a.height })),
        ...cards.map(c => ({ x: c.x, y: c.y, width: c.width, height: 120 })),
      ];
      
      const otherBounds = allBounds.filter(b => {
        const fromBounds = getEntityBounds(conn.fromId, conn.fromType);
        const toBounds = getEntityBounds(conn.toId, conn.toType);
        return (
          (b.x !== fromBounds.x || b.y !== fromBounds.y) &&
          (b.x !== toBounds.x || b.y !== toBounds.y)
        );
      });
      
      const path = computeBezierPath(
        fromCenter.x,
        fromCenter.y,
        toCenter.x,
        toCenter.y,
        otherBounds
      );
      
      for (let t = 0; t <= 1; t += 0.05) {
        const point = getPointOnBezier(
          t,
          fromCenter.x, fromCenter.y,
          path.cp1x, path.cp1y,
          path.cp2x, path.cp2y,
          toCenter.x, toCenter.y
        );
        
        const dist = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
        if (dist < 10) {
          foundConnection = conn.id;
          break;
        }
      }
      
      if (foundConnection) break;
    }
    
    setHoveredConnectionId(foundConnection);
  }, [connections, artifacts, cards, getEntityCenter, getEntityBounds, computeBezierPath, getPointOnBezier]);

  const cursorStyle = isConnectingMode || isBindingMode ? 'crosshair' : 'default';

  return (
    <div
      ref={containerRef}
      className="canvas-container"
      onScroll={handleScroll}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 64px)',
        marginTop: '64px',
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: '#F9F6F0',
        cursor: cursorStyle,
      }}
    >
      {isBindingMode && (
        <div
          className="binding-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(196, 168, 130, 0.08)',
            zIndex: 5,
            pointerEvents: 'none',
          }}
        />
      )}
      <div
        style={{
          position: 'relative',
          width: '100%',
          minWidth: '1200px',
          height: canvasSize.height,
          minHeight: '100%',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        
        {artifacts.map(artifact => (
          <ArtifactCard
            key={artifact.id}
            artifact={artifact}
            isPreview={isPreviewMode}
            isBindingModeActive={isBindingMode}
            onPreviewClick={() => setSelectedArtifact(artifact.id)}
          />
        ))}
        
        {cards.map(card => (
          <TextCard key={card.id} card={card} isPreview={isPreviewMode} />
        ))}
      </div>
    </div>
  );
};
