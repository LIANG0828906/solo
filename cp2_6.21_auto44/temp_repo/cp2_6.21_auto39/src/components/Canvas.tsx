import { useState, useRef } from 'react';
import { useStore } from '../store';
import Card from './Card';
import EditCardDialog from './EditCardDialog';
import CreateCardDialog from './CreateCardDialog';
import type { Card as CardType, CardCreate } from '../types';

function Canvas() {
  const { getFilteredCards, editCard, zoom, pan, addCard, cards } = useStore();
  const [editingCard, setEditingCard] = useState<CardType | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createPosition, setCreatePosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const filteredCards = getFilteredCards();

  const handleEditCard = (card: CardType) => {
    setEditingCard(card);
  };

  const handleSaveEdit = (id: number, data: { title: string; content: string; color: string | null }) => {
    editCard(id, data);
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.card')) return;

    const canvasContent = canvasRef.current?.querySelector('.canvas-content') as HTMLElement | null;
    if (!canvasContent) return;

    const rect = canvasContent.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - pan.x;
    const y = (e.clientY - rect.top) / zoom - pan.y;

    setCreatePosition({ x, y });
    setShowCreateDialog(true);
  };

  const handleCreateCard = (cardData: Omit<CardCreate, 'x' | 'y' | 'z_index'>) => {
    const newCard = {
      ...cardData,
      x: createPosition.x,
      y: createPosition.y,
      z_index: cards.length,
    };
    addCard(newCard);
  };

  return (
    <div className="canvas" ref={canvasRef} onDoubleClick={handleCanvasDoubleClick}>
      <div
        className="canvas-content"
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: 'top left',
        }}
      >
        {filteredCards.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">✨</div>
            <div className="empty-state-text">还没有卡片</div>
            <div className="empty-state-hint">双击画布或点击左侧"新建卡片"按钮开始创建</div>
          </div>
        )}

        {filteredCards.map((card) => (
          <Card key={card.id} card={card} onEdit={handleEditCard} />
        ))}
      </div>

      {editingCard && (
        <EditCardDialog
          card={editingCard}
          onClose={() => setEditingCard(null)}
          onSave={handleSaveEdit}
        />
      )}

      {showCreateDialog && (
        <CreateCardDialog
          onClose={() => setShowCreateDialog(false)}
          onCreate={handleCreateCard}
        />
      )}
    </div>
  );
}

export default Canvas;
