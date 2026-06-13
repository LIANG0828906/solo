import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import FileUploader from './FileUploader';
import SearchResult from './SearchResult';
import './App.css';

export interface DocInfo {
  id: string;
  name: string;
  pageCount: number;
  paragraphCount: number;
  uploadedAt: number;
  preview: string;
}

export interface SearchMatch {
  documentId: string;
  documentName: string;
  paragraphIndex: number;
  paragraph: string;
  context: string;
  startIndex: number;
  endIndex: number;
  keyword: string;
}

export interface SearchResultItem {
  documentId: string;
  documentName: string;
  pageCount: number;
  matchCount: number;
  matches: SearchMatch[];
}

const HIGHLIGHT_COLORS = ['#FFD54F', '#4DD0E1', '#FF9800', '#81C784', '#BA68C8'];

const App: React.FC = () => {
  const [documents, setDocuments] = useState<DocInfo[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docDetail, setDocDetail] = useState<any>(null);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [highlightParagraph, setHighlightParagraph] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('docsearch_history');
    if (saved) {
      setSearchHistory(JSON.parse(saved));
    }
  }, []);

  const saveToHistory = useCallback((query: string) => {
    setSearchHistory((prev) => {
      const filtered = prev.filter((h) => h !== query);
      const newHistory = [query, ...filtered].slice(0, 10);
      localStorage.setItem('docsearch_history', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  const handleUploadComplete = useCallback((docInfo: DocInfo) => {
    setDocuments((prev) => [docInfo, ...prev]);
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setKeywords([]);
      return;
    }

    try {
      const response = await axios.get('/api/search', {
        params: { q: query },
      });
      setSearchResults(response.data.results);
      setKeywords(response.data.keywords);
      saveToHistory(query.trim());
      setShowSuggestions(false);
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, [saveToHistory]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
    searchInputRef.current?.focus();
  };

  const loadDocumentDetail = async (docId: string) => {
    if (docDetail?.id === docId) return;
    try {
      const response = await axios.get(`/api/documents/${docId}`);
      setDocDetail(response.data);
      setSelectedDocId(docId);
    } catch (error) {
      console.error('Load document failed:', error);
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

  const handleResultClick = (match: SearchMatch) => {
    loadDocumentDetail(match.documentId);
    setSelectedDocId(match.documentId);
    setExpandedDocId(match.documentId);

    setTimeout(() => {
      const paraElement = document.getElementById(`paragraph-${match.paragraphIndex}`);
      if (paraElement && previewRef.current) {
        paraElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

        let count = 0;
        const blinkInterval = setInterval(() => {
          if (count >= 6) {
            clearInterval(blinkInterval);
            setHighlightParagraph(null);
            return;
          }
          setHighlightParagraph((prev) => (prev === match.paragraphIndex ? null : match.paragraphIndex));
          count++;
        }, 500);
      }
    }, 300);
  };

  const getKeywordColor = (keyword: string): string => {
    const index = keywords.indexOf(keyword.toLowerCase());
    return HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length];
  };

  const renderHighlightedText = (text: string, paraKeywords?: string[]) => {
    const kws = paraKeywords || keywords;
    if (kws.length === 0) return text;

    const allMatches: Array<{ start: number; end: number; keyword: string; color: string }> = [];
    const lowerText = text.toLowerCase();

    kws.forEach((keyword) => {
      const idx = keywords.indexOf(keyword.toLowerCase());
      const color = HIGHLIGHT_COLORS[Math.max(0, idx) % HIGHLIGHT_COLORS.length];
      let searchPos = 0;
      while (true) {
        const pos = lowerText.indexOf(keyword.toLowerCase(), searchPos);
        if (pos === -1) break;
        allMatches.push({ start: pos, end: pos + keyword.length, keyword, color });
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
        result.push(<span key={`text-${idx}`}>{text.slice(lastEnd, match.start)}</span>);
      }
      result.push(
        <span
          key={`hl-${idx}`}
          className="highlight-breath"
          style={{
            backgroundColor: match.color,
            color: '#1A1A2E',
            fontWeight: 600,
            padding: '1px 2px',
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

  const filteredHistory = searchHistory.filter((h) =>
    h.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-container">
      <header className="app-header">
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          ☰
        </button>
        <h1 className="app-title">🔍 DocSearchLite</h1>
        <p className="app-subtitle">轻量级文档全文检索引擎</p>
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
                        <div className="doc-name">{doc.name}</div>
                        <div className="doc-meta">
                          {doc.pageCount} 页 · {doc.paragraphCount} 段落
                        </div>
                      </div>
                    </div>
                    <div
                      className="doc-preview-wrapper"
                      style={{
                        maxHeight: expandedDocId === doc.id ? 'none' : '0',
                        transition: 'max-height 0.3s ease-out',
                        overflow: 'hidden',
                      }}
                    >
                      <div className="doc-preview-text">{doc.preview}...</div>
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
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="search-input"
                  placeholder="输入关键词搜索，多个关键词用空格分隔..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="clear-btn"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setKeywords([]);
                    }}
                  >
                    ✕
                  </button>
                )}
                {showSuggestions && filteredHistory.length > 0 && (
                  <div className="suggestions-dropdown">
                    <div className="suggestions-title">搜索历史</div>
                    {filteredHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="suggestion-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSuggestionClick(item);
                        }}
                      >
                        <span className="suggestion-icon">🕒</span>
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" className="search-btn">
                搜索
              </button>
            </form>

            {keywords.length > 0 && (
              <div className="keywords-legend">
                <span className="legend-label">高亮图例：</span>
                {keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="legend-item"
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
                {docDetail.paragraphs?.map((para: string, idx: number) => (
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
                onResultClick={handleResultClick}
                getKeywordColor={getKeywordColor}
              />
            </div>
          )}

          {searchResults.length === 0 && searchQuery && (
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
              <p>已上传 {documents.length} 个文档，在上方搜索框输入关键词即可开始检索</p>
              <div className="search-tips">
                <p>💡 提示：</p>
                <ul>
                  <li>使用空格或逗号分隔多个关键词</li>
                  <li>不同关键词会用不同颜色高亮显示</li>
                  <li>点击搜索结果可跳转到文档对应位置</li>
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
