import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { Card, Connection, CardTag, ConnectionType } from '../types';
import { highlightText, getTagColor, getConnectionColor, getPriorityColor, createBezierPath } from '../utils';
import { CONNECTION_TYPES } from '../types';
import styles from './Canvas.module.css';

interface CanvasProps {
  cards: Card[];
  connections: Connection[];
  selectedCardId: string | null;
  highlightedCardId: string | null;
  searchKeyword: string;
  onSelectCard: (id: string) => void;
  onMoveCard: (id: string, position: { x: number; y: number }) => void;
  onCreateConnection: (sourceId: string, targetId: string) => void;
  onUpdateConnection: (id: string, type: ConnectionType) => void;
  onDeleteConnection: (id: string) => void;
}

interface ConnectionPointProps {
  cardId: string;
  side: 'left' | 'right';
  isConnecting: boolean;
  onConnectionStart: (cardId: string, side: 'left' | 'right') => void;
  onConnectionEnd: (cardId: string, side: 'left' | 'right') => void;
}

interface ConnectionLineProps {
  connection: Connection;
  sourceCard: Card | undefined;
  targetCard: Card | undefined;
  onLabelClick: (id: string, event: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  editingId: string | null;
}

interface CardItemProps {
  card: Card;
  isSelected: boolean;
  isHighlighted: boolean;
  searchKeyword: string;
  onSelect: (id: string) => void;
  onMove: (id: string, position: { x: number; y: number }) => void;
  onConnectionStart: (cardId: string, side: 'left' | 'right') => void;
  onConnectionEnd: (cardId: string, side: 'left' | 'right') => void;
  isConnecting: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
}

interface DragItem {
  type: 'CARD' | 'CONNECTION_START';
  id?: string;
  cardId?: string;
}

const CARD_WIDTH = 280;
const CARD_HEIGHT = 180;

const ConnectionPoint: React.FC<ConnectionPointProps> = ({
  cardId,
  side,
  isConnecting,
  onConnectionStart,
  onConnectionEnd,
}) => {
  const [{ isDragging }, drag] = useDrag<DragItem, unknown, { isDragging: boolean }>({
    type: 'CONNECTION_START',
    item: () => {
      onConnectionStart(cardId, side);
      return { type: 'CONNECTION_START', cardId, id: cardId };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop<DragItem, unknown, { isOver: boolean }>({
    accept: 'CONNECTION_START',
    drop: (item) => {
      if (item.cardId !== cardId) {
        onConnectionEnd(cardId, side);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver() && monitor.getItem()?.cardId !== cardId,
    }),
  });

  const pointClass = `${styles.connectionPoint} ${
    side === 'left' ? styles.connectionPointLeft : styles.connectionPointRight
  } ${isConnecting || isOver ? styles.connectionPointActive : ''}`;

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={pointClass}
      style={{ opacity: isDragging ? 0 : 1 }}
    />
  );
};

const ConnectionLine: React.FC<ConnectionLineProps> = ({
  connection,
  sourceCard,
  targetCard,
  onLabelClick,
  onDelete,
  editingId,
}) => {
  if (!sourceCard || !targetCard) return null;

  const color = getConnectionColor(connection.type);
  const x1 = sourceCard.position.x + CARD_WIDTH;
  const y1 = sourceCard.position.y + CARD_HEIGHT / 2;
  const x2 = targetCard.position.x;
  const y2 = targetCard.position.y + CARD_HEIGHT / 2;

  const path = createBezierPath(x1, y1, x2, y2);
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onDelete(connection.id);
  };

  const handleLabelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLabelClick(connection.id, e);
  };

  return (
    <g key={connection.id}>
      <path
        d={path}
        className={`${styles.connectionLine} ${styles.connectionFlow}`}
        stroke={color}
        markerEnd={`url(#arrow-${color.replace('#', '')})`}
        onContextMenu={handleContextMenu}
      />
      <g
        className={styles.connectionLabel}
        transform={`translate(${midX}, ${midY})`}
        onClick={handleLabelClick}
      >
        <rect
          x="-25"
          y="-12"
          width="50"
          height="24"
          fill={color}
          opacity={editingId === connection.id ? 1 : 0.9}
        />
        <text y="1">{connection.type}</text>
      </g>
      <g
        className={styles.connectionDeleteBtn}
        transform={`translate(${midX + 30}, ${midY - 12})`}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(connection.id);
        }}
      >
        <circle r="8" fill="#ef4444" />
        <text x="0" y="3" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
          ×
        </text>
      </g>
    </g>
  );
};

