import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Excerpt, excerptApi, tagApi } from '../utils/api';

interface CardFlowProps {
  bookId: string;
  bookTitle: string;
  excerpts: Excerpt[];
  setExcerpts: React.Dispatch<React.SetStateAction<Excerpt[]>>;
  filteredExcerpts: Excerpt[];
  selectedTag: string | null;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

interface DragState {
  isDragging: boolean;
  draggedId: string | null;
  draggedIndex: number;
  overIndex: number;
  offsetX: number;
  offsetY: number;
  currentX: number;
  currentY: number;
}

function CardFlow({
  bookId,
  bookTitle,
  excerpts,
  setExcerpts,
  filteredExcerpts,
  selectedTag,
  setLoading,
}: CardFlowProps) {
  const [newContent, setNewContent] = useState('');
  const [newInsight, setNewInsight] = useState('');
  const [newTags, setNewTags] = useState('');
  const [showFlash, setShowFlash] = useState(false);
  const [columns, setColumns] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedId: null,
    draggedIndex: -1,
    overIndex: -1,
    offsetX: 0,
    offsetY: 0,
    currentX: 0,
    currentY: 0,
  });

  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    loadExcerpts();
  }, [bookId]);

  useEffect(() => {
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging]);

  function updateColumns() {
    const width = window.innerWidth - 280;
    if (width >= 1400) setColumns(4);
    else if (width >= 1060) setColumns(3);
    else setColumns(2);
  }

  async function loadExcerpts() {
    setLoading(true);
    try {
      const response = await excerptApi.getByBookId(bookId);
      if (response.success && response.data) {
        setExcerpts(response.data);
      }
    } catch (error) {
      console.error('Failed to load excerpts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function refreshTags() {
    try {
      await tagApi.getByBookId(bookId);
    } catch (error) {
      console.error('Failed to refresh tags:', error);
    }
  }

  async function handleAddExcerpt(e: React.FormEvent) {
    e.preventDefault();
    if (!newContent.trim()) return;

    const tags = newTags
      .split(/[,，、\s]+/)
      .map(t => t.trim())
      .filter(Boolean);

    try {
      const response = await excerptApi.create(bookId, {
        content: newContent,
        insight: newInsight,
        tags,
        order: excerpts.length,
      });

      if (response.success && response.data) {
        setExcerpts(prev => [...prev, response.data!]);
        setNewContent('');
        setNewInsight('');
        setNewTags('');
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 300);
        refreshTags();
      }
    } catch (error) {
      console.error('Failed to add excerpt:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除这条摘录吗？')) return;
    try {
      const response = await excerptApi.delete(id);
      if (response.success) {
        setExcerpts(prev => prev.filter(e => e.id !== id));
        refreshTags();
      }
    } catch (error) {
      console.error('Failed to delete excerpt:', error);
    }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      setDragState(prev => ({
        ...prev,
        currentX: e.clientX - prev.offsetX,
        currentY: e.clientY - prev.offsetY,
      }));
      rafRef.current = null;
    });
  }, []);

  const handleMouseUp = useCallback(async () => {
    if (!dragState.isDragging) return;

    const { draggedIndex, overIndex } = dragState;

    if (draggedIndex !== overIndex && overIndex >= 0 && overIndex < excerpts.length) {
      const draggedId = excerpts[draggedIndex].id;
      
      const newExcerpts = [...excerpts];
      const [removed] = newExcerpts.splice(draggedIndex, 1);
      newExcerpts.splice(overIndex, 0, removed);
      
      newExcerpts.forEach((e, i) => {
        e.order = i;
      });
      
      setExcerpts(newExcerpts);

      try {
        await excerptApi.reorder(draggedId, overIndex);
      } catch (error) {
        console.error('Failed to reorder:', error);
        loadExcerpts();
      }
    }

    setDragState({
      isDragging: false,
      draggedId: null,
      draggedIndex: -1,
      overIndex: -1,
      offsetX: 0,
      offsetY: 0,
      currentX: 0,
      currentY: 0,
    });
  }, [dragState, excerpts, setExcerpts]);

  function handleDragStart(e: React.MouseEvent, excerptId: string, index: number) {
    if (selectedTag) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragState({
      isDragging: true,
      draggedId: excerptId,
      draggedIndex: index,
      overIndex: index,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      currentX: e.clientX - rect.left,
      currentY: e.clientY - rect.top,
    });
  }

  function handleDragOver(index: number) {
    if (dragState.isDragging && index !== dragState.overIndex) {
      setDragState(prev => ({ ...prev, overIndex: index }));
    }
  }

  const orderedExcerpts = useMemo(() => {
    if (!dragState.isDragging) return filteredExcerpts;
    
    const result = [...filteredExcerpts];
    const { draggedIndex, overIndex } = dragState;
    
    if (draggedIndex >= 0 && overIndex >= 0 && draggedIndex !== overIndex) {
      const [removed] = result.splice(draggedIndex, 1);
      result.splice(overIndex, 0, removed);
    }
    
    return result;
  }, [filteredExcerpts, dragState]);

  const columnedExcerpts = useMemo(() => {
    const cols: Excerpt[][] = Array.from({ length: columns }, () => []);
    orderedExcerpts.forEach((excerpt, index) => {
      cols[index % columns].push(excerpt);
    });
    return cols;
  }, [orderedExcerpts, columns]);

  const draggedExcerpt = dragState.isDragging
    ? excerpts.find(e => e.id === dragState.draggedId)
    : null;

  return (
    <div ref={containerRef} style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.bookTitle}>📖 {bookTitle}</h2>
        {selectedTag && (
          <div style={styles.filterBadge}>
            筛选：{selectedTag}
          </div>
        )}
        <div style={styles.stats}>
          共 {filteredExcerpts.length} 条摘录
        </div>
      </div>

      <div style={styles.cardContainer}>
        {columnedExcerpts.map((column, colIndex) => (
          <div key={colIndex} style={styles.column}>
            {column.map((excerpt) => {
              const originalIndex = filteredExcerpts.findIndex(e => e.id === excerpt.id);
              const isDragged = dragState.draggedId === excerpt.id;
              
              return (
                <div
                  key={excerpt.id}
                  className="excerpt-card"
                  onMouseDown={(e) => handleDragStart(e, excerpt.id, originalIndex)}
                  onMouseEnter={() => handleDragOver(originalIndex)}
                  style={{
                    ...styles.card,
                    ...(isDragged ? styles.cardDragging : {}),
                    ...(dragState.overIndex === originalIndex && !isDragged ? styles.cardDragOver : {}),
                  }}
                >
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(excerpt.id);
                    }}
                    style={styles.deleteButton}
                  >
                    ×
                  </button>

                  <div style={styles.contentText}>
                    "{excerpt.content}"
                  </div>

                  {excerpt.insight && (
                    <div style={styles.insightText}>
                      💭 {excerpt.insight}
                    </div>
                  )}

                  <div style={styles.tagsContainer}>
                    {excerpt.tags.map((tag) => (
                      <span key={tag} style={styles.tagBubble}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {filteredExcerpts.length === 0 && (
          <div style={styles.emptyCards}>
            <p style={styles.emptyCardsText}>
              {selectedTag ? '该标签下暂无摘录' : '还没有摘录，从下方添加第一条吧！'}
            </p>
          </div>
        )}
      </div>

      {draggedExcerpt && (
        <div
          style={{
            ...styles.card,
            ...styles.draggedCard,
            left: dragState.currentX,
            top: dragState.currentY,
          }}
        >
          <div style={styles.contentText}>
            "{draggedExcerpt.content}"
          </div>
          {draggedExcerpt.insight && (
            <div style={styles.insightText}>
              💭 {draggedExcerpt.insight}
            </div>
          )}
          <div style={styles.tagsContainer}>
            {draggedExcerpt.tags.map((tag) => (
              <span key={tag} style={styles.tagBubble}>
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          ...styles.inputContainer,
          ...(showFlash ? { animation: 'greenFlash 0.3s ease-out' } : {}),
        }}
      >
        <form onSubmit={handleAddExcerpt} style={styles.form}>
          <textarea
            style={styles.textarea}
            placeholder="📝 输入原文摘录..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={2}
          />
          <textarea
            style={styles.textarea}
            placeholder="💡 我的感悟..."
            value={newInsight}
            onChange={(e) => setNewInsight(e.target.value)}
            rows={2}
          />
          <div style={styles.formRow}>
            <input
              style={styles.input}
              placeholder="🏷️ 标签（用逗号分隔）"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
            />
            <button
              type="submit"
              className="add-btn"
              style={{
                ...styles.addButton,
                ...(newContent.trim() ? {} : styles.addButtonDisabled),
              }}
              disabled={!newContent.trim()}
            >
              保存摘录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 32px',
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
    flexShrink: 0,
  },
  bookTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#1E293B',
  },
  filterBadge: {
    backgroundColor: '#3B82F6',
    color: '#fff',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  },
  stats: {
    marginLeft: 'auto',
    fontSize: '14px',
    color: '#64748B',
  },
  cardContainer: {
    flex: 1,
    display: 'flex',
    gap: '20px',
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingBottom: '20px',
    alignContent: 'flex-start',
  },
  column: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    minWidth: '320px',
  },
  card: {
    width: '320px',
    backgroundColor: '#fff',
    border: '2px dashed #CBD5E1',
    borderRadius: '12px',
    padding: '20px',
    position: 'relative',
    transition: 'all 0.2s ease',
    cursor: 'grab',
    flexShrink: 0,
  } as React.CSSProperties,
  cardDragging: {
    opacity: 0.4,
    cursor: 'grabbing',
  },
  cardDragOver: {
    transform: 'translateY(8px)',
    borderStyle: 'solid',
    borderColor: '#3B82F6',
  },
  draggedCard: {
    position: 'fixed',
    zIndex: 1000,
    opacity: 0.9,
    cursor: 'grabbing',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
    pointerEvents: 'none',
    transform: 'rotate(2deg)',
  },
  contentText: {
    fontSize: '14px',
    lineHeight: 1.7,
    color: '#1E293B',
    marginBottom: '12px',
    fontStyle: 'italic',
  },
  insightText: {
    fontSize: '13px',
    lineHeight: 1.6,
    color: '#475569',
    marginBottom: '12px',
    padding: '8px 12px',
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    borderLeft: '3px solid #3B82F6',
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  tagBubble: {
    backgroundColor: '#3B82F6',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 500,
  },
  deleteButton: {
    position: 'absolute',
    top: '8px',
    right: '12px',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: '#94A3B8',
    cursor: 'pointer',
    opacity: 0,
    transition: 'all 0.2s ease',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  emptyCards: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
  },
  emptyCardsText: {
    fontSize: '15px',
    color: '#94A3B8',
    textAlign: 'center',
  },
  inputContainer: {
    flexShrink: 0,
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.06)',
    marginTop: '16px',
    transition: 'all 0.2s ease',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  addButton: {
    padding: '12px 24px',
    backgroundColor: '#3B82F6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  addButtonDisabled: {
    backgroundColor: '#CBD5E1',
    cursor: 'not-allowed',
  },
};

export default CardFlow;
