import { useState, useEffect, useCallback } from 'react';
import WordCloud from './WordCloud';
import HistoryChart from './HistoryChart';
import NotePanel from './NotePanel';
import type { KeywordWeight, HistoryDayData, NoteItem, TrendsResponse, HistoryResponse, PresetTagsResponse } from './types';

const App = () => {
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState<KeywordWeight[]>([]);
  const [history, setHistory] = useState<HistoryDayData[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');
  const [presetTags, setPresetTags] = useState<string[]>([]);
  const [showCloud, setShowCloud] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetch('/api/preset-tags')
      .then(res => res.json())
      .then((data: PresetTagsResponse) => {
        setPresetTags(data.tags);
      })
      .catch(err => console.error('Failed to fetch tags:', err));
  }, []);

  const fetchTrends = useCallback(async (searchTopic: string) => {
    if (searchTopic.trim()) {
      setLoading(true);
      setShowCloud(false);
      
      const startTime = performance.now();
      
      try {
        const [trendsRes, historyRes] = await Promise.all([
          fetch(`/api/trends/${encodeURIComponent(searchTopic)}`),
          fetch(`/api/history/${encodeURIComponent(searchTopic)}`)
        ]);
        
        const trendsData: TrendsResponse = await trendsRes.json();
        const historyData: HistoryResponse = await historyRes.json();
        
        setKeywords(trendsData.keywords.slice(0, 100));
        setHistory(historyData.history);
        
        const elapsed = performance.now() - startTime;
        const remaining = Math.max(0, 600 - elapsed);
        
        setTimeout(() => {
          setShowCloud(true);
          setLoading(false);
        }, remaining);
      } catch (err) {
        console.error('Failed to fetch trends:', err);
        setLoading(false);
      }
    }
  }, []);

  const handleAnalyze = () => {
    if (topic.trim()) {
      fetchTrends(topic.trim());
      setSelectedTag('');
    }
  };

  const handleTagClick = (tag: string) => {
    setTopic(tag);
    setSelectedTag(tag);
    fetchTrends(tag);
  };

  const handleWordClick = (word: KeywordWeight) => {
    setNotes(prev => {
      const exists = prev.some(n => n.id === word.id);
      if (exists) return prev;
      return [...prev, { ...word }];
    });
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnalyze();
    }
  };

  return (
    <div style={styles.appContainer}>
      <h1 style={styles.header}>
        <span style={styles.headerIcon}>✨</span>
        <span>灵感词云</span>
        <span style={styles.headerSubtitle}>短视频创作者话题追踪工具</span>
      </h1>

      <div style={{
        ...styles.mainContent,
        ...(isMobile ? { gridTemplateColumns: '1fr' } : {})
      }}>
        <div
          style={styles.leftPanel}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#6366F1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#374151';
          }}
        >
          <div style={styles.searchSection}>
            <div style={styles.tagContainer}>
              <div style={styles.tagScroll}>
                {presetTags.map(tag => (
                  <button
                    key={tag}
                    style={{
                      ...styles.tag,
                      ...(selectedTag === tag ? styles.tagSelected : {})
                    }}
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              ...styles.inputRow,
              ...(isMobile ? { flexDirection: 'column', alignItems: 'stretch' } : {})
            }}>
              <input
                type="text"
                style={{
                  ...styles.input,
                  ...(isMobile ? { width: '100%' } : {})
                }}
                placeholder='输入话题关键词，如"旅行"、"科技"...'
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={handleKeyPress}
                onFocus={(e) => {
                  e.target.style.borderImage = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                  e.target.style.borderImageSlice = '1';
                }}
                onBlur={(e) => {
                  e.target.style.borderImage = 'none';
                  e.target.style.border = '2px solid #374151';
                }}
              />
              <button
                style={{
                  ...styles.analyzeButton,
                  ...(isMobile ? { width: '100%' } : {})
                }}
                onClick={handleAnalyze}
                disabled={loading || !topic.trim()}
              >
                {loading ? '分析中...' : '分析'}
              </button>
            </div>
          </div>

          <div style={{
            ...styles.wordCloudSection,
            ...(isMobile ? { minHeight: '400px' } : {})
          }}>
            {loading && <div style={styles.loadingText}>正在生成词云...</div>}
            {!loading && keywords.length > 0 && (
              <div className={showCloud ? 'fade-in' : ''} style={{ opacity: showCloud ? 1 : 0, transition: 'opacity 0.5s ease' }}>
                <WordCloud
                  keywords={keywords}
                  onWordClick={handleWordClick}
                />
              </div>
            )}
            {!loading && keywords.length === 0 && (
              <div style={styles.placeholder}>
              <div style={styles.placeholderIcon}>☁️</div>
              <div style={styles.placeholderText}>输入话题或选择标签开始分析</div>
            </div>
            )}
          </div>
        </div>

        <div style={styles.rightPanel}>
          <div
            style={styles.historySection}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#6366F1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#374151';
            }}
          >
            <HistoryChart history={history} />
          </div>
          
          <div
            style={styles.notesSection}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#6366F1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#374151';
            }}
          >
            <NotePanel
              notes={notes}
              onDelete={handleDeleteNote}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    minHeight: '100vh',
    backgroundColor: '#1F2937',
    color: '#F9FAFB',
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
    fontSize: '28px',
    fontWeight: '700',
  },
  headerIcon: {
    fontSize: '32px',
  },
  headerSubtitle: {
    fontSize: '14px',
    fontWeight: '400',
    color: '#9CA3AF',
    marginLeft: '12px',
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  leftPanel: {
    backgroundColor: '#111827',
    border: '2px solid #374151',
    borderRadius: '12px',
    padding: '20px',
    transition: 'border-color 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  searchSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  tagContainer: {
    overflow: 'hidden',
  },
  tagScroll: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '8px',
    scrollbarWidth: 'thin',
  },
  tag: {
    height: '32px',
    padding: '0 16px',
    borderRadius: '16px',
    border: 'none',
    backgroundColor: '#374151',
    color: '#F9FAFB',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  tagSelected: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#FFFFFF',
    transform: 'scale(1.05)',
  },
  inputRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  input: {
    width: '400px',
    height: '48px',
    padding: '0 20px',
    borderRadius: '12px',
    border: '2px solid #374151',
    backgroundColor: '#F0F0F0',
    color: '#1F2937',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  analyzeButton: {
    height: '48px',
    padding: '0 28px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#FFFFFF',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  wordCloudSection: {
    flex: 1,
    minHeight: '500px',
    position: 'relative',
  },
  loadingText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '500px',
    fontSize: '16px',
    color: '#9CA3AF',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '500px',
    gap: '16px',
  },
  placeholderIcon: {
    fontSize: '64px',
    opacity: '0.3',
  },
  placeholderText: {
    fontSize: '16px',
    color: '#9CA3AF',
  },
  historySection: {
    backgroundColor: '#1F2937',
    border: '2px solid #374151',
    borderRadius: '12px',
    padding: '20px',
    transition: 'border-color 0.3s ease',
    minHeight: '300px',
  },
  notesSection: {
    backgroundColor: '#1F2937',
    border: '2px solid #374151',
    borderRadius: '12px',
    padding: '20px',
    transition: 'border-color 0.3s ease',
    minHeight: '300px',
  },
};

export default App;
