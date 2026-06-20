import { useState, useRef } from 'react';
import { useStore } from '../store';
import Card from './Card';
import FullscreenEditor from './FullscreenEditor';
import type { Card as CardType } from '../types';

function Canvas() {
  const { getFilteredCards, editCard, zoom, pan } = useStore();
  const [editingCard, setEditingCard] = useState<CardType | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const filteredCards = getFilteredCards();

  const handleEditCard = (card: CardType) => {
    setEditingCard(card);
  };

  const handleSaveEdit = (id: number, data: { title: string; content: string }) => {
    editCard(id, data);
  };

  return (
    <div className="canvas" ref={canvasRef}>
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
            <div className="empty-state-hint">点击左侧"新建卡片"按钮开始创建</div>
          </div>
        )}

        {filteredCards.map((card) => (
          <Card key={card.id} card={card} onEdit={handleEditCard} />
        ))}
      </div>

      {editingCard && (
        <FullscreenEditor
          card={editingCard}
          onClose={() => setEditingCard(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}

export default Canvas;
