import React, { useState, useCallback, useRef } from 'react';
import type { Card, Connection } from '../types';
import { useBoardStore } from '../store/boardStore';
import CardItem from './CardItem';
import ConnectionLine from './ConnectionLine';
import AddCardForm from './AddCardForm';

interface BoardCanvasProps {
  boardId: string;
}

const BoardCanvas: React.FC<BoardCanvasProps> = ({ boardId }) => {
  const cards = useBoardStore((s) => s.cards.filter((c) => c.boardId === boardId));
  const connections = useBoardStore((s) => s.connections.filter((c) => c.boardId === boardId));
  const addConnection = useBoardStore((s) => s.addConnection);
  const deleteConnection = useBoardStore((s) => s.deleteConnection);

  const [scale, setScale] = useState(1);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [addFormPos, setAddFormPos] = useState<{ x: number; y: number } | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<{ cardId: string; startX: number; startY: number } | null>(null);
  const [tempLine, setTempLine] = useState<{ x2: number; y2: number } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((prev) => {
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const next = Math.min(2, Math.max(0.5, prev + delta));
      return Math.round(next * 10) / 10;
    });
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target !== canvasRef.current && !(e.target as HTMLElement).classList.contains('canvas-bg')) return;
    if (connectingFrom) {
      setConnectingFrom(null);
      setTempLine(null);
      return;
    }
    setSelectedConnection(null);
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    setAddFormPos({ x, y });
  }, [scale, connectingFrom]);

  const handleConnectionStart = useCallback((cardId: string, e: React.MouseEvent) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    setConnectingFrom({
      cardId,
      startX: card.x + 90,
      startY: card.y + 100,
    });

    const handleMouseMove = (ev: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTempLine({
        x2: (ev.clientX - rect.left) / scale,
        y2: (ev.clientY - rect.top) / scale,
      });
    };

    const handleMouseUp = (ev: MouseEvent) => {
      const targetEl = document.elementFromPoint(ev.clientX, ev.clientY);
      const cardEl = targetEl?.closest('.card-item');
      if (cardEl) {
        const targetCardId = cardEl.getAttribute('data-card-id');
        if (targetCardId && targetCardId !== cardId) {
          addConnection(boardId, cardId, targetCardId);
        }
      }
      setConnectingFrom(null);
      setTempLine(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [cards, scale, boardId, addConnection]);

  return (
    <div className="board-canvas-container">
      <div className="canvas-zoom-indicator">{Math.round(scale * 100)}%</div>
      <div
        ref={canvasRef}
        className={`canvas-bg board-canvas ${connectingFrom ? 'connecting-mode' : ''}`}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
        style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}
      >
        <svg className="connections-svg">
          {connections.map((conn) => {
            const fromCard = cards.find((c) => c.id === conn.fromCardId);
            const toCard = cards.find((c) => c.id === conn.toCardId);
            if (!fromCard || !toCard) return null;
            return (
              <ConnectionLine
                key={conn.id}
                connection={conn}
                fromCard={fromCard}
                toCard={toCard}
                scale={scale}
                isSelected={selectedConnection === conn.id}
                onSelect={setSelectedConnection}
                onDelete={deleteConnection}
              />
            );
          })}
          {connectingFrom && tempLine && (
            <line
              x1={connectingFrom.startX}
              y1={connectingFrom.startY}
              x2={tempLine.x2}
              y2={tempLine.y2}
              stroke="#3B82F6"
              strokeWidth={2}
              strokeDasharray="6,4"
              strokeOpacity={0.6}
            />
          )}
        </svg>
        {cards.map((card) => (
          <div key={card.id} data-card-id={card.id}>
            <CardItem card={card} scale={scale} onConnectionStart={handleConnectionStart} />
          </div>
        ))}
      </div>
      {addFormPos && (
        <AddCardForm
          boardId={boardId}
          x={addFormPos.x}
          y={addFormPos.y}
          onSubmit={() => setAddFormPos(null)}
          onCancel={() => setAddFormPos(null)}
        />
      )}
    </div>
  );
};

export default BoardCanvas;
