import React from 'react';
import type { SearchResultItem, SearchMatch } from './App';
import { escapeHtml, escapeRegExp } from './utils/helpers';

interface SearchResultProps {
  results: SearchResultItem[];
  keywords: string[];
  onResultClick: (match: SearchMatch) => void;
}

const HIGHLIGHT_COLORS = [
  '#FFD54F',
  '#4DD0E1',
  '#FF9800',
  '#81C784',
  '#BA68C8',
  '#F06292',
  '#64B5F6',
  '#AED581',
];

const SearchResult: React.FC<SearchResultProps> = ({ results, keywords, onResultClick }) => {
  const getKeywordColor = (keyword: string): string => {
    const idx = keywords.findIndex((k) => k.toLowerCase() === keyword.toLowerCase());
    return HIGHLIGHT_COLORS[Math.max(0, idx) % HIGHLIGHT_COLORS.length];
  };

  const renderHighlightedContext = (context: string) => {
    if (keywords.length === 0) {
      return <span dangerouslySetInnerHTML={{ __html: escapeHtml(context) }} />;
    }

    const escapedContext = escapeHtml(context);
    const lowerContext = context.toLowerCase();

    const allMatches: Array<{ start: number; end: number; keyword: string; color: string }> = [];

    keywords.forEach((keyword) => {
      const color = getKeywordColor(keyword);
      const lowerKeyword = keyword.toLowerCase();
      const escapedKeyword = escapeRegExp(lowerKeyword);

      if (escapedKeyword.length === 0) return;

      const regex = new RegExp(escapedKeyword, 'gi');
      let match: RegExpExecArray | null;

      while ((match = regex.exec(lowerContext)) !== null) {
        allMatches.push({
          start: match.index,
          end: match.index + keyword.length,
          keyword,
          color,
        });
      }
    });

    if (allMatches.length === 0) {
      return <span dangerouslySetInnerHTML={{ __html: escapedContext }} />;
    }

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
        let text = escapedContext.slice(lastEnd, match.start);
        if (lastEnd === 0 && idx === 0 && text.length > 30) {
          text = '...' + text.slice(-30);
        }
        if (text.length > 0) {
          result.push(
            <span
              key={`text-${idx}`}
              className="context-text"
              dangerouslySetInnerHTML={{ __html: text }}
            />
          );
        }
      }

      const highlightedText = escapedContext.slice(match.start, match.end);
      const highlightedHtml = `<span class="highlight-breath" style="background-color:${match.color};color:#1A1A2E;font-weight:600;padding:1px 3px;border-radius:2px;">${highlightedText}</span>`;
      result.push(
        <span key={`hl-${idx}`} dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      );
      lastEnd = match.end;
    });

    if (lastEnd < escapedContext.length) {
      let remaining = escapedContext.slice(lastEnd);
      if (remaining.length > 30) {
        remaining = remaining.slice(0, 30) + '...';
      }
      result.push(
        <span
          key="text-end"
          className="context-text"
          dangerouslySetInnerHTML={{ __html: remaining }}
        />
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
                <div className="match-location">
                  段落 #{match.paragraphIndex + 1} · 偏移 {match.paragraphStartOffset}-
                  {match.paragraphEndOffset}
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
