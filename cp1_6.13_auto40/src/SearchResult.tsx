import React from 'react';
import type { SearchResultItem, SearchMatch } from './App';

interface SearchResultProps {
  results: SearchResultItem[];
  keywords: string[];
  onResultClick: (match: SearchMatch) => void;
}

const HIGHLIGHT_COLORS = ['#FFD54F', '#4DD0E1', '#FF9800', '#81C784', '#BA68C8'];

const SearchResult: React.FC<SearchResultProps> = ({ results, keywords, onResultClick }) => {
  const getKeywordColor = (keyword: string): string => {
    const idx = keywords.findIndex((k) => k.toLowerCase() === keyword.toLowerCase());
    return HIGHLIGHT_COLORS[Math.max(0, idx) % HIGHLIGHT_COLORS.length];
  };

  const renderHighlightedContext = (context: string) => {
    if (keywords.length === 0) return context;

    const allMatches: Array<{ start: number; end: number; keyword: string; color: string }> = [];
    const lowerContext = context.toLowerCase();

    keywords.forEach((keyword) => {
      const lowerKeyword = keyword.toLowerCase();
      const color = getKeywordColor(keyword);
      let searchPos = 0;

      while (true) {
        const pos = lowerContext.indexOf(lowerKeyword, searchPos);
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

    if (allMatches.length === 0) return context;

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
        const text = context.slice(lastEnd, match.start);
        const displayText =
          lastEnd === 0 && idx === 0
            ? text.length > 30
              ? '...' + text.slice(-30)
              : text
            : text;
        result.push(
          <span key={`text-${idx}`} className="context-text">
            {displayText}
          </span>
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
          {context.slice(match.start, match.end)}
        </span>
      );
      lastEnd = match.end;
    });

    if (lastEnd < context.length) {
      const remaining = context.slice(lastEnd);
      result.push(
        <span key="text-end" className="context-text">
          {remaining.length > 30 ? remaining.slice(0, 30) + '...' : remaining}
        </span>
      );
    }

    return <>{result}</>;
  };

  return (
    <div className="search-results">
      {results.map((result) => (
        <div key={result.documentId} className="result-document card">
          <div className="result-doc-header">
            <span className="result-doc-icon">📄</span>
            <div className="result-doc-info">
              <h4 className="result-doc-name">{result.documentName}</h4>
              <span className="result-doc-meta">
                {result.pageCount} 页 · {result.matchCount} 个匹配
              </span>
            </div>
          </div>

          <div className="result-matches">
            {result.matches.slice(0, 5).map((match, idx) => (
              <div
                key={`${match.paragraphIndex}-${match.startIndex}-${idx}`}
                className="match-item card-mini"
                onClick={() => onResultClick(match)}
              >
                <div className="match-paragraph">{renderHighlightedContext(match.context)}</div>
                <div className="match-location">段落 #{match.paragraphIndex + 1}</div>
              </div>
            ))}
            {result.matches.length > 5 && (
              <div className="more-matches">还有 {result.matches.length - 5} 个匹配...</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchResult;
