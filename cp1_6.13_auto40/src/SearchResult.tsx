import React from 'react';
import { SearchResultItem, SearchMatch } from './App';

interface SearchResultProps {
  results: SearchResultItem[];
  onResultClick: (match: SearchMatch) => void;
  getKeywordColor: (keyword: string) => string;
}

const HIGHLIGHT_COLORS = ['#FFD54F', '#4DD0E1', '#FF9800', '#81C784', '#BA68C8'];

const SearchResult: React.FC<SearchResultProps> = ({ results, onResultClick, getKeywordColor }) => {
  const renderHighlightedContext = (context: string, keyword: string, keywordIndex: number) => {
    const lowerContext = context.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    const idx = lowerContext.indexOf(lowerKeyword);

    if (idx === -1) return context;

    const before = context.slice(0, idx);
    const match = context.slice(idx, idx + keyword.length);
    const after = context.slice(idx + keyword.length);
    const color = HIGHLIGHT_COLORS[keywordIndex % HIGHLIGHT_COLORS.length];

    return (
      <>
        {before && <span className="context-text">...{before.slice(-30)}</span>}
        <span
          className="highlight-breath"
          style={{
            backgroundColor: color,
            color: '#1A1A2E',
            fontWeight: 600,
            padding: '1px 3px',
            borderRadius: '2px',
          }}
        >
          {match}
        </span>
        {after && <span className="context-text">{after.slice(0, 30)}...</span>}
      </>
    );
  };

  const getKeywordIndex = (keyword: string): number => {
    const allKeywords = Array.from(
      new Set(results.flatMap((r) => r.matches.map((m) => m.keyword.toLowerCase())))
    );
    return allKeywords.indexOf(keyword.toLowerCase());
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
                key={idx}
                className="match-item card-mini"
                onClick={() => onResultClick(match)}
              >
                <div className="match-paragraph">
                  {renderHighlightedContext(match.context, match.keyword, getKeywordIndex(match.keyword))}
                </div>
                <div className="match-location">
                  段落 #{match.paragraphIndex + 1}
                </div>
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
