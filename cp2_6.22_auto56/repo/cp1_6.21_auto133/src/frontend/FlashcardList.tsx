import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flashcard } from './types';
import { api } from './api';

const FlashcardList: React.FC = () => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState<Flashcard | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      setLoading(true);
      const data = await api.getAllCards();
      setCards(data);
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    cards.forEach(card => card.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet);
  }, [cards]);

  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      const matchesSearch = card.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag = !selectedTag || card.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [cards, searchTerm, selectedTag]);

  const getContentSummary = (content: string) => {
    const lines = content.split('\n');
    return lines.slice(0, 2).join('\n') + (lines.length > 2 ? '...' : '');
  };

  const handleDelete = async () => {
    if (!showDetail) return;
    try {
      await api.deleteCard(showDetail.id);
      setCards(prev => prev.filter(c => c.id !== showDetail.id));
      setShowDetail(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete card:', error);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>加载中...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>全部卡片</h1>
        <span style={styles.count}>{cards.length} 张卡片</span>
      </div>

      <div style={styles.filterBar}>
        <input
          type="text"
          placeholder="搜索卡片标题..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        <div style={styles.tagFilter}>
          <button
            style={{
              ...styles.tagFilterButton,
              ...(!selectedTag ? styles.tagFilterActive : {})
            }}
            onClick={() => setSelectedTag(null)}
          >
            全部
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              style={{
                ...styles.tagFilterButton,
                ...(selectedTag === tag ? styles.tagFilterActive : {})
              }}
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {filteredCards.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📚</div>
          <div style={styles.emptyText}>
            {cards.length === 0 ? '还没有创建任何卡片' : '没有匹配的卡片'}
          </div>
          {cards.length === 0 && (
            <button
              style={styles.createButton}
              onClick={() => navigate('/cards/new')}
            >
              创建第一张卡片
            </button>
          )}
        </div>
      ) : (
        <div style={styles.cardGrid}>
          {filteredCards.map(card => (
            <div
              key={card.id}
              style={styles.card}
              onClick={() => setShowDetail(card)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(148, 163, 184, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(203, 213, 225, 0.5)';
              }}
            >
              <h3 style={styles.cardTitle}>{card.title}</h3>
              <div style={styles.tagContainer}>
                {card.tags.map(tag => (
                  <span key={tag} style={styles.tagBadge}>{tag}</span>
                ))}
              </div>
              <p style={styles.cardContent}>{getContentSummary(card.content)}</p>
            </div>
          ))}
        </div>
      )}

      {showDetail && (
        <div style={styles.modalOverlay} onClick={() => {
          setShowDetail(null);
          setShowDeleteConfirm(false);
        }}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{showDetail.title}</h2>
              <button
                style={styles.closeButton}
                onClick={() => {
                  setShowDetail(null);
                  setShowDeleteConfirm(false);
                }}
              >
                ×
              </button>
            </div>
            <div style={styles.modalTags}>
              {showDetail.tags.map(tag => (
                <span key={tag} style={styles.tagBadge}>{tag}</span>
              ))}
            </div>
            <div style={styles.modalBody}>
              <pre style={styles.modalText}>{showDetail.content}</pre>
            </div>
            <div style={styles.modalFooter}>
              {!showDeleteConfirm ? (
                <>
                  <button
                    style={{ ...styles.modalButton, ...styles.editButton }}
                    onClick={() => navigate(`/cards/${showDetail.id}/edit`)}
                  >
                    编辑
                  </button>
                  <button
                    style={{ ...styles.modalButton, ...styles.deleteButton }}
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    删除
                  </button>
                </>
              ) : (
                <>
                  <span style={styles.confirmText}>确定要删除这张卡片吗？</span>
                  <button
                    style={{ ...styles.modalButton, ...styles.cancelButton }}
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    取消
                  </button>
                  <button
                    style={{ ...styles.modalButton, ...styles.confirmDeleteButton }}
                    onClick={handleDelete}
                  >
                    确认删除
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px'
  } as React.CSSProperties,

  header: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '16px',
    marginBottom: '24px'
  } as React.CSSProperties,

  title: {
    fontSize: '28px',
    fontWeight: 600,
    color: '#1E293B',
    margin: 0
  } as React.CSSProperties,

  count: {
    fontSize: '14px',
    color: '#64748B'
  } as React.CSSProperties,

  loading: {
    textAlign: 'center' as const,
    padding: '48px',
    fontSize: '16px',
    color: '#64748B'
  } as React.CSSProperties,

  filterBar: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    marginBottom: '24px'
  } as React.CSSProperties,

  searchInput: {
    height: '40px',
    padding: '0 16px',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.25s ease-out',
    fontFamily: 'inherit',
    '&:focus': {
      borderColor: '#3B82F6'
    }
  } as React.CSSProperties,

  tagFilter: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px'
  } as React.CSSProperties,

  tagFilterButton: {
    padding: '6px 12px',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    backgroundColor: '#FFFFFF',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit'
  } as React.CSSProperties,

  tagFilterActive: {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    borderColor: '#3B82F6'
  } as React.CSSProperties,

  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 240px)',
    gap: '20px',
    justifyContent: 'flex-start' as const,
    '@media (max-width: 768px)': {
      gridTemplateColumns: 'repeat(2, 240px)'
    },
    '@media (max-width: 480px)': {
      gridTemplateColumns: '1fr'
    }
  } as React.CSSProperties,

  card: {
    width: '240px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '16px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(203, 213, 225, 0.5)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px'
  } as React.CSSProperties,

  cardTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1E293B',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const
  } as React.CSSProperties,

  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px'
  } as React.CSSProperties,

  tagBadge: {
    backgroundColor: '#EBF4FF',
    color: '#3B82F6',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500
  } as React.CSSProperties,

  cardContent: {
    fontSize: '14px',
    color: '#64748B',
    margin: 0,
    lineHeight: 1.5,
    overflow: 'hidden',
    display: '-webkit-box' as const,
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    whiteSpace: 'pre-wrap' as const
  } as React.CSSProperties,

  emptyState: {
    textAlign: 'center' as const,
    padding: '64px 24px'
  } as React.CSSProperties,

  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  } as React.CSSProperties,

  emptyText: {
    fontSize: '16px',
    color: '#64748B',
    marginBottom: '24px'
  } as React.CSSProperties,

  createButton: {
    padding: '10px 24px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'transform 0.15s ease',
    fontFamily: 'inherit'
  } as React.CSSProperties,

  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000
  } as React.CSSProperties,

  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
  } as React.CSSProperties,

  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #E2E8F0'
  } as React.CSSProperties,

  modalTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#1E293B',
    margin: 0
  } as React.CSSProperties,

  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#64748B',
    padding: 0,
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  } as React.CSSProperties,

  modalTags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    padding: '16px 24px',
    borderBottom: '1px solid #E2E8F0'
  } as React.CSSProperties,

  modalBody: {
    padding: '24px',
    overflowY: 'auto' as const,
    flex: 1
  } as React.CSSProperties,

  modalText: {
    fontSize: '15px',
    color: '#334155',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap' as const,
    margin: 0,
    fontFamily: 'inherit'
  } as React.CSSProperties,

  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end' as const,
    alignItems: 'center',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid #E2E8F0'
  } as React.CSSProperties,

  modalButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'transform 0.15s ease',
    fontFamily: 'inherit'
  } as React.CSSProperties,

  editButton: {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF'
  } as React.CSSProperties,

  deleteButton: {
    backgroundColor: '#EF4444',
    color: '#FFFFFF'
  } as React.CSSProperties,

  cancelButton: {
    backgroundColor: '#E2E8F0',
    color: '#475569'
  } as React.CSSProperties,

  confirmDeleteButton: {
    backgroundColor: '#EF4444',
    color: '#FFFFFF'
  } as React.CSSProperties,

  confirmText: {
    flex: 1,
    fontSize: '14px',
    color: '#EF4444'
  } as React.CSSProperties
};

export default FlashcardList;
