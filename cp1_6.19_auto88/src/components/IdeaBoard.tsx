import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import type { Project, IdeaCard as IdeaCardType } from '@/types';
import { IdeaCard } from './IdeaCard';
import { Modal } from './Modal';
import { useAutoSave } from '@/hooks/useAutoSave';

interface IdeaBoardProps {
  project: Project | undefined;
  onMoveCard: (cardId: string, position: { x: number; y: number }) => void;
  onUpdateCardNote: (cardId: string, note: string) => void;
  onDeleteCard: (cardId: string) => IdeaCardType | null;
  onRestoreCard: (card: IdeaCardType) => void;
  onClearBoard: () => void;
}

export const IdeaBoard = ({
  project,
  onMoveCard,
  onUpdateCardNote,
  onDeleteCard,
  onRestoreCard,
  onClearBoard,
}: IdeaBoardProps) => {
  const [showClearModal, setShowClearModal] = useState(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [useVirtualList, setUseVirtualList] = useState(false);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 30 });
  const boardRef = useRef<HTMLDivElement>(null);

  const { showSaveIndicator, forceSave } = useAutoSave(
    project?.id || null,
    project,
    10000
  );

  const cardCount = project?.cards.length || 0;

  useEffect(() => {
    setUseVirtualList(cardCount > 30);
    if (cardCount <= 30) {
      setVisibleRange({ start: 0, end: cardCount });
    }
  }, [cardCount]);

  const handleScroll = useCallback(() => {
    if (!boardRef.current || !useVirtualList) return;
    
    const { scrollTop, clientHeight } = boardRef.current;
    const cardHeight = 280 + 20;
    const visibleCards = Math.ceil(clientHeight / cardHeight) + 2;
    const start = Math.max(0, Math.floor(scrollTop / cardHeight) - 1);
    const end = Math.min(cardCount, start + visibleCards + 2);
    
    setVisibleRange({ start, end });
  }, [useVirtualList, cardCount]);

  const handleMoveCard = useCallback(
    (cardId: string, position: { x: number; y: number }) => {
      if (project) {
        onMoveCard(cardId, position);
        setActiveCardId(cardId);
        setTimeout(() => setActiveCardId(null), 300);
      }
    },
    [project, onMoveCard]
  );

  const handleDeleteCard = useCallback(
    (cardId: string) => {
      if (project) {
        const deletedCard = onDeleteCard(cardId);
        if (deletedCard) {
          toast.success('卡片已删除', {
            duration: 3000,
          });
          setTimeout(() => {
            toast(
              (t) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>已删除卡片</span>
                  <button
                    onClick={() => {
                      onRestoreCard(deletedCard);
                      toast.dismiss(t.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#667eea',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '4px 8px',
                    }}
                  >
                    撤销
                  </button>
                </div>
              ),
              { duration: 3000 }
            );
          }, 100);
        }
      }
    },
    [project, onDeleteCard, onRestoreCard]
  );

  const handleUpdateNote = useCallback(
    (cardId: string, note: string) => {
      if (project) {
        onUpdateCardNote(cardId, note);
        toast.success('注释已更新', { duration: 1500 });
      }
    },
    [project, onUpdateCardNote]
  );

  const handleClearConfirm = useCallback(() => {
    onClearBoard();
    setShowClearModal(false);
    toast.success('灵感板已清空');
  }, [onClearBoard]);

  const sortedCards = useMemo(() => {
    if (!project) return [];
    return [...project.cards].sort((a, b) => a.createdAt - b.createdAt);
  }, [project]);

  const visibleCards = useMemo(() => {
    if (!useVirtualList) return sortedCards;
    return sortedCards.slice(visibleRange.start, visibleRange.end);
  }, [sortedCards, useVirtualList, visibleRange]);

  const getCardZIndex = useCallback(
    (cardId: string, index: number) => {
      if (cardId === activeCardId) return 1000;
      return index + 1;
    },
    [activeCardId]
  );

  if (!project) {
    return (
      <div className="idea-board idea-board-empty">
        <motion.div
          className="empty-board-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="empty-icon">🎨</div>
          <h2>欢迎使用灵感板</h2>
          <p>从左侧选择一个项目，或创建一个新项目开始收集灵感</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      ref={boardRef}
      className="idea-board"
      onScroll={handleScroll}
    >
      {showSaveIndicator && (
        <motion.div
          className="auto-save-indicator"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          已自动保存
        </motion.div>
      )}

      {project.cards.length === 0 ? (
        <motion.div
          className="empty-board-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="empty-icon">🖼️</div>
          <h2>灵感板是空的</h2>
          <p>点击上方"添加图片"按钮开始上传你的灵感素材</p>
        </motion.div>
      ) : (
        <div className="cards-container">
          <AnimatePresence initial={false}>
            {visibleCards.map((card, index) => (
              <IdeaCard
                key={card.id}
                card={card}
                projectId={project.id}
                onMove={handleMoveCard}
                onUpdateNote={handleUpdateNote}
                onDelete={handleDeleteCard}
                zIndex={getCardZIndex(card.id, useVirtualList ? visibleRange.start + index : index)}
              />
            ))}
          </AnimatePresence>
          
          {useVirtualList && (
            <div
              className="virtual-list-spacer"
              style={{
                height: sortedCards.length * 300,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: -1,
              }}
            />
          )}
        </div>
      )}

      <button
        className="force-save-btn"
        onClick={forceSave}
        title="立即保存"
      >
        💾
      </button>

      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearConfirm}
        title="确认清空"
        message="确定要清空当前灵感板吗？此操作无法撤销。"
        confirmText="清空"
        cancelText="取消"
      />
    </div>
  );
};
