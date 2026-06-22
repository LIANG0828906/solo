import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { search, SearchResult } from '../../modules/search/searchEngine';
import { useFeedbackStore, FeedbackRating } from '../../modules/feedback/feedbackStore';

interface FeedbackPanelState {
  isOpen: boolean;
  result: SearchResult | null;
  rating: FeedbackRating | null;
  question: string;
}

export default function QAPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showEmptyIllustration, setShowEmptyIllustration] = useState(false);
  const [showEmptyText, setShowEmptyText] = useState(false);
  const [feedbackPanel, setFeedbackPanel] = useState<FeedbackPanelState>({
    isOpen: false,
    result: null,
    rating: null,
    question: ''
  });
  const [remark, setRemark] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emptyTextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addFeedback = useFeedbackStore(state => state.addFeedback);

  const clearAllTimers = useCallback(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    if (emptyTextTimerRef.current) {
      clearTimeout(emptyTextTimerRef.current);
      emptyTextTimerRef.current = null;
    }
    if (feedbackCloseTimerRef.current) {
      clearTimeout(feedbackCloseTimerRef.current);
      feedbackCloseTimerRef.current = null;
    }
  }, []);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    clearAllTimers();
    setIsSearching(true);
    setHasSearched(true);
    setShowEmptyIllustration(false);
    setShowEmptyText(false);
    searchTimerRef.current = setTimeout(() => {
      searchTimerRef.current = null;
      const searchResults = search(query);
      setResults(searchResults);
      setIsSearching(false);
      if (searchResults.length === 0) {
        setShowEmptyIllustration(true);
        emptyTextTimerRef.current = setTimeout(() => {
          emptyTextTimerRef.current = null;
          setShowEmptyText(true);
        }, 3000);
      }
    }, 10);
  }, [query, clearAllTimers]);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const openFeedbackPanel = (result: SearchResult, rating: FeedbackRating) => {
    setFeedbackPanel({
      isOpen: true,
      result,
      rating,
      question: query
    });
    setRemark('');
    setSubmitted(false);
  };

  const closeFeedbackPanel = () => {
    setFeedbackPanel(prev => ({ ...prev, isOpen: false }));
  };

  const handleSubmitFeedback = () => {
    if (!feedbackPanel.result || !feedbackPanel.rating) return;
    addFeedback({
      question: feedbackPanel.question,
      chapterTitle: feedbackPanel.result.chapterTitle,
      paragraph: feedbackPanel.result.paragraph,
      confidence: feedbackPanel.result.confidence,
      rating: feedbackPanel.rating,
      remark: remark.trim()
    });
    setSubmitted(true);
    if (feedbackCloseTimerRef.current) {
      clearTimeout(feedbackCloseTimerRef.current);
    }
    feedbackCloseTimerRef.current = setTimeout(() => {
      feedbackCloseTimerRef.current = null;
      closeFeedbackPanel();
    }, 1500);
  };

  const emptyStateIllustration = useMemo(() => (
    <div style={styles.emptyIllustration}>
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3498db" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#2c3e50" stopOpacity="0.6" />
          </linearGradient>
          <animateTransform
            attributeName="gradientTransform"
            type="translate"
            values="-20 -20; 20 20; -20 -20"
            dur="3s"
            repeatCount="indefinite"
          />
        </defs>
        <circle cx="60" cy="60" r="45" fill="url(#grad1)" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
        <path d="M45 55L60 70L75 45" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="60" cy="60" r="50" stroke="url(#grad1)" strokeWidth="2" fill="none" strokeDasharray="10 5">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 60 60"
            to="360 60 60"
            dur="10s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  ), []);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return '#27ae60';
    if (confidence >= 50) return '#f39c12';
    return '#e74c3c';
  };

  return (
    <div style={styles.container}>
      <div style={styles.searchSection}>
        <h1 style={styles.title}>有疑问？在这里搜索</h1>
        <p style={styles.subtitle}>从产品手册中智能检索相关内容，获取精准解答</p>
        <div style={styles.searchBox}>
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="请输入您的问题关键词，如：如何修改密码、文档协作功能..."
            style={styles.searchInput}
            className="qa-search-input"
          />
          <button onClick={handleSearch} style={styles.searchButton} disabled={isSearching || !query.trim()} className="qa-search-button">
            {isSearching ? (
              <svg style={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10">
                  <animate attributeName="stroke-dasharray" values="150 0; 50 100; 150 0" dur="1.5s" repeatCount="indefinite" />
                </circle>
              </svg>
            ) : (
              <svg style={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            )}
            <span>搜索</span>
          </button>
        </div>
      </div>

      <div style={styles.resultsSection}>
        {hasSearched && !isSearching && results.length === 0 && (
          <div style={styles.emptyState}>
            <div style={{
              ...styles.emptyIllustrationWrapper,
              opacity: showEmptyIllustration ? 1 : 0,
              transform: showEmptyIllustration ? 'scale(1)' : 'scale(0.8)',
              transition: 'all 500ms cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
              {emptyStateIllustration}
            </div>
            <p style={{
              ...styles.emptyText,
              opacity: showEmptyText ? 1 : 0,
              transform: showEmptyText ? 'translateY(0)' : 'translateY(10px)',
              transition: 'all 1s ease'
            }}>
              没有找到匹配内容，请换个关键词试试
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div style={styles.resultsHeader}>
            <span style={styles.resultsCount}>找到 {results.length} 条相关结果</span>
          </div>
        )}

        <div style={styles.resultsList}>
          {results.map((result, index) => (
            <div
              key={`${result.chapterId}-${index}`}
              style={{
                ...styles.resultCard,
                animation: `fadeIn 300ms ease ${index * 80}ms both`
              }}
              className="qa-result-card"
            >
              <div style={styles.cardContent}>
                <div style={styles.cardHeader}>
                  <span style={styles.chapterBadge}>{result.chapterTitle}</span>
                  <span style={{
                    ...styles.confidenceBadge,
                    backgroundColor: getConfidenceColor(result.confidence) + '20',
                    color: getConfidenceColor(result.confidence)
                  }}>
                    {result.confidence}% 匹配
                  </span>
                </div>
                <p style={styles.paragraphText}>{result.summary}</p>
              </div>
              <div style={styles.cardActions}>
                <button
                  onClick={() => openFeedbackPanel(result, 'useful')}
                  style={styles.actionButton}
                  title="有用"
                  className="qa-action-button"
                >
                  <svg style={styles.actionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                  </svg>
                </button>
                <button
                  onClick={() => openFeedbackPanel(result, 'useless')}
                  style={{ ...styles.actionButton, ...styles.actionButtonDanger }}
                  title="无用"
                  className="qa-action-button"
                >
                  <svg style={styles.actionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {feedbackPanel.isOpen && (
        <>
          <div style={styles.overlay} onClick={closeFeedbackPanel} />
          <div style={styles.feedbackPanel}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>
                {submitted ? '提交成功' : `评价该结果 - ${feedbackPanel.rating === 'useful' ? '有用' : '无用'}`}
              </h3>
              <button onClick={closeFeedbackPanel} style={styles.closeButton} className="qa-close-button">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {!submitted ? (
              <>
                <div style={styles.panelContent}>
                  <div style={styles.resultPreview}>
                    <div style={styles.previewHeader}>
                      <span style={styles.previewTitle}>{feedbackPanel.result?.chapterTitle}</span>
                      <span style={{
                        ...styles.previewConfidence,
                        color: feedbackPanel.result ? getConfidenceColor(feedbackPanel.result.confidence) : '#333'
                      }}>
                        {feedbackPanel.result?.confidence}%
                      </span>
                    </div>
                    <p style={styles.previewText}>{feedbackPanel.result?.paragraph}</p>
                  </div>
                  <div style={styles.remarkSection}>
                    <label style={styles.remarkLabel}>补充备注（可选，最多200字）</label>
                    <textarea
                      value={remark}
                      onChange={(e) => setRemark(e.target.value.slice(0, 200))}
                      placeholder="请告诉我们您的具体需求或建议..."
                      style={styles.remarkTextarea}
                      rows={3}
                      className="qa-textarea"
                    />
                    <span style={styles.charCount}>{remark.length}/200</span>
                  </div>
                </div>
                <div style={styles.panelFooter}>
                  <button onClick={closeFeedbackPanel} style={styles.cancelButton} className="qa-cancel-button">取消</button>
                  <button onClick={handleSubmitFeedback} style={styles.submitButton} className="qa-submit-button">提交反馈</button>
                </div>
              </>
            ) : (
              <div style={styles.successContent}>
                <svg style={styles.successIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <p style={styles.successText}>感谢您的反馈！我们会持续优化搜索结果。</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%'
  },
  searchSection: {
    textAlign: 'center',
    padding: '40px 0 50px'
  },
  title: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#2c3e50',
    marginBottom: '12px'
  },
  subtitle: {
    fontSize: '15px',
    color: '#7f8c8d',
    marginBottom: '32px'
  },
  searchBox: {
    display: 'flex',
    maxWidth: '600px',
    margin: '0 auto',
    gap: '12px'
  },
  searchInput: {
    flex: 1,
    padding: '14px 20px',
    fontSize: '15px',
    border: '2px solid transparent',
    borderRadius: '12px',
    background: '#fff',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    outline: 'none',
    transition: 'all 150ms ease'
  },
  searchButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 28px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(52, 152, 219, 0.4)',
    transition: 'all 150ms ease',
    whiteSpace: 'nowrap'
  },
  searchIcon: {
    width: '18px',
    height: '18px'
  },
  resultsSection: {
    marginTop: '20px'
  },
  resultsHeader: {
    marginBottom: '16px'
  },
  resultsCount: {
    fontSize: '14px',
    color: '#7f8c8d'
  },
  resultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  resultCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '20px 24px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
    transition: 'all 200ms ease',
    cursor: 'default'
  },
  cardContent: {
    flex: 1
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '10px'
  },
  chapterBadge: {
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#3498db',
    background: 'rgba(52, 152, 219, 0.1)',
    borderRadius: '6px'
  },
  confidenceBadge: {
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '6px'
  },
  paragraphText: {
    fontSize: '14px',
    color: '#34495e',
    lineHeight: 1.6
  },
  cardActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginLeft: '16px'
  },
  actionButton: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #e1e8ed',
    borderRadius: '8px',
    background: '#fff',
    color: '#27ae60',
    cursor: 'pointer',
    transition: 'all 150ms ease'
  },
  actionButtonDanger: {
    color: '#e74c3c'
  },
  actionIcon: {
    width: '18px',
    height: '18px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  emptyIllustrationWrapper: {
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'center'
  },
  emptyIllustration: {
    display: 'flex',
    justifyContent: 'center'
  },
  emptyText: {
    fontSize: '15px',
    color: '#7f8c8d',
    opacity: 0
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.4)',
    zIndex: 999,
    animation: 'fadeIn 200ms ease'
  },
  feedbackPanel: {
    position: 'fixed',
    left: '50%',
    bottom: 0,
    width: '100%',
    maxWidth: '600px',
    background: '#fff',
    borderRadius: '16px 16px 0 0',
    boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
    transform: 'translateX(-50%) translateY(0)',
    animation: 'feedbackBounceIn 300ms cubic-bezier(0.68, -0.55, 0.27, 1.55) both'
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid #ecf0f1'
  },
  panelTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#2c3e50'
  },
  closeButton: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: '#f5f7fa',
    borderRadius: '8px',
    color: '#7f8c8d',
    cursor: 'pointer',
    transition: 'all 150ms ease'
  },
  panelContent: {
    padding: '20px 24px'
  },
  resultPreview: {
    padding: '16px',
    background: '#f8f9fa',
    borderRadius: '10px',
    marginBottom: '20px'
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px'
  },
  previewTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#3498db'
  },
  previewConfidence: {
    fontSize: '13px',
    fontWeight: 600
  },
  previewText: {
    fontSize: '14px',
    color: '#34495e',
    lineHeight: 1.6
  },
  remarkSection: {
    position: 'relative'
  },
  remarkLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#2c3e50',
    marginBottom: '8px'
  },
  remarkTextarea: {
    width: '100%',
    padding: '12px 14px',
    fontSize: '14px',
    border: '1px solid #e1e8ed',
    borderRadius: '8px',
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'all 150ms ease'
  },
  charCount: {
    position: 'absolute',
    right: '10px',
    bottom: '8px',
    fontSize: '12px',
    color: '#bdc3c7'
  },
  panelFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid #ecf0f1'
  },
  cancelButton: {
    padding: '10px 20px',
    fontSize: '14px',
    color: '#7f8c8d',
    background: '#f5f7fa',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 150ms ease'
  },
  submitButton: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#fff',
    background: '#3498db',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 150ms ease'
  },
  successContent: {
    padding: '40px 24px',
    textAlign: 'center'
  },
  successIcon: {
    width: '56px',
    height: '56px',
    color: '#27ae60',
    margin: '0 auto 16px',
    animation: 'bounceIn 500ms ease'
  },
  successText: {
    fontSize: '15px',
    color: '#2c3e50'
  }
};
