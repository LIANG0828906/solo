import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useExhibitionStore } from '../store/useExhibitionStore';
import { ArtifactCard } from './ArtifactCard';
import { TextCard } from './TextCard';

export const CanvasRenderer: React.FC = () => {
  const {
    artifacts,
    cards,
    connections,
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

  const computeBezierPath = useCallback((
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    otherBounds: Array<{ x: number; y: number; width: number; height: number }>
  ) => {
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    let offsetX = -dy / dist * 60;
    let offsetY = dx / dist * 60;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      offsetX = 0;
      offsetY = dy > 0 ? -60 : 60;
    } else {
      offsetX = dx > 0 ? -60 : 60;
      offsetY = 0;
    }
    
    const avoidance = 40;
    
    for (const bounds of otherBounds) {
      const bx = bounds.x + bounds.width / 2;
      const by = bounds.y + bounds.height / 2;
      
      const lineMinX = Math.min(fromX, toX);
      const lineMaxX = Math.max(fromX, toX);
      const lineMinY = Math.min(fromY, toY);
      const lineMaxY = Math.max(fromY, toY);
      
      if (
        bx > lineMinX - bounds.width / 2 &&
        bx < lineMaxX + bounds.width / 2 &&
        by > lineMinY - bounds.height / 2 &&
        by < lineMaxY + bounds.height / 2
      ) {
        const pushX = bx > midX ? avoidance : -avoidance;
        const pushY = by > midY ? avoidance : -avoidance;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          offsetY += pushY;
        } else {
          offsetX += pushX;
        }
      }
    }
    
    return {
      cp1x: midX + offsetX * 0.5,
      cp1y: midY + offsetY * 0.5,
      cp2x: midX + offsetX,
      cp2y: midY + offsetY,
    };
  }, []);

  const drawConnections = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
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
  }, [artifacts, cards, connections, hoveredConnectionId, isConnectingMode, connectingFromId, connectingFromType, mousePos, getEntityCenter, getEntityBounds, computeBezierPath]);

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
        const px = Math.pow(1 - t, 3) * fromCenter.x +
          3 * Math.pow(1 - t, 2) * t * path.cp1x +
          3 * (1 - t) * t * t * path.cp2x +
          Math.pow(t, 3) * toCenter.x;
        
        const py = Math.pow(1 - t, 3) * fromCenter.y +
          3 * Math.pow(1 - t, 2) * t * path.cp1y +
          3 * (1 - t) * t * t * path.cp2y +
          Math.pow(t, 3) * toCenter.y;
        
        const dist = Math.sqrt((px - x) ** 2 + (py - y) ** 2);
        if (dist < 10) {
          foundConnection = conn.id;
          break;
        }
      }
      
      if (foundConnection) break;
    }
    
    setHoveredConnectionId(foundConnection);
  }, [connections, artifacts, cards, getEntityCenter, getEntityBounds, computeBezierPath]);

  const cursorStyle = isConnectingMode ? 'crosshair' : isBindingMode ? 'pointer' : 'default';

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
          <ArtifactCard key={artifact.id} artifact={artifact} isPreview={isPreviewMode} />
        ))}
        
        {cards.map(card => (
          <TextCard key={card.id} card={card} isPreview={isPreviewMode} />
        ))}
      </div>
    </div>
  );
};
