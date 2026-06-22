import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Download, X } from 'lucide-react';
import { useCardStore, TagType } from './stores/cardStore';
import Card from './components/Card';

const TAGS: TagType[] = ['创意', '工作', '学习', '生活'];

export default function App() {
  const { cards, searchQuery, addCard, removeCard, updateCardPosition, setSearchQuery, clearNewFlag, exportToJson } = useCardStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [newCardContent, setNewCardContent] = useState('');
  const [selectedTag, setSelectedTag] = useState<TagType>('创意');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isModalOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isModalOpen]);
  
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);
  
  const handleOpenModal = () => {
    setIsModalOpen(true);
    setNewCardContent('');
    setSelectedTag('创意');
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  const handleSaveCard = () => {
    if (newCardContent.trim()) {
      addCard(newCardContent.trim(), selectedTag);
      handleCloseModal();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSaveCard();
    }
    if (e.key === 'Escape') {
      handleCloseModal();
    }
  };
  
  const handleCardDragEnd = (id: string, x: number, y: number) => {
    updateCardPosition(id, x, y);
  };
  
  const handleExport = () => {
    const json = exportToJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '灵感卡片.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchQuery('');
    }
  };
  
  const isCardHighlighted = (content: string, tag: string) => {
    if (!searchQuery.trim()) return false;
    const query = searchQuery.toLowerCase();
    return content.toLowerCase().includes(query) || tag.toLowerCase().includes(query);
  };
  
  const isCardDimmed = (content: string, tag: string) => {
    if (!searchQuery.trim()) return false;
    return !isCardHighlighted(content, tag);
  };
  
  const sortedCards = [...cards].sort((a, b) => {
    if (a.isNew && !b.isNew) return 1;
    if (!a.isNew && b.isNew) return -1;
    return 0;
  });
  
  return (
    <div className="app" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <header
        className="toolbar"
        style={{
          height: '56px',
          backgroundColor: 'var(--color-toolbar-bg)',
          borderBottom: '1px solid var(--color-toolbar-shadow)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        <div
          className="app-title"
          style={{
            fontSize: '18px',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            letterSpacing: '0.5px',
          }}
        >
          灵感速写板
        </div>
        
        <div className="toolbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn-new"
            onClick={handleOpenModal}
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s ease-out',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-primary-hover)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-primary)';
            }}
          >
            <Plus size={16} />
            新建卡片
          </button>
          
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            {isSearchOpen && (
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索灵感..."
                style={{
                  width: '200px',
                  height: '34px',
                  padding: '0 12px 0 36px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease-out, width 0.25s ease-out',
                  backgroundColor: 'var(--color-bg)',
                }}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = 'var(--color-primary)';
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = 'var(--color-border)';
                }}
              />
            )}
            <button
              className="btn-icon"
              onClick={toggleSearch}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-tertiary)',
                transition: 'background-color 0.2s ease-out, color 0.2s ease-out',
                position: isSearchOpen ? 'absolute' : 'relative',
                left: isSearchOpen ? '6px' : 0,
                zIndex: 1,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)';
              }}
            >
              {isSearchOpen ? <X size={16} /> : <Search size={16} />}
            </button>
          </div>
          
          <button
            className="btn-text"
            onClick={handleExport}
            style={{
              color: 'var(--color-text-tertiary)',
              fontSize: '14px',
              padding: '8px 12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.2s ease-out, background-color 0.2s ease-out',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)';
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
          >
            <Download size={16} />
            导出 JSON
          </button>
        </div>
      </header>
      
      {/* Canvas */}
      <main
        className="canvas"
        style={{
          flex: 1,
          marginTop: '56px',
          backgroundColor: 'var(--color-bg)',
          position: 'relative',
          overflow: 'auto',
        }}
      >
        <div
          className="canvas-content"
          style={{
            position: 'relative',
            width: '100%',
            minWidth: '100%',
            minHeight: 'calc(100vh - 56px)',
          }}
        >
          {sortedCards.map((card) => (
            <Card
              key={card.id}
              card={card}
              isHighlighted={isCardHighlighted(card.content, card.tag)}
              isDimmed={isCardDimmed(card.content, card.tag)}
              onRemove={removeCard}
              onDragEnd={handleCardDragEnd}
              onAnimationEnd={clearNewFlag}
            />
          ))}
        </div>
      </main>
      
      {/* Modal */}
      {isModalOpen && (
        <>
          <div
            className="modal-backdrop backdrop-enter"
            onClick={handleCloseModal}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(4px)',
              zIndex: 200,
            }}
          />
          <div
            className="modal modal-enter"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '400px',
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
              padding: '24px',
              zIndex: 201,
            }}
            onKeyDown={handleKeyDown}
          >
            <div className="modal-tags" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  className={`tag-pill ${selectedTag === tag ? 'active' : ''}`}
                  onClick={() => setSelectedTag(tag)}
                  style={{
                    height: '28px',
                    padding: '0 14px',
                    borderRadius: '14px',
                    fontSize: '13px',
                    fontWeight: 500,
                    backgroundColor: selectedTag === tag ? 'var(--color-primary)' : 'var(--color-border-light)',
                    color: selectedTag === tag ? 'white' : 'var(--color-text-tertiary)',
                    transition: 'background-color 0.2s ease-out, color 0.2s ease-out',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedTag !== tag) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ddd';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTag !== tag) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-border-light)';
                    }
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
            
            <textarea
              ref={textareaRef}
              value={newCardContent}
              onChange={(e) => setNewCardContent(e.target.value)}
              placeholder="记录你的灵感..."
              style={{
                width: '100%',
                height: '120px',
                padding: '12px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '14px',
                lineHeight: 1.6,
                resize: 'none',
                outline: 'none',
                transition: 'border-color 0.2s ease-out',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => {
                (e.target as HTMLTextAreaElement).style.borderColor = 'var(--color-primary)';
              }}
              onBlur={(e) => {
                (e.target as HTMLTextAreaElement).style.borderColor = 'var(--color-border)';
              }}
            />
            
            <div
              className="modal-actions"
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '20px',
              }}
            >
              <button
                className="btn-cancel"
                onClick={handleCloseModal}
                style={{
                  padding: '8px 20px',
                  fontSize: '14px',
                  color: 'var(--color-text-tertiary)',
                  borderRadius: '8px',
                  transition: 'color 0.2s ease-out, background-color 0.2s ease-out',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                }}
              >
                取消
              </button>
              <button
                className="btn-save"
                onClick={handleSaveCard}
                disabled={!newCardContent.trim()}
                style={{
                  padding: '8px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s ease-out, opacity 0.2s ease-out',
                  opacity: newCardContent.trim() ? 1 : 0.5,
                  cursor: newCardContent.trim() ? 'pointer' : 'not-allowed',
                }}
                onMouseEnter={(e) => {
                  if (newCardContent.trim()) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-primary-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-primary)';
                }}
              >
                保存
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
