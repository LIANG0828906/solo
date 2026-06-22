import { useRef, useEffect, useState, useCallback } from 'react';
import { useBoard } from '@/data/cardStore';
import type { Card, Connection } from '@/data/cardStore';
import {
  drawCard,
  drawConnection,
  getCardSize,
  getCardCenter,
  hitTestCard,
  hitTestConnection,
  CARD_SIZES,
} from './Card';

interface SwimlaneLayout {
  tags: string[];
  cardPositions: Map<string, { x: number; y: number }>;
  laneXs: Map<string, number>;
}

export default function BoardCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const {
    state,
    moveCard,
    setTargetPosition,
    selectCard,
    editCard,
    deleteConnection,
    addConnection,
    setZoom,
    setPan,
    pushHistory,
    getCardsByTag,
    swimlaneView,
  } = useBoard();

  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [cardStartX, setCardStartX] = useState(0);
  const [cardStartY, setCardStartY] = useState(0);
  const [panStartX, setPanStartX] = useState(0);
  const [panStartY, setPanStartY] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectFromId, setConnectFromId] = useState<string | null>(null);
  const [connectMousePos, setConnectMousePos] = useState({ x: 0, y: 0 });
  const [swimlaneLayout, setSwimlaneLayout] = useState<SwimlaneLayout | null>(null);
  const [animatingCards, setAnimatingCards] = useState<Set<string>>(new Set());

  const computeSwimlaneLayout = useCallback(() => {
    const cardsByTag = getCardsByTag();
    const tags = Array.from(cardsByTag.keys()).sort();
    const cardPositions = new Map<string, { x: number; y: number }>();
    const laneXs = new Map<string, number>();

    const laneWidth = 320;
    const startX = 100;
    const startY = 100;
    const cardGapY = 20;

    tags.forEach((tag, tagIndex) => {
      const laneX = startX + tagIndex * laneWidth;
      laneXs.set(tag, laneX);

      const cards = cardsByTag.get(tag) || [];
      const sortedCards = [...cards].sort((a, b) => a.createdAt - b.createdAt);

      let currentY = startY;
      sortedCards.forEach((card) => {
        const size = getCardSize(card);
        const cardX = laneX + (laneWidth - size.width) / 2;
        cardPositions.set(card.id, { x: cardX, y: currentY });
        currentY += size.height + cardGapY;
      });
    });

    return { tags, cardPositions, laneXs };
  }, [getCardsByTag]);

  useEffect(() => {
    if (state.swimlaneView) {
      const layout = computeSwimlaneLayout();
      setSwimlaneLayout(layout);

      const animating = new Set<string>();
      layout.cardPositions.forEach((pos, cardId) => {
        setTargetPosition(cardId, pos.x, pos.y);
        animating.add(cardId);
      });
      setAnimatingCards(animating);
    } else {
      setAnimatingCards(new Set());
    }
  }, [state.swimlaneView, state.cards, computeSwimlaneLayout, setTargetPosition]);

  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const x = (screenX - rect.left - state.panX) / state.zoom;
      const y = (screenY - rect.top - state.panY) / state.zoom;
      return { x, y };
    },
    [state.panX, state.panY, state.zoom]
  );

  const getCardAtPosition = useCallback(
    (worldX: number, worldY: number): Card | null => {
      const sortedCards = [...state.cards].reverse();
      for (const card of sortedCards) {
        if (hitTestCard(card, card.x, card.y, worldX, worldY)) {
          return card;
        }
      }
      return null;
    },
    [state.cards]
  );

  const getConnectionAtPosition = useCallback(
    (worldX: number, worldY: number): Connection | null => {
      for (const conn of state.connections) {
        const fromCard = state.cards.find((c) => c.id === conn.fromCardId);
        const toCard = state.cards.find((c) => c.id === conn.toCardId);
        if (!fromCard || !toCard) continue;

        const fromCenter = getCardCenter(fromCard, fromCard.x, fromCard.y);
        const toCenter = getCardCenter(toCard, toCard.x, toCard.y);

        if (hitTestConnection(fromCenter.x, fromCenter.y, toCenter.x, toCenter.y, worldX, worldY, 8)) {
          return conn;
        }
      }
      return null;
    },
    [state.connections, state.cards]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = (currentTime: number) => {
      const deltaTime = lastTimeRef.current ? (currentTime - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = currentTime;

      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      let needsAnimationFrame = false;

      state.cards.forEach((card) => {
        if (card.id === draggedCardId) return;

        const dx = card.targetX - card.x;
        const dy = card.targetY - card.y;

        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          const springStrength = 8;
          const damping = 0.85;
          const velocity = 1;

          const newX = card.x + dx * springStrength * deltaTime * velocity;
          const newY = card.y + dy * springStrength * deltaTime * velocity;

          card.x = newX;
          card.y = newY;
          needsAnimationFrame = true;
        } else if (animatingCards.has(card.id)) {
          card.x = card.targetX;
          card.y = card.targetY;
          setAnimatingCards((prev) => {
            const next = new Set(prev);
            next.delete(card.id);
            return next;
          });
        }
      });

      ctx.clearRect(0, 0, width, height);

      drawGrid(ctx, width, height, state.zoom, state.panX, state.panY);

      if (state.swimlaneView && swimlaneLayout) {
        drawSwimlanes(ctx, width, height, swimlaneLayout, state.zoom, state.panX, state.panY);
      }

      ctx.save();
      ctx.translate(state.panX, state.panY);
      ctx.scale(state.zoom, state.zoom);

      state.connections.forEach((conn) => {
        const fromCard = state.cards.find((c) => c.id === conn.fromCardId);
        const toCard = state.cards.find((c) => c.id === conn.toCardId);
        if (!fromCard || !toCard) return;

        const fromCenter = getCardCenter(fromCard, fromCard.x, fromCard.y);
        const toCenter = getCardCenter(toCard, toCard.x, toCard.y);
        const isHovered = hoveredConnectionId === conn.id;

        drawConnection(ctx, fromCenter.x, fromCenter.y, toCenter.x, toCenter.y, isHovered);
      });

      if (isConnecting && connectFromId) {
        const fromCard = state.cards.find((c) => c.id === connectFromId);
        if (fromCard) {
          const fromCenter = getCardCenter(fromCard, fromCard.x, fromCard.y);
          const worldPos = screenToWorld(connectMousePos.x, connectMousePos.y);
          ctx.save();
          ctx.strokeStyle = '#A277D1';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.lineCap = 'round';
          ctx.beginPath();
          const dx = worldPos.x - fromCenter.x;
          const controlOffset = Math.min(Math.abs(dx) * 0.5, 150);
          ctx.moveTo(fromCenter.x, fromCenter.y);
          ctx.bezierCurveTo(
            fromCenter.x + controlOffset,
            fromCenter.y,
            worldPos.x - controlOffset,
            worldPos.y,
            worldPos.x,
            worldPos.y
          );
          ctx.stroke();
          ctx.restore();
        }
      }

      const sortedCards = [...state.cards].sort((a, b) => {
        if (a.id === state.selectedCardId) return 1;
        if (b.id === state.selectedCardId) return -1;
        return a.createdAt - b.createdAt;
      });

      sortedCards.forEach((card) => {
        const isHovered = hoveredCardId === card.id;
        const isSelected = state.selectedCardId === card.id;
        drawCard(ctx, card, card.x, card.y, isHovered, isSelected);
      });

      ctx.restore();

      if (needsAnimationFrame || isDraggingCanvas || draggedCardId || isConnecting) {
        animationRef.current = requestAnimationFrame(render);
      } else {
        animationRef.current = requestAnimationFrame(render);
      }
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    state.cards,
    state.connections,
    state.zoom,
    state.panX,
    state.panY,
    state.selectedCardId,
    state.swimlaneView,
    hoveredCardId,
    hoveredConnectionId,
    draggedCardId,
    isDraggingCanvas,
    isConnecting,
    connectFromId,
    connectMousePos,
    swimlaneLayout,
    animatingCards,
    screenToWorld,
  ]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;

    const worldPos = screenToWorld(e.clientX, e.clientY);
    const card = getCardAtPosition(worldPos.x, worldPos.y);
    const connection = getConnectionAtPosition(worldPos.x, worldPos.y);

    if (e.shiftKey && card) {
      setIsConnecting(true);
      setConnectFromId(card.id);
      setConnectMousePos({ x: e.clientX, y: e.clientY });
      return;
    }

    if (card) {
      setDraggedCardId(card.id);
      selectCard(card.id);
      setDragStartX(e.clientX);
      setDragStartY(e.clientY);
      setCardStartX(card.x);
      setCardStartY(card.y);
    } else if (connection) {
      deleteConnection(connection.id);
    } else {
      setIsDraggingCanvas(true);
      selectCard(null);
      setPanStartX(e.clientX - state.panX);
      setPanStartY(e.clientY - state.panY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);

    if (isConnecting) {
      setConnectMousePos({ x: e.clientX, y: e.clientY });
      return;
    }

    if (draggedCardId) {
      const dx = (e.clientX - dragStartX) / state.zoom;
      const dy = (e.clientY - dragStartY) / state.zoom;
      moveCard(draggedCardId, cardStartX + dx, cardStartY + dy);
    } else if (isDraggingCanvas) {
      setPan(e.clientX - panStartX, e.clientY - panStartY);
    } else {
      const card = getCardAtPosition(worldPos.x, worldPos.y);
      const connection = getConnectionAtPosition(worldPos.x, worldPos.y);

      setHoveredCardId(card ? card.id : null);
      setHoveredConnectionId(connection ? connection.id : null);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isConnecting && connectFromId) {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      const targetCard = getCardAtPosition(worldPos.x, worldPos.y);
      if (targetCard && targetCard.id !== connectFromId) {
        addConnection(connectFromId, targetCard.id);
      }
      setIsConnecting(false);
      setConnectFromId(null);
      return;
    }

    if (draggedCardId) {
      pushHistory();
      setDraggedCardId(null);
    }

    if (isDraggingCanvas) {
      setIsDraggingCanvas(false);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);
    const card = getCardAtPosition(worldPos.x, worldPos.y);
    if (card) {
      editCard(card.id);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(3, Math.max(0.3, state.zoom * zoomFactor));

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - state.panX) / state.zoom;
    const worldY = (mouseY - state.panY) / state.zoom;

    const newPanX = mouseX - worldX * newZoom;
    const newPanY = mouseY - worldY * newZoom;

    setZoom(newZoom);
    setPan(newPanX, newPanY);
  };

  return (
    <div ref={containerRef} className="canvas-container">
      <canvas
        ref={canvasRef}
        className="board-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
      />
    </div>
  );
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  zoom: number,
  panX: number,
  panY: number
) {
  const gridSize = 30;
  const dotSize = 2;
  const opacity = 0.3;

  ctx.fillStyle = `rgba(200, 195, 220, ${opacity})`;

  const startX = -panX % (gridSize * zoom);
  const startY = -panY % (gridSize * zoom);

  for (let x = startX; x < width; x += gridSize * zoom) {
    for (let y = startY; y < height; y += gridSize * zoom) {
      ctx.beginPath();
      ctx.arc(x, y, dotSize * Math.min(zoom, 1), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawSwimlanes(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  layout: SwimlaneLayout,
  zoom: number,
  panX: number,
  panY: number
) {
  const laneWidth = 320;
  const startX = 100;

  ctx.save();

  layout.tags.forEach((tag, index) => {
    const laneX = startX + index * laneWidth;
    const screenX = laneX * zoom + panX;

    ctx.fillStyle = 'rgba(60, 53, 102, 0.3)';
    ctx.fillRect(screenX - 10, 0, laneWidth, height);

    ctx.strokeStyle = '#3C3566';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 4]);

    if (index > 0) {
      ctx.beginPath();
      ctx.moveTo(screenX - 20, 0);
      ctx.lineTo(screenX - 20, height);
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.fillStyle = '#D3CDE0';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(tag, screenX, 20);
  });

  ctx.restore();
}
