import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import CardManager from './modules/card-manager/CardManager';
import NetworkVisualizer from './modules/network-visualizer/NetworkVisualizer';
import type { Card, SimilarityPair } from './types';
import axios from 'axios';

interface AppContextType {
  cards: Card[];
  similarities: SimilarityPair[];
  selectedCardId: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectCard: (id: string | null) => void;
  refreshCards: () => Promise<void>;
  networkContainerRef: React.RefObject<HTMLDivElement | null>;
}

export const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};

const App: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [similarities, setSimilarities] = useState<SimilarityPair[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [mobileView, setMobileView] = useState<'editor' | 'network'>('editor');
  const networkContainerRef = useRef<HTMLDivElement>(null);

  const refreshCards = useCallback(async () => {
    try {
      const [cardsRes, simRes] = await Promise.all([
        axios.get('/api/cards'),
        axios.get('/api/cards/similarity')
      ]);
      setCards(cardsRes.data);
      setSimilarities(simRes.data);
    } catch (e) {
      console.error('加载卡片失败', e);
    }
  }, []);

  useEffect(() => {
    refreshCards();
  }, [refreshCards]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsSmallMobile(window.innerWidth < 480);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const selectCard = useCallback((id: string | null) => {
    setSelectedCardId(id);
  }, []);

  const contextValue: AppContextType = {
    cards,
    similarities,
    selectedCardId,
    searchQuery,
    setSearchQuery,
    selectCard,
    refreshCards,
    networkContainerRef
  };

  const filteredCards = cards.filter(card => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      card.title.toLowerCase().includes(q) ||
      card.tags.some(tag => tag.toLowerCase().includes(q))
    );
  });

  return (
    <AppContext.Provider value={contextValue}>
      <div style={styles.app}>
        <header style={styles.topBar}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>✨</span>
            <span style={styles.logoText}>灵感网络</span>
          </div>
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="搜索标题或标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366F1';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'transparent';
              }}
            />
            <svg style={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          {isSmallMobile && (
            <div style={styles.mobileToggle}>
              <button
                style={{
                  ...styles.toggleBtn,
                  backgroundColor: mobileView === 'editor' ? '#6366F1' : '#1E293B'
                }}
                onClick={() => setMobileView('editor')}
              >
                编辑
              </button>
              <button
                style={{
                  ...styles.toggleBtn,
                  backgroundColor: mobileView === 'network' ? '#6366F1' : '#1E293B'
                }}
                onClick={() => setMobileView('network')}
              >
                图谱
              </button>
            </div>
          )}
        </header>

        <div style={styles.mainContent}>
          {(!isSmallMobile || mobileView === 'editor') && (
            <div style={styles.leftPanel}>
              <div style={styles.editorSection}>
                <CardEditor onSubmit={refreshCards} />
              </div>
              <div style={styles.networkSection} ref={networkContainerRef}>
                <NetworkVisualizer
                  cards={filteredCards}
                  similarities={similarities}
                  selectedCardId={selectedCardId}
                  searchQuery={searchQuery}
                  onSelectCard={selectCard}
                />
              </div>
            </div>
          )}

          {(!isSmallMobile || mobileView === 'network') && isSmallMobile && (
            <div style={{ ...styles.networkSection, height: '100%' }} ref={networkContainerRef}>
              <NetworkVisualizer
                cards={filteredCards}
                similarities={similarities}
                selectedCardId={selectedCardId}
                searchQuery={searchQuery}
                onSelectCard={selectCard}
              />
            </div>
          )}

          {!isMobile && (
            <aside style={styles.rightPanel}>
              <CardManager cards={filteredCards} />
            </aside>
          )}

          {isMobile && !isSmallMobile && (
            <>
              <button style={styles.drawerToggle} onClick={() => setShowDrawer(!showDrawer)}>
                {showDrawer ? '收起卡片' : '查看卡片'}
              </button>
              {showDrawer && (
                <div style={styles.drawer}>
                  <CardManager cards={filteredCards} />
                </div>
              )}
            </>
          )}

          {isSmallMobile && mobileView === 'editor' && (
            <div style={styles.mobileCardPanel}>
              <CardManager cards={filteredCards} />
            </div>
          )}
        </div>
      </div>
    </AppContext.Provider>
  );
};