const CardItem: React.FC<CardItemProps> = React.memo(function CardItem({
  card,
  isSelected,
  isHighlighted,
  searchKeyword,
  onSelect,
  onMove,
  onConnectionStart,
  onConnectionEnd,
  isConnecting,
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();

  const [{ isDragging }, drag] = useDrag<DragItem, unknown, { isDragging: boolean }>({
    type: 'CARD',
    item: (monitor) => {
      const rect = cardRef.current?.getBoundingClientRect();
      if (rect && monitor.getClientOffset()) {
        dragOffset.current = {
          x: monitor.getClientOffset()!.x - rect.left,
          y: monitor.getClientOffset()!.y - rect.top,
        };
      }
      return { type: 'CARD', id: card.id };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop<DragItem>({
    accept: 'CARD',
    hover: (item, monitor) => {
      if (item.type !== 'CARD' || item.id !== card.id) return;

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset || !cardRef.current?.parentElement) return;

      const containerRect = cardRef.current.parentElement.getBoundingClientRect();
      const newX = clientOffset.x - containerRect.left - dragOffset.current.x;
      const newY = clientOffset.y - containerRect.top - dragOffset.current.y;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        onMove(card.id, { x: Math.max(0, newX), y: Math.max(0, newY) });
      });
    },
    drop: () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    },
  });

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(card.id);
    },
    [card.id, onSelect]
  );

  const priorityColor = getPriorityColor(card.priority);
  const tagBgColor = getTagColor(card.tags);

  const cardClasses = `${styles.cardItem} ${isSelected ? styles.cardSelected : ''} ${
    isHighlighted ? styles.cardHighlighted : ''
  }`;

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={cardClasses}
      style={{
        left: card.position.x,
        top: card.position.y,
        opacity: isDragging ? 0.5 : 1,
        borderLeft: `3px solid ${tagBgColor.replace('0.3', '0.8')}`,
      }}
      onClick={handleClick}
    >
      <div ref={cardRef}>
        <ConnectionPoint
          cardId={card.id}
          side="left"
          isConnecting={isConnecting}
          onConnectionStart={onConnectionStart}
          onConnectionEnd={onConnectionEnd}
        />
        <ConnectionPoint
          cardId={card.id}
          side="right"
          isConnecting={isConnecting}
          onConnectionStart={onConnectionStart}
          onConnectionEnd={onConnectionEnd}
        />

        <div className={styles.cardHeader}>
          <h3
            className={styles.cardTitle}
            dangerouslySetInnerHTML={{ __html: highlightText(card.title, searchKeyword) }}
          />
          <div
            className={styles.cardPriorityBadge}
            style={{ backgroundColor: priorityColor }}
          >
            {card.priority}
          </div>
        </div>

        <div
          className={styles.cardContent}
          dangerouslySetInnerHTML={{ __html: highlightText(card.content, searchKeyword) }}
        />

        <div className={styles.cardTags}>
          {card.tags.map((tag: CardTag) => (
            <span
              key={tag}
              className={styles.cardTag}
              style={{ backgroundColor: getTagColor([tag]).replace('0.3', '0.6') }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className={styles.cardFooter}>
          <span>{new Date(card.createdAt).toLocaleDateString('zh-CN')}</span>
          <span>{new Date(card.updatedAt).toLocaleDateString('zh-CN')}</span>
        </div>
      </div>
    </div>
  );
});

const Canvas: React.FC<CanvasProps> = ({
  cards,
  connections,
  selectedCardId,
  highlightedCardId,
  searchKeyword,
  onSelectCard,
  onMoveCard,
  onCreateConnection,
  onUpdateConnection,
  onDeleteConnection,
}) => {
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const particleIdRef = useRef(0);

  const handleConnectionStart = useCallback((cardId: string, side: 'left' | 'right') => {
    if (side === 'right') {
      setConnectingFrom(cardId);
    }
  }, []);

  const handleConnectionEnd = useCallback(
    (cardId: string, side: 'left' | 'right') => {
      if (connectingFrom && side === 'left' && connectingFrom !== cardId) {
        onCreateConnection(connectingFrom, cardId);
      }
      setConnectingFrom(null);
    },
    [connectingFrom, onCreateConnection]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current || !connectingFrom) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x, y });

      if (Math.random() > 0.7) {
        const newParticle: Particle = {
          id: particleIdRef.current++,
          x,
          y,
          color: '#3b82f6',
        };
        setParticles((prev) => [...prev.slice(-20), newParticle]);
      }
    },
    [connectingFrom]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setParticles((prev) => prev.filter((_, i) => i > prev.length - 15));
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const handleContainerClick = useCallback(() => {
    setEditingConnectionId(null);
    setConnectingFrom(null);
  }, []);

  const handleConnectionLabelClick = useCallback(
    (id: string, event: React.MouseEvent) => {
      event.stopPropagation();
      setEditingConnectionId(id);
      setDropdownPos({ x: event.clientX, y: event.clientY });
    },
    []
  );

  const handleConnectionTypeChange = useCallback(
    (type: ConnectionType) => {
      if (editingConnectionId) {
        onUpdateConnection(editingConnectionId, type);
        setEditingConnectionId(null);
      }
    },
    [editingConnectionId, onUpdateConnection]
  );

  const handleDeleteConnection = useCallback(
    (id: string) => {
      onDeleteConnection(id);
      setEditingConnectionId(null);
    },
    [onDeleteConnection]
  );

  const getCardById = useCallback(
    (id: string) => cards.find((card) => card.id === id),
    [cards]
  );

  const arrowMarkers = useMemo(() => {
    const colors = [...new Set(connections.map((c) => getConnectionColor(c.type)))];
    return colors.map((color) => (
      <marker
        key={color}
        id={`arrow-${color.replace('#', '')}`}
        markerWidth="10"
        markerHeight="10"
        refX="8"
        refY="5"
        orient="auto"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
      </marker>
    ));
  }, [connections]);

  const connectingCard = connectingFrom ? getCardById(connectingFrom) : null;

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        ref={containerRef}
        className={styles.canvasContainer}
        onMouseMove={handleMouseMove}
        onClick={handleContainerClick}
      >
        <div className={styles.canvasGrid} />

        <svg className={styles.svgLayer}>
          <defs>{arrowMarkers}</defs>

          {connections.map((connection) => (
            <ConnectionLine
              key={connection.id}
              connection={connection}
              sourceCard={getCardById(connection.sourceId)}
              targetCard={getCardById(connection.targetId)}
              onLabelClick={handleConnectionLabelClick}
              onDelete={handleDeleteConnection}
              editingId={editingConnectionId}
            />
          ))}

          {connectingFrom && connectingCard && (
            <path
              d={createBezierPath(
                connectingCard.position.x + CARD_WIDTH,
                connectingCard.position.y + CARD_HEIGHT / 2,
                mousePos.x,
                mousePos.y
              )}
              className={styles.tempConnectionLine}
              stroke="#3b82f6"
            />
          )}
        </svg>

        {particles.map((particle) => (
          <div
            key={particle.id}
            className={styles.particle}
            style={{
              left: particle.x - 3,
              top: particle.y - 3,
              width: 6,
              height: 6,
              backgroundColor: particle.color,
            }}
          />
        ))}

        {cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            isSelected={selectedCardId === card.id}
            isHighlighted={highlightedCardId === card.id}
            searchKeyword={searchKeyword}
            onSelect={onSelectCard}
            onMove={onMoveCard}
            onConnectionStart={handleConnectionStart}
            onConnectionEnd={handleConnectionEnd}
            isConnecting={connectingFrom !== null}
          />
        ))}

        {cards.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateTitle}>暂无卡片</div>
            <div className={styles.emptyStateDesc}>点击"新建卡片"按钮开始创建</div>
          </div>
        )}

        {editingConnectionId && (
          <div
            className={styles.connectionTypeDropdown}
            style={{
              left: dropdownPos.x,
              top: dropdownPos.y,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {CONNECTION_TYPES.map((type) => (
              <div
                key={type}
                className={styles.connectionTypeOption}
                onClick={() => handleConnectionTypeChange(type)}
              >
                <span
                  className={styles.connectionTypeDot}
                  style={{ backgroundColor: getConnectionColor(type) }}
                />
                {type}
              </div>
            ))}
            <div
              className={styles.connectionTypeOption}
              style={{ color: '#ef4444' }}
              onClick={() => handleDeleteConnection(editingConnectionId)}
            >
              <span className={styles.connectionTypeDot} style={{ backgroundColor: '#ef4444' }} />
              删除连接
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default Canvas;
