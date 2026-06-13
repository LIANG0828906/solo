import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import FileUploader from './FileUploader';
import SearchResult from './SearchResult';
import './App.css';
import type { DocInfoDto, SearchMatchDto, SearchResultDto, ApiTypes } from './apiTypes';

export type DocInfo = DocInfoDto;
export type SearchMatch = SearchMatchDto;
export type SearchResultItem = SearchResultDto;

const HIGHLIGHT_COLORS = ['#FFD54F', '#4DD0E1', '#FF9800', '#81C784', '#BA68C8'];
const HISTORY_KEY = 'docsearch_history_v1';
const MAX_HISTORY = 10;

const App: React.FC = () => {
  const [documents, setDocuments] = useState<DocInfo[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docDetail, setDocDetail] = useState<ApiTypes['getDocument']['response'] | null>(null);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [highlightParagraph, setHighlightParagraph] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) {
        setSearchHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load search history:', e);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionContainerRef.current &&
        !suggestionContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveToHistory = useCallback((query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setSearchHistory((prev) => {
      const filtered = prev.filter((h) => h.toLowerCase() !== trimmedQuery.toLowerCase());
      const newHistory = [trimmedQuery, ...filtered].slice(0, MAX_HISTORY);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      } catch (e) {
        console.warn('Failed to save search history:', e);
      }
      return newHistory;
    });
  }, []);

  const handleUploadComplete = useCallback((docInfo: DocInfo) => {
    setDocuments((prev) => [docInfo, ...prev]);
  }, []);

  const handleSearch = useCallback(
    async (query: string) => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        setSearchResults([]);
        setKeywords([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await axios.get<ApiTypes['search']['response']>('/api/search', {
          params: { q: trimmedQuery },
        });
        setSearchResults(response.data.results);
        setKeywords(response.data.keywords);
        saveToHistory(trimmedQuery);
        setShowSuggestions(false);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [saveToHistory]
  );

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.length >= 2);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (e) {
      console.warn('Failed to clear history:', e);
    }
  };

  const loadDocumentDetail = async (docId: string) => {
    if (docDetail?.id === docId) return docDetail;
    try {
      const response = await axios.get<ApiTypes['getDocument']['response']>(`/api/documents/${docId}`);
      setDocDetail(response.data);
      setSelectedDocId(docId);
      return response.data;
    } catch (error) {
      console.error('Load document failed:', error);
      return null;
    }
  };

  const handleDocClick = (docId: string) => {
    if (expandedDocId === docId) {
      setExpandedDocId(null);
    } else {
      setExpandedDocId(docId);
      loadDocumentDetail(docId);
    }
    setIsMobileMenuOpen(false);
  };

  const handleResultClick = async (match: SearchMatch) => {
    setSelectedDocId(match.documentId);
    setExpandedDocId(match.documentId);

    const detail = await loadDocumentDetail(match.documentId);
    if (!detail) return;

    await new Promise((resolve) => setTimeout(resolve, 350));

    const paraElement = document.getElementById(`paragraph-${match.paragraphIndex}`);
    if (paraElement) {
      paraElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      setHighlightParagraph(null);
      let count = 0;
      const totalBlinks = 6;

      const doBlink = () => {
        count++;
        if (count > totalBlinks) {
          setHighlightParagraph(null);
          return;
        }
        setHighlightParagraph((prev) => (prev === match.paragraphIndex ? null : match.paragraphIndex));
        setTimeout(doBlink, 500);
      };
      setTimeout(doBlink, 100);
    }
  };

  const getKeywordColor = (keyword: string): string => {
    const index = keywords.findIndex((k) => k.toLowerCase() === keyword.toLowerCase());
    return HIGHLIGHT_COLORS[Math.max(0, index) % HIGHLIGHT_COLORS.length];
  };

  const renderHighlightedText = (text: string) => {
    if (keywords.length === 0) return text;

    const allMatches: Array<{ start: number; end: number; keyword: string; color: string }> = [];
    const lowerText = text.toLowerCase();

    keywords.forEach((keyword) => {
      const color = getKeywordColor(keyword);
      const lowerKeyword = keyword.toLowerCase();
      let searchPos = 0;

      while (true) {
        const pos = lowerText.indexOf(lowerKeyword, searchPos);
        if (pos === -1) break;
        allMatches.push({
          start: pos,
          end: pos + keyword.length,
          keyword,
          color,
        });
        searchPos = pos + keyword.length;
      }
    });

    if (allMatches.length === 0) return text;

    allMatches.sort((a, b) => a.start - b.start);

    const merged: typeof allMatches = [];
    allMatches.forEach((m) => {
      if (merged.length === 0 || m.start >= merged[merged.length - 1].end) {
        merged.push(m);
      } else {
        const last = merged[merged.length - 1];
        if (m.end > last.end) {
          last.end = m.end;
        }
      }
    });

    const result: React.ReactNode[] = [];
    let lastEnd = 0;

    merged.forEach((match, idx) => {
      if (match.start > lastEnd) {
        result.push(
          <span key={`text-${idx}`}>{text.slice(lastEnd, match.start)}</span>
        );
      }
      result.push(
        <span
          key={`hl-${idx}`}
          className="highlight-breath"
          style={{
            backgroundColor: match.color,
            color: '#1A1A2E',
            fontWeight: 600,
            padding: '1px 3px',
            borderRadius: '2px',
          }}
        >
          {text.slice(match.start, match.end)}
        </span>
      );
      lastEnd = match.end;
    });

    if (lastEnd < text.length) {
      result.push(<span key="text-end">{text.slice(lastEnd)}</span>);
    }

    return <>{result}</>;
  };

  const filteredHistory = searchQuery.length >= 2
    ? searchHistory.filter((h) => h.toLowerCase().includes(searchQuery.toLowerCase()))
    : searchHistory;

  return (
    <div className="app-container">
      <header className="app-header">
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="菜单"
        >
          ☰
        </button>
        <div>
          <h1 className="app-title">🔍 DocSearchLite</h1>
          <p className="app-subtitle">轻量级文档全文检索引擎</p>
        </div>
      </header>

      <div className="main-layout">
        <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
          <FileUploader onUploadComplete={handleUploadComplete} />

          <div className="doc-list-section">
            <h3 className="section-title">文档列表 ({documents.length})</h3>
            <div className="doc-list">
              {documents.length === 0 ? (
                <div className="empty-state">暂无文档，请上传PDF文件</div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`doc-card ${expandedDocId === doc.id ? 'expanded' : ''}`}
                    onClick={() => handleDocClick(doc.id)}
                  >
                    <div className="doc-card-header">
                      <span className="doc-icon">📄</span>
                      <div className="doc-info">
                        <div className="doc-name" title={doc.name}>
                          {doc.name}
                        </div>
                        <div className="doc-meta">
                          {doc.pageCount} 页 · {doc.paragraphCount} 段落
                        </div>
                      </div>
                    </div>
                    <div
                      className="doc-preview-wrapper"
                      style={{
                        maxHeight: expandedDocId === doc.id ? '2000px' : '0',
                        transition: 'max-height 0.3s ease-out',
                        overflow: 'hidden',
                      }}
                    >
                      {doc.preview && (
                        <div className="doc-preview-text">{doc.preview}...</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        <main className="main-content">
          <div className="search-section">
            <form onSubmit={handleSearchSubmit} className="search-form">
              <div className="search-input-wrapper" ref={suggestionContainerRef}>
                <span className="search-icon">🔍</span>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="search-input"
                  placeholder="输入关键词搜索，多个关键词用空格分隔..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => {
                    if (searchQuery.length >= 2 || searchHistory.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  disabled={isSearching}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="clear-btn"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setKeywords([]);
                      searchInputRef.current?.focus();
                    }}
                    aria-label="清除"
                  >
                    ✕
                  </button>
                )}
                {isSearching && (
                  <span className="searching-indicator">⟳</span>
                )}

                {showSuggestions && (filteredHistory.length > 0 || searchHistory.length > 0) && (
                  <div className="suggestions-dropdown">
                    <div className="suggestions-header">
                      <span className="suggestions-title">🕒 搜索历史</span>
                      {searchHistory.length > 0 && (
                        <button
                          type="button"
                          className="clear-history-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearHistory();
                          }}
                        >
                          清除
                        </button>
                      )}
                    </div>
                    {filteredHistory.length === 0 ? (
                      <div className="suggestion-empty">无匹配的历史记录</div>
                    ) : (
                      filteredHistory.slice(0, 8).map((item, idx) => (
                        <div
                          key={idx}
                          className="suggestion-item"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSuggestionClick(item);
                          }}
                        >
                          <span className="suggestion-icon">🕒</span>
                          <span className="suggestion-text">{item}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <button type="submit" className="search-btn" disabled={isSearching}>
                {isSearching ? '搜索中...' : '搜索'}
              </button>
            </form>

            {keywords.length > 0 && (
              <div className="keywords-legend">
                <span className="legend-label">高亮图例：</span>
                {keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="legend-item highlight-breath"
                    style={{
                      backgroundColor: HIGHLIGHT_COLORS[idx % HIGHLIGHT_COLORS.length],
                      color: '#1A1A2E',
                    }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>

          {selectedDocId && docDetail && expandedDocId === selectedDocId && (
            <div className="doc-preview-section card">
              <div className="doc-preview-header">
                <h3>📖 {docDetail.name}</h3>
                <span className="doc-page-count">共 {docDetail.pageCount} 页</span>
              </div>
              <div className="doc-preview-content" ref={previewRef}>
                {docDetail.paragraphs?.map((para, idx) => (
                  <div
                    key={idx}
                    id={`paragraph-${idx}`}
                    className={`paragraph-item ${highlightParagraph === idx ? 'flashing' : ''}`}
                  >
                    {renderHighlightedText(para)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="search-results-section">
              <h3 className="section-title">
                搜索结果 ({searchResults.reduce((s, r) => s + r.matchCount, 0)} 个匹配)
              </h3>
              <SearchResult
                results={searchResults}
                keywords={keywords}
                onResultClick={handleResultClick}
              />
            </div>
          )}

          {searchResults.length === 0 && searchQuery && !isSearching && (
            <div className="card no-results">
              <div className="no-results-icon">📭</div>
              <p>未找到匹配的文档</p>
              <p className="no-results-tip">尝试使用其他关键词，或上传更多PDF文档</p>
            </div>
          )}

          {searchResults.length === 0 && !searchQuery && documents.length > 0 && (
            <div className="card welcome-card">
              <div className="welcome-icon">💡</div>
              <h3>开始搜索</h3>
              <p>
                已上传 {documents.length} 个文档，在上方搜索框输入关键词即可开始检索
              </p>
              <div className="search-tips">
                <p>💡 使用提示：</p>
                <ul>
                  <li>使用空格或逗号分隔多个关键词</li>
                  <li>不同关键词会用不同颜色高亮显示（黄/青/橙...）</li>
                  <li>点击搜索结果可跳转到文档对应位置并闪烁提示</li>
                  <li>输入 2 个字符后会显示搜索历史建议</li>
                </ul>
              </div>
            </div>
          )}

          {documents.length === 0 && !searchQuery && (
            <div className="card welcome-card">
              <div className="welcome-icon">🚀</div>
              <h3>欢迎使用 DocSearchLite</h3>
              <p>从左侧上传 PDF 文档，开启智能全文检索体验</p>
              <div className="search-tips">
                <p>✨ 功能特点：</p>
                <ul>
                  <li>高性能倒排索引，100 份文档 500ms 内响应</li>
                  <li>多关键词彩色高亮，定位一目了然</li>
                  <li>点击跳转并闪烁提示，快速定位匹配段落</li>
                  <li>搜索历史建议，减少重复输入</li>
                </ul>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