const CardEditor: React.FC<{ onSubmit: () => Promise<void> }> = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && tags.length < 3 && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async () => {
    if (!title.trim() && !content.trim()) return;
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await axios.post('/api/cards', { title, content, tags });
      setTitle('');
      setContent('');
      setTags([]);
      await onSubmit();
    } catch (e) {
      console.error('创建卡片失败', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.editorContainer}>
      <div style={styles.editorHeader}>
        <h3 style={styles.editorTitle}>✨ 记录灵感</h3>
        <button
          style={styles.submitBtn}
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? '提交中...' : '保存卡片'}
        </button>
      </div>
      <input
        type="text"
        placeholder="给灵感起个标题..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={styles.titleInput}
      />
      <textarea
        placeholder="在这里写下你的灵感碎片..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={styles.contentEditor}
      />
      <div style={styles.tagSection}>
        <div style={styles.tagInputWrapper}>
          <input
            type="text"
            placeholder="添加标签（最多3个）"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            style={styles.tagInput}
          />
          <button
            style={styles.addTagBtn}
            onClick={handleAddTag}
            disabled={tags.length >= 3}
          >
            + 添加
          </button>
        </div>
        <div style={styles.tagsDisplay}>
          {tags.map(tag => (
            <span key={tag} style={styles.tagBubble}>
              {tag}
              <button
                style={styles.tagRemoveBtn}
                onClick={() => handleRemoveTag(tag)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  app: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#0F172A',
    overflow: 'hidden' as const
  },
  topBar: {
    height: '60px',
    minHeight: '60px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    backgroundColor: '#0F172A',
    borderBottom: '1px solid #1E293B',
    gap: '20px'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  logoIcon: {
    fontSize: '24px'
  },
  logoText: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#FFFFFF'
  },
  searchContainer: {
    position: 'relative' as const,
    width: '400px',
    flexShrink: 0
  },
  searchInput: {
    width: '100%',
    padding: '12px 40px 12px 16px',
    backgroundColor: '#1E293B',
    border: '2px solid transparent',
    borderRadius: '40px',
    color: '#FFFFFF',
    fontSize: '14px'
  },
  searchIcon: {
    position: 'absolute' as const,
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94A3B8'
  },
  mobileToggle: {
    display: 'flex',
    gap: '8px',
    marginLeft: 'auto'
  },
  toggleBtn: {
    padding: '8px 16px',
    borderRadius: '20px',
    color: '#FFFFFF',
    fontSize: '13px'
  },
  mainContent: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    overflow: 'hidden',
    position: 'relative' as const
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: '#0F172A'
  },
  editorSection: {
    flex: '0 0 auto',
    backgroundColor: '#F8FAFC',
    borderRadius: '0',
    padding: '20px',
    overflow: 'auto'
  },
  networkSection: {
    flex: 1,
    position: 'relative' as const,
    minHeight: 0
  },
  rightPanel: {
    backgroundColor: '#F8FAFC',
    borderLeft: '1px solid #E2E8F0',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  editorContainer: {
    maxWidth: '800px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  editorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  editorTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#0F172A',
    margin: 0
  },
  submitBtn: {
    padding: '10px 24px',
    backgroundColor: '#6366F1',
    color: '#FFFFFF',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500
  },
  titleInput: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '18px',
    fontWeight: 600,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px'
  },
  contentEditor: {
    width: '100%',
    minHeight: '200px',
    padding: '16px',
    fontSize: '16px',
    lineHeight: '1.8',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    resize: 'vertical' as const
  },
  tagSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  tagInputWrapper: {
    display: 'flex',
    gap: '10px'
  },
  tagInput: {
    flex: 1,
    padding: '10px 14px',
    fontSize: '14px',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px'
  },
  addTagBtn: {
    padding: '10px 16px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    borderRadius: '8px',
    fontSize: '14px'
  },
  tagsDisplay: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  tagBubble: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    borderRadius: '16px',
    fontSize: '13px'
  },
  tagRemoveBtn: {
    background: 'none',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '16px',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1
  },
  drawerToggle: {
    position: 'fixed' as const,
    bottom: '20px',
    right: '20px',
    padding: '12px 24px',
    backgroundColor: '#6366F1',
    color: '#FFFFFF',
    borderRadius: '24px',
    fontSize: '14px',
    fontWeight: 500,
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
    zIndex: 100
  },
  drawer: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '50vh',
    backgroundColor: '#F8FAFC',
    borderRadius: '16px 16px 0 0',
    zIndex: 90,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  mobileCardPanel: {
    height: '50%',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden'
  }
} as const;

export default App;
