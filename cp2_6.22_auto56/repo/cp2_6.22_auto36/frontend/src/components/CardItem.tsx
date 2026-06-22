import React, { useCallback, useRef, useState } from 'react';
import type {
  Card,
  CardColor,
  CardPriority,
} from '@shared/types';
import {
  CARD_COLORS,
  CARD_COLOR_LIST,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  PRIORITY_LIST,
} from '@shared/types';

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
  onUpdatePriority: (cardId: string, priority: CardPriority) => void;
  onUpdateCard: (payload: {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    color: CardColor;
  }) => void;
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
  onUpdatePriority,
  onUpdateCard,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [showParticles, setShowParticles] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [editDesc, setEditDesc] = useState(card.description);
  const [editImg, setEditImg] = useState(card.imageUrl || '');
  const [editColor, setEditColor] = useState<CardColor>(card.color);
  const [editPriority, setEditPriority] = useState<CardPriority>(card.priority);

  const openEditModal = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditTitle(card.title);
      setEditDesc(card.description);
      setEditImg(card.imageUrl || '');
      setEditColor(card.color);
      setEditPriority(card.priority);
      setShowEditModal(true);
    },
    [card]
  );

  const submitEdit = useCallback(() => {
    if (!editTitle.trim()) return;
    onUpdateCard({
      id: card.id,
      title: editTitle.trim(),
      description: editDesc.trim(),
      imageUrl: editImg.trim() || undefined,
      color: editColor,
    });
    if (editPriority !== card.priority) {
      onUpdatePriority(card.id, editPriority);
    }
    setShowEditModal(false);
  }, [
    editTitle,
    editDesc,
    editImg,
    editColor,
    editPriority,
    card,
    onUpdateCard,
    onUpdatePriority,
  ]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isFiltered) return;
      const target = e.target as HTMLElement;
      if (target.closest('.card-item__vote-btn')) return;
      if (target.closest('.card-item__delete')) return;
      if (target.closest('.card-item__edit')) return;
      if (target.closest('.card-item__priority-badge')) return;
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

  const handlePriorityBadgeClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const cycle: CardPriority[] = ['low', 'medium', 'high'];
      const idx = cycle.indexOf(card.priority);
      const next = cycle[(idx + 1) % cycle.length];
      onUpdatePriority(card.id, next);
    },
    [card.id, card.priority, onUpdatePriority]
  );

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
          className="card-item__edit"
          onClick={openEditModal}
          title="编辑卡片"
        >
          ✎
        </button>
        <button
          className="card-item__delete"
          onClick={handleDeleteClick}
          title="删除卡片"
        >
          ×
        </button>
        <div className="card-item__body">
          <h3 className="card-item__title">
            <span style={{ flex: 1, minWidth: 0 }}>{card.title}</span>
            <span
              className="card-item__priority-badge"
              style={{ background: PRIORITY_COLORS[card.priority] }}
              onClick={handlePriorityBadgeClick}
              title={`优先级：${PRIORITY_LABELS[card.priority]}（点击切换）`}
            >
              {PRIORITY_LABELS[card.priority]}
            </span>
          </h3>
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

      {showEditModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="modal-card__title">编辑卡片</h3>
            <div className="form-field">
              <label className="form-field__label">标题</label>
              <input
                className="form-field__input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="输入卡片标题"
                autoFocus
              />
            </div>
            <div className="form-field">
              <label className="form-field__label">描述</label>
              <textarea
                className="form-field__textarea"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="简要描述创意要点"
              />
            </div>
            <div className="form-field">
              <label className="form-field__label">图片 URL（可选）</label>
              <input
                className="form-field__input"
                value={editImg}
                onChange={(e) => setEditImg(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="form-field">
              <label className="form-field__label">标签颜色</label>
              <div className="form-field__colors">
                {CARD_COLOR_LIST.map((color) => (
                  <button
                    key={color}
                    className={[
                      'form-color',
                      editColor === color ? 'is-selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{ background: CARD_COLORS[color] }}
                    onClick={() => setEditColor(color)}
                  />
                ))}
              </div>
            </div>
            <div className="form-field">
              <label className="form-field__label">优先级</label>
              <div className="edit-form__priority-row">
                {PRIORITY_LIST.map((p) => (
                  <button
                    key={p}
                    className={[
                      'edit-form__priority-btn',
                      editPriority === p ? 'is-selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setEditPriority(p)}
                  >
                    <span
                      className="edit-form__priority-dot"
                      style={{ background: PRIORITY_COLORS[p] }}
                    />
                    {PRIORITY_LABELS[p]}优先级
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn--secondary"
                onClick={() => setShowEditModal(false)}
              >
                取消
              </button>
              <button
                className="btn btn--primary"
                onClick={submitEdit}
                disabled={!editTitle.trim()}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { SNAP_THRESHOLD, SNAP_OFFSET };
