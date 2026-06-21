import React, { useState, useRef } from 'react';
import { InspirationCard, TagColor } from '@/types';
import { formatTimestamp, formatFullTime, truncateText, getColorHex } from '@/utils';
import EditorModal from './EditorModal';
import styles from '@/styles/Card.module.css';

interface CardProps {
  card: InspirationCard;
  isDragging?: boolean;
  isNew?: boolean;
  onEdit: (card: InspirationCard) => void;
  onDelete: (cardId: string) => void;
  onToggleFavorite: (cardId: string) => void;
  onUpdateCard: (
    cardId: string,
    title: string,
    content: string,
    color: TagColor,
    emoji?: string
  ) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, card: InspirationCard) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, card: InspirationCard) => void;
}

const Card: React.FC<CardProps> = ({
  card,
  isDragging = false,
  isNew = false,
  onEdit,
  onDelete,
  onToggleFavorite,
  onUpdateCard,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [shakeBtn, setShakeBtn] = useState(false);
  const hasHandledDragOver = useRef(false);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest(`.${styles.actionBtn}`)) return;
    if (target.closest(`.${styles.starIcon}`)) return;
    setIsFlipped(!isFlipped);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditor(true);
    onEdit(card);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
    setShakeBtn(true);
    setTimeout(() => setShakeBtn(false), 400);
  };

  const handleConfirmDelete = () => {
    onDelete(card.id);
    setShowConfirm(false);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(card.id);
  };

  const handleEditorSave = (
    title: string,
    content: string,
    color: TagColor,
    emoji?: string
  ) => {
    onUpdateCard(card.id, title, content, color, emoji);
    setShowEditor(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasHandledDragOver.current) {
      hasHandledDragOver.current = true;
      onDragOver(e);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    hasHandledDragOver.current = false;
    onDrop(e, card);
  };

  return (
    <>
      <div
        className={`${styles.cardWrapper} ${isDragging ? styles.dragging : ''} ${
          isNew ? styles.entering : ''
        }`}
        draggable={!isFlipped}
        onDragStart={e => onDragStart(e, card)}
        onDragEnd={onDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div
          className={`${styles.cardInner} ${isFlipped ? styles.flipped : ''}`}
          onClick={handleCardClick}
        >
          <div
            className={`${styles.cardFront} ${card.isFavorite ? styles.favorite : ''}`}
          >
            <div className={styles.cardHeader}>
              <div className={styles.titleRow}>
                {card.emoji && (
                  <span className={styles.emojiTag}>{card.emoji}</span>
                )}
                <h3 className={styles.cardTitle}>{card.title}</h3>
              </div>
              <div
                className={styles.colorTag}
                style={{
                  backgroundColor: getColorHex(card.color),
                  color: getColorHex(card.color),
                }}
              />
            </div>

            <p className={styles.cardContent}>
              {truncateText(card.content, 100)}
            </p>

            <div className={styles.cardFooter}>
              <span className={styles.cardTime}>
                {formatTimestamp(card.createdAt)}
              </span>
              <span
                className={`${styles.starIcon} ${
                  card.isFavorite ? styles.active : ''
                }`}
                onClick={handleToggleFavorite}
              >
                {card.isFavorite ? '⭐' : '☆'}
              </span>
            </div>
          </div>

          <div
            className={`${styles.cardBack} ${card.isFavorite ? styles.favorite : ''}`}
          >
            <h3 className={styles.backTitle}>
              {card.emoji && <span style={{ marginRight: 8 }}>{card.emoji}</span>}
              {card.title}
            </h3>

            <p className={styles.backContent}>{card.content}</p>

            <div className={styles.backMeta}>
              <div>创建于: {formatFullTime(card.createdAt)}</div>
              {card.updatedAt !== card.createdAt && (
                <div>更新于: {formatFullTime(card.updatedAt)}</div>
              )}
            </div>

            <div className={styles.actionButtons}>
              <button
                className={`${styles.actionBtn} ${styles.edit}`}
                onClick={handleEditClick}
              >
                <span>✏️</span>
                <span>编辑</span>
              </button>
              <button
                className={`${styles.actionBtn} ${styles.delete}`}
                onClick={handleDeleteClick}
              >
                <span>🗑️</span>
                <span>删除</span>
              </button>
              <button
                className={`${styles.actionBtn} ${styles.favorite} ${
                  card.isFavorite ? styles.active : ''
                }`}
                onClick={handleToggleFavorite}
              >
                <span>{card.isFavorite ? '⭐' : '☆'}</span>
                <span>{card.isFavorite ? '已收藏' : '收藏'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showEditor && (
        <EditorModal
          isOpen={showEditor}
          onClose={() => setShowEditor(false)}
          onSave={handleEditorSave}
          editingCard={card}
        />
      )}

      {showConfirm && (
        <div className={styles.confirmDialog}>
          <div
            className={styles.confirmBackdrop}
            onClick={() => setShowConfirm(false)}
          />
          <div className={styles.confirmBox}>
            <div className={styles.confirmIcon}>⚠️</div>
            <h3 className={styles.confirmTitle}>确认删除</h3>
            <p className={styles.confirmText}>
              确定要删除这条灵感吗？此操作无法撤销。
            </p>
            <div className={styles.confirmButtons}>
              <button
                className={`${styles.confirmBtn} ${styles.cancel}`}
                onClick={() => setShowConfirm(false)}
              >
                取消
              </button>
              <button
                className={`${styles.confirmBtn} ${styles.danger} ${
                  shakeBtn ? styles.shake : ''
                }`}
                onClick={handleConfirmDelete}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Card;
