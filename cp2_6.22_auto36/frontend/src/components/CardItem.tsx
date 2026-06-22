import React, { useCallback, useRef, useState } from 'react';
import type { Card, CardColor } from '@shared/types';
import { CARD_COLORS } from '@shared/types';

interface CardItemProps {
  card: Card;
  voteCount: number;
  isVoted: boolean;
  isOwnCard: boolean;
  isFiltered: boolean;
  isDragging: boolean;
  spaceOffset: { dx: number; dy: number } | null;
  onDragStart: (
    cardId: string,
    e: React.PointerEvent<HTMLDivElement>
  ) => void;
  onToggleVote: (cardId: string) => void;
  onDelete: (cardId: string) => void;
}

const SNAP_THRESHOLD = 8;
const SNAP_OFFSET = 12;

export const CardItem: React.FC<CardItemProps> = ({
  card,
  voteCount,
  isVoted,
  isOwnCard,
  isFiltered,
  isDragging,
  spaceOffset,
  onDragStart,
  onToggleVote,
  onDelete,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [showParticles, setShowParticles] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isFiltered) return;
      const target = e.target as HTMLElement;
      if (target.closest('.card-item__vote-btn')) return;
      if (target.closest('.card-item__delete')) return;
      onDragStart(card.id, e);
    },
    [card.id, isFiltered, onDragStart]
  );

  const handleVoteClick = useCallback(() => {
    if (isOwnCard) return;
    if (!isVoted) {
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 500);
    }
    onToggleVote(card.id);
  }, [card.id, isOwnCard, isVoted, onToggleVote]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  }, []);

  const transformParts: string[] = [];
  if (spaceOffset) {
    transformParts.push(
      `translate(${spaceOffset.dx}px, ${spaceOffset.dy}px)`
    );
  }

  const particleStyles = [
    { tx: '-18px', ty: '-16px' },
    { tx: '20px', ty: '-14px' },
    { tx: '22px', ty: '14px' },
    { tx: '-16px', ty: '18px' },
    { tx: '0px', ty: '-22px' },
  ];

  return (
    <>
      <div
        ref={cardRef}
        className={[
          'card-item',
          isDragging ? 'is-dragging' : '',
          isFiltered ? 'is-faded' : '',
          spaceOffset ? 'is-making-space' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          left: card.x,
          top: card.y,
          width: card.width,
          zIndex: isDragging ? 150 : 1,
          transform: transformParts.join(' ') || undefined,
        }}
        onPointerDown={handlePointerDown}
      >
        <div
          className="card-item__color-bar"
          style={{ background: CARD_COLORS[card.color as CardColor] }}
        />
        <button
          className="card-item__delete"
          onClick={handleDeleteClick}
          title="删除卡片"
        >
          ×
        </button>
        <div className="card-item__body">
          <h3 className="card-item__title">{card.title}</h3>
          {card.description && (
            <p className="card-item__description">{card.description}</p>
          )}
          {card.imageUrl && (
            <img
              className="card-item__image"
              src={card.imageUrl}
              alt=""
              draggable={false}
            />
          )}
          <div className="card-item__footer">
            <button
              className={[
                'card-item__vote-btn',
                isVoted ? 'is-voted' : '',
                isOwnCard ? 'is-disabled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={handleVoteClick}
              title={isOwnCard ? '不能对自己的卡片投票' : isVoted ? '取消投票' : '投票'}
              disabled={isOwnCard}
            >
              <svg
                className="card-item__vote-icon"
                viewBox="0 0 24 24"
                fill={isVoted ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {showParticles &&
                particleStyles.map((s, i) => (
                  <span
                    key={i}
                    className="vote-particle"
                    style={
                      {
                        '--tx': s.tx,
                        '--ty': s.ty,
                      } as React.CSSProperties
                    }
                  />
                ))}
            </button>
            <span className="card-item__vote-count">{voteCount}</span>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="modal-card__title">确认删除</h3>
            <p className="confirm-dialog__text">
              确定要删除这张卡片吗？此操作不可撤销。
            </p>
            <div className="modal-actions">
              <button
                className="btn btn--secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                取消
              </button>
              <button
                className="btn btn--primary"
                onClick={() => {
                  onDelete(card.id);
                  setShowDeleteConfirm(false);
                }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { SNAP_THRESHOLD, SNAP_OFFSET };
