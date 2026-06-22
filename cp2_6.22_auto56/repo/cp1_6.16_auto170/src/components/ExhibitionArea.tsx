import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { useStore } from '../stores/store';
import BookCard from '../components/BookCard';
import ThemeTag from '../components/ThemeTag';
import { ItemTypes, BookDragItem, THEME_COLORS } from '../types';

const ExhibitionArea: React.FC = () => {
  const {
    currentExhibition,
    books,
    createNewExhibition,
    addBookToExhibition,
    addBookToTheme,
    removeBookFromExhibition,
    removeBookFromTheme,
    addTheme,
    saveExhibition,
  } = useStore();

  const [title, setTitle] = useState('我的书展');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [selectedColor, setSelectedColor] = useState(THEME_COLORS[0]);
  const [newBookIds, setNewBookIds] = useState<Set<string>>(new Set());
  const [pulsingThemeId, setPulsingThemeId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentExhibition) {
      setTitle(currentExhibition.title);
    }
  }, [currentExhibition]);

  const [{ isOver, canDrop }, drop] = useDrop<BookDragItem, unknown, { isOver: boolean; canDrop: boolean }>(() => ({
    accept: ItemTypes.BOOK,
    drop: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (didDrop) return;

      if (item.source === 'shelf') {
        addBookToExhibition(item.bookId);
        triggerBookAnimation(item.bookId);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [addBookToExhibition]);

  const triggerBookAnimation = useCallback((bookId: string) => {
    setNewBookIds((prev) => new Set(prev).add(bookId));
    setTimeout(() => {
      setNewBookIds((prev) => {
        const next = new Set(prev);
        next.delete(bookId);
        return next;
      });
    }, 300);
  }, []);

  const triggerThemePulse = useCallback((themeId: string) => {
    setPulsingThemeId(themeId);
    setTimeout(() => {
      setPulsingThemeId(null);
    }, 600);
  }, []);

  const handleCreateNewExhibition = () => {
    createNewExhibition(title);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (currentExhibition) {
      useStore.setState({
        currentExhibition: {
          ...currentExhibition,
          title: e.target.value,
          updatedAt: new Date().toISOString(),
        },
      });
    }
  };

  const handleSaveDraft = () => {
    if (currentExhibition) {
      saveExhibition('draft');
    }
  };

  const handlePublish = () => {
    if (currentExhibition) {
      saveExhibition('published');
    }
  };

  const handleOpenAddTheme = () => {
    setNewThemeName('');
    setSelectedColor(THEME_COLORS[0]);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setNewThemeName('');
  };

  const handleAddTheme = () => {
    if (newThemeName.trim()) {
      addTheme(newThemeName.trim(), selectedColor);
      handleCloseDialog();
    }
  };

  const handleDropBookToTheme = useCallback((themeId: string, bookId: string) => {
    addBookToTheme(themeId, bookId);
    triggerThemePulse(themeId);
    triggerBookAnimation(bookId);
  }, [addBookToTheme, triggerThemePulse, triggerBookAnimation]);

  const handleRemoveBookFromExhibition = (bookId: string) => {
    removeBookFromExhibition(bookId);
  };

  const handleRemoveBookFromTheme = (themeId: string, bookId: string) => {
    removeBookFromTheme(themeId, bookId);
  };

  const getBookById = (bookId: string) => {
    return books.find((b) => b.id === bookId);
  };

  drop(containerRef);

  const hasBooks = currentExhibition && (
    currentExhibition.uncategorizedBooks.length > 0 ||
    currentExhibition.themes.some((t) => t.bookIds.length > 0)
  );

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#FFF8E7',
        backgroundImage: `
          linear-gradient(to right, #E0D5C1 1px, transparent 1px),
          linear-gradient(to bottom, #E0D5C1 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        overflowY: 'auto',
        padding: '24px',
        boxSizing: 'border-box',
        outline: isOver && canDrop ? '2px dashed var(--primary-color)' : 'none',
        transition: 'outline 0.15s ease',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="输入书展标题"
            style={{
              flex: 1,
              minWidth: '200px',
              fontSize: '24px',
              fontWeight: 700,
              border: '2px dashed transparent',
              background: 'transparent',
              padding: '8px 12px',
              borderRadius: '8px',
              outline: 'none',
              transition: 'all 0.15s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--primary-color)';
              e.target.style.backgroundColor = 'var(--color-surface)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'transparent';
              e.target.style.backgroundColor = 'transparent';
            }}
          />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {!currentExhibition ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCreateNewExhibition}
              >
                + 创建新书展
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleSaveDraft}
                >
                  保存草稿
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handlePublish}
                >
                  发布书展
                </button>
              </>
            )}
          </div>
        </div>

        {currentExhibition && (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
              padding: '12px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '12px',
              flexWrap: 'wrap',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                flex: 1,
              }}>
                {currentExhibition.themes.map((theme) => (
                  <ThemeTag
                    key={theme.id}
                    theme={theme}
                    isPulsing={pulsingThemeId === theme.id}
                    onRemove={() => useStore.getState().removeTheme(theme.id)}
                    onDropBook={(bookId) => handleDropBookToTheme(theme.id, bookId)}
                  />
                ))}
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleOpenAddTheme}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                + 添加主题
              </button>
            </div>

            {!hasBooks && (
              <div className="empty-state" style={{
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                borderRadius: '16px',
                margin: '48px 0',
              }}>
                <div className="empty-icon">📚</div>
                <p className="empty-text">从左侧书库拖拽书籍到此处</p>
                <p className="empty-hint">或点击上方按钮添加主题进行分类</p>
              </div>
            )}

            {currentExhibition.themes.length > 0 && currentExhibition.themes.map((theme) => (
              <div key={theme.id} className="theme-section" style={{ marginBottom: '32px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                  paddingBottom: '8px',
                  borderBottom: `2px solid ${theme.color}`,
                }}>
                  <div style={{
                    width: '4px',
                    height: '24px',
                    borderRadius: '2px',
                    backgroundColor: theme.color,
                  }} />
                  <input
                    type="text"
                    value={theme.name}
                    onChange={(e) => {
                      const updated = { ...theme, name: e.target.value };
                      useStore.setState({
                        currentExhibition: {
                          ...currentExhibition,
                          themes: currentExhibition.themes.map((t) =>
                            t.id === theme.id ? updated : t
                          ),
                          updatedAt: new Date().toISOString(),
                        },
                      });
                    }}
                    style={{
                      fontSize: '20px',
                      fontWeight: 600,
                      border: '2px dashed transparent',
                      background: 'transparent',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      outline: 'none',
                      flex: 1,
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = theme.color;
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'transparent';
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  />
                  <span style={{
                    fontSize: '14px',
                    color: 'var(--color-text-muted)',
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    padding: '2px 10px',
                    borderRadius: '10px',
                  }}>
                    {theme.bookIds.length} 本书
                  </span>
                </div>
                <div
                  style={{
                    minHeight: '200px',
                    padding: '16px',
                    border: `2px dashed ${theme.color}40`,
                    borderRadius: '12px',
                    backgroundColor: `${theme.color}10`,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {theme.bookIds.length === 0 ? (
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-text-muted)',
                      fontSize: '14px',
                    }}>
                      将书籍拖拽到此处，或拖到上方主题标签
                    </div>
                  ) : (
                    theme.bookIds.map((bookId) => {
                      const book = getBookById(bookId);
                      if (!book) return null;
                      return (
                        <BookCard
                          key={bookId}
                          book={book}
                          source="theme"
                          themeId={theme.id}
                          showRemove
                          isNew={newBookIds.has(bookId)}
                          onRemove={() => handleRemoveBookFromTheme(theme.id, bookId)}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            ))}

            {currentExhibition.uncategorizedBooks.length > 0 && (
              <div className="uncategorized-section">
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                  }}>
                    未分类书籍
                  </h3>
                  <span style={{
                    fontSize: '14px',
                    color: 'var(--color-text-muted)',
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    padding: '2px 10px',
                    borderRadius: '10px',
                  }}>
                    {currentExhibition.uncategorizedBooks.length} 本书
                  </span>
                </div>
                <div style={{
                  minHeight: '200px',
                  padding: '16px',
                  border: '2px dashed var(--color-border)',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}>
                  {currentExhibition.uncategorizedBooks.map((bookId) => {
                    const book = getBookById(bookId);
                    if (!book) return null;
                    return (
                      <BookCard
                        key={bookId}
                        book={book}
                        source="exhibition"
                        showRemove
                        isNew={newBookIds.has(bookId)}
                        onRemove={() => handleRemoveBookFromExhibition(bookId)}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {!currentExhibition && (
          <div className="empty-state" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            borderRadius: '16px',
            margin: '80px 0',
          }}>
            <div className="empty-icon">✨</div>
            <p className="empty-text">开始创建你的第一个书展</p>
            <p className="empty-hint">点击上方"创建新书展"按钮开始</p>
          </div>
        )}

        {isDialogOpen && (
          <div className="modal-overlay" onClick={handleCloseDialog}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">添加新主题</h3>
                <button
                  type="button"
                  className="modal-close"
                  onClick={handleCloseDialog}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                    marginBottom: '8px',
                  }}>
                    主题名称
                  </label>
                  <input
                    type="text"
                    value={newThemeName}
                    onChange={(e) => setNewThemeName(e.target.value)}
                    placeholder="输入主题名称"
                    style={{ width: '100%' }}
                    autoFocus
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                    marginBottom: '12px',
                  }}>
                    选择主题色
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '12px',
                  }}>
                    {THEME_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          borderRadius: '8px',
                          backgroundColor: color,
                          border: selectedColor === color
                            ? '3px solid var(--color-text-primary)'
                            : '2px solid transparent',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          transform: selectedColor === color ? 'scale(1.1)' : 'scale(1)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseDialog}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddTheme}
                  disabled={!newThemeName.trim()}
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExhibitionArea;
