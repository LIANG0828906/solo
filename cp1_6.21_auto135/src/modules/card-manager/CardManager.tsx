import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import type { Card } from '../../types';

interface CardManagerProps {
  cards: Card[];
}

const CardManager: React.FC<CardManagerProps> = ({ cards }) => {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const updateColumns = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const colCount = Math.max(1, Math.floor(width / 280));
        setColumns(colCount);
      }
    };
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [cards]);

  const getMasonryColumns = useCallback(() => {
    const cols: Card[][] = Array.from({ length: columns }, () => []);
    const colHeights = new Array(columns).fill(0);

    cards.forEach(card => {
      const shortestCol = colHeights.indexOf(Math.min(...colHeights));
      cols[shortestCol].push(card);
      const estimatedHeight = estimateCardHeight(card);
      colHeights[shortestCol] += estimatedHeight;
    });

    return cols;
  }, [cards, columns]);

  const estimateCardHeight = (card: Card) => {
    const baseHeight = 60;
    const titleHeight = card.title ? 30 : 0;
    const contentLines = Math.ceil(card.content.length / 30);
    const contentHeight = Math.min(contentLines * 20, 120);
    const tagHeight = card.tags.length > 0 ? 36 : 0;
    return baseHeight + titleHeight + contentHeight + tagHeight;
  };

  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
    setIsEditing(false);
  };

  const handleDelete = async (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    if (!confirm('确定要删除这张卡片吗？')) return;
    try {
      await axios.delete(`/api/cards/${cardId}`);
      if (selectedCard?.id === cardId) {
        setSelectedCard(null);
      }
    } catch (err) {
      console.error('删除失败', err);
    }
  };

  const handleStartEdit = () => {
    if (selectedCard) {
      setEditTitle(selectedCard.title);
      setEditContent(selectedCard.content);
      setEditTags([...selectedCard.tags]);
      setEditTagInput('');
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedCard) return;
    try {
      await axios.put(`/api/cards/${selectedCard.id}`, {
        title: editTitle,
        content: editContent,
        tags: editTags
      });
      setIsEditing(false);
    } catch (err) {
      console.error('更新失败', err);
    }
  };

  const handleAddEditTag = () => {
    const trimmed = editTagInput.trim();
    if (trimmed && editTags.length < 3 && !editTags.includes(trimmed)) {
      setEditTags([...editTags, trimmed]);
      setEditTagInput('');
    }
  };

  const handleRemoveEditTag = (tag: string) => {
    setEditTags(editTags.filter(t => t !== tag));
  };

  const masonryColumns = getMasonryColumns();

  const isHighlighted = (card: Card) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return card.title.toLowerCase().includes(q) ||
      card.tags.some(t => t.toLowerCase().includes(q));
  };

  return (
    <div style={styles.managerContainer}>
      <div style={styles.managerHeader}>
        <h3 style={styles.managerTitle}>📋 灵感卡片</h3>
        <span style={styles.cardCount}>{cards.length} 张</span>
      </div>

      <div style={styles.searchBox}>
        <input
          type="text"
          placeholder="在卡片中搜索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      <div style={styles.cardList} ref={containerRef}>
        {cards.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💡</div>
            <p style={styles.emptyText}>还没有灵感卡片</p>
            <p style={styles.emptyDesc}>在左侧编辑器中记录你的第一个灵感吧！</p>
          </div>
        ) : (
          <div style={styles.masonryContainer}>
            {masonryColumns.map((col, colIndex) => (
              <div key={colIndex} style={styles.masonryColumn}>
                {col.map(card => (
                  <div
                    key={card.id}
                    style={{
                      ...styles.card,
                      backgroundColor: isHighlighted(card) ? '#FDE68A' : '#FFFFFF',
                      borderColor: selectedCard?.id === card.id ? '#6366F1' : '#E2E8F0'
                    }}
                    onClick={() => handleCardClick(card)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = '#6366F1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = selectedCard?.id === card.id ? '#6366F1' : '#E2E8F0';
                    }}
                  >
                    {card.title && (
                      <h4 style={styles.cardTitle}>{card.title}</h4>
                    )}
                    <p style={styles.cardContent}>{card.content}</p>
                    {card.tags.length > 0 && (
                      <div style={styles.cardTags}>
                        {card.tags.map(tag => (
                          <span key={tag} style={styles.tagBubble}>{tag}</span>
                        ))}
                      </div>
                    )}
                    <div style={styles.cardFooter}>
                      <span style={styles.cardDate}>
                        {new Date(card.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                      <button
                        style={styles.deleteBtn}
                        onClick={(e) => handleDelete(e, card.id)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCard && (
        <div style={styles.cardDetailOverlay} onClick={() => setSelectedCard(null)}>
          <div style={styles.cardDetail} onClick={(e) => e.stopPropagation()}>
            <div style={styles.detailHeader}>
              <h3 style={styles.detailTitle}>
                {isEditing ? '编辑卡片' : '卡片详情'}
              </h3>
              <button style={styles.closeBtn} onClick={() => setSelectedCard(null)}>
                ×
              </button>
            </div>

            {isEditing ? (
              <div style={styles.editForm}>
                <input
                  type="text"
                  placeholder="标题"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={styles.editTitleInput}
                />
                <textarea
                  placeholder="内容"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  style={styles.editContentInput}
                />
                <div style={styles.editTagSection}>
                  <div style={styles.tagInputRow}>
                    <input
                      type="text"
                      placeholder="添加标签"
                      value={editTagInput}
                      onChange={(e) => setEditTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddEditTag();
                        }
                      }}
                      style={styles.editTagInput}
                    />
                    <button style={styles.addTagBtn} onClick={handleAddEditTag}>
                      +
                    </button>
                  </div>
                  <div style={styles.editTagsDisplay}>
                    {editTags.map(tag => (
                      <span key={tag} style={styles.tagBubble}>
                        {tag}
                        <button
                          style={styles.tagRemoveBtn}
                          onClick={() => handleRemoveEditTag(tag)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div style={styles.editActions}>
                  <button style={styles.cancelBtn} onClick={() => setIsEditing(false)}>
                    取消
                  </button>
                  <button style={styles.saveBtn} onClick={handleSaveEdit}>
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.detailContent}>
                {selectedCard.title && (
                  <h2 style={styles.detailCardTitle}>{selectedCard.title}</h2>
                )}
                {selectedCard.tags.length > 0 && (
                  <div style={styles.detailTags}>
                    {selectedCard.tags.map(tag => (
                      <span key={tag} style={styles.tagBubble}>{tag}</span>
                    ))}
                  </div>
                )}
                <p style={styles.detailCardContent}>{selectedCard.content}</p>
                <div style={styles.detailMeta}>
                  <span>创建于：{new Date(selectedCard.createdAt).toLocaleString('zh-CN')}</span>
                  <span>被引用：{selectedCard.refCount || 0} 次</span>
                </div>
                <div style={styles.detailActions}>
                  <button style={styles.editBtn} onClick={handleStartEdit}>
                    编辑
                  </button>
                  <button
                    style={styles.deleteBtnLarge}
                    onClick={async () => {
                      if (confirm('确定要删除这张卡片吗？')) {
                        await axios.delete(`/api/cards/${selectedCard.id}`);
                        setSelectedCard(null);
                      }
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  managerContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden'
  },
  managerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 16px 12px',
    borderBottom: '1px solid #E2E8F0'
  },
  managerTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#0F172A',
    margin: 0
  },
  cardCount: {
    fontSize: '13px',
    color: '#64748B'
  },
  searchBox: {
    padding: '12px 16px'
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '13px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    color: '#0F172A'
  },
  cardList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '12px'
  },
  masonryContainer: {
    display: 'flex',
    gap: '12px'
  },
  masonryColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  card: {
    width: '100%',
    maxWidth: '280px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#0F172A',
    margin: '0 0 8px 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const
  },
  cardContent: {
    fontSize: '13px',
    color: '#475569',
    lineHeight: '1.6',
    margin: '0 0 10px 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 4,
    WebkitBoxOrient: 'vertical' as const
  },
  cardTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '10px'
  },
  tagBubble: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 12px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    borderRadius: '16px',
    fontSize: '11px',
    whiteSpace: 'nowrap' as const
  },
  tagRemoveBtn: {
    background: 'none',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '14px',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '8px',
    borderTop: '1px solid #F1F5F9'
  },
  cardDate: {
    fontSize: '11px',
    color: '#94A3B8'
  },
  deleteBtn: {
    fontSize: '11px',
    color: '#EF4444',
    backgroundColor: 'transparent',
    padding: '2px 6px',
    borderRadius: '4px'
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px 20px'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px'
  },
  emptyText: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#475569',
    margin: '0 0 6px 0'
  },
  emptyDesc: {
    fontSize: '12px',
    color: '#94A3B8',
    margin: 0
  },
  cardDetailOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '20px'
  },
  cardDetail: {
    width: '100%',
    maxWidth: '500px',
    maxHeight: '80vh',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC'
  },
  detailTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#0F172A',
    margin: 0
  },
  closeBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#E2E8F0',
    color: '#475569',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: 'none'
  },
  detailContent: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto' as const
  },
  detailCardTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#0F172A',
    margin: '0 0 12px 0'
  },
  detailTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '16px'
  },
  detailCardContent: {
    fontSize: '15px',
    lineHeight: '1.8',
    color: '#334155',
    margin: '0 0 20px 0',
    whiteSpace: 'pre-wrap' as const
  },
  detailMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#94A3B8',
    paddingTop: '12px',
    borderTop: '1px solid #E2E8F0'
  },
  detailActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '16px'
  },
  editBtn: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#6366F1',
    color: '#FFFFFF',
    borderRadius: '8px',
    fontSize: '14px'
  },
  deleteBtnLarge: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    borderRadius: '8px',
    fontSize: '14px'
  },
  editForm: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  editTitleInput: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '16px',
    fontWeight: 600,
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    color: '#0F172A'
  },
  editContentInput: {
    width: '100%',
    minHeight: '150px',
    padding: '12px 14px',
    fontSize: '14px',
    lineHeight: '1.7',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    color: '#0F172A',
    resize: 'vertical' as const
  },
  editTagSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  tagInputRow: {
    display: 'flex',
    gap: '8px'
  },
  editTagInput: {
    flex: 1,
    padding: '8px 12px',
    fontSize: '13px',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    color: '#0F172A'
  },
  addTagBtn: {
    padding: '8px 14px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    borderRadius: '8px',
    fontSize: '14px'
  },
  editTagsDisplay: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  editActions: {
    display: 'flex',
    gap: '10px',
    marginTop: 'auto'
  },
  cancelBtn: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#E2E8F0',
    color: '#475569',
    borderRadius: '8px',
    fontSize: '14px'
  },
  saveBtn: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#6366F1',
    color: '#FFFFFF',
    borderRadius: '8px',
    fontSize: '14px'
  }
} as const;

export default CardManager;
