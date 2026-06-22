import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Source, Article, getArticles, markArticleRead } from '../api';

interface SourceDetailProps {
  sources: Source[];
  showError: (message: string) => void;
  onSourcesChange: () => void;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '今天';
  } else if (diffDays === 1) {
    return '昨天';
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function highlightText(text: string, keyword: string): React.ReactNode {
  if (!keyword) return text;

  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark
        key={index}
        style={{
          backgroundColor: '#FEF08A',
          padding: '0 2px',
          borderRadius: '2px',
        }}
      >
        {part}
      </mark>
    ) : (
      <React.Fragment key={index}>{part}</React.Fragment>
    )
  );
}

const SourceDetail: React.FC<SourceDetailProps> = ({ sources, showError, onSourcesChange }) => {
  const { sourceId } = useParams<{ sourceId: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const source = sources.find(s => s.id === sourceId);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchArticles = useCallback(async () => {
    if (!sourceId) return;
    try {
      setLoading(true);
      const data = await getArticles(sourceId);
      setArticles(data);
    } catch (err) {
      showError(err instanceof Error ? err.message : '加载文章失败');
    } finally {
      setLoading(false);
    }
  }, [sourceId, showError]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const filteredArticles = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return articles;
    }
    const keyword = debouncedSearch.toLowerCase();
    return articles.filter(
      article =>
        article.title.toLowerCase().includes(keyword) ||
        article.summary.toLowerCase().includes(keyword)
    );
  }, [articles, debouncedSearch]);

  const handleArticleClick = async (article: Article) => {
    if (article.isRead) return;

    try {
      const updatedArticle = await markArticleRead(article.id, true);
      setArticles(prev =>
        prev.map(a => (a.id === article.id ? updatedArticle : a))
      );
      onSourcesChange();
    } catch (err) {
      showError(err instanceof Error ? err.message : '标记失败');
    }
  };

  const groupedArticles = useMemo(() => {
    const groups: { [key: string]: Article[] } = {};
    filteredArticles.forEach(article => {
      const key = getDateKey(article.publishTime);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(article);
    });
    return groups;
  }, [filteredArticles]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedArticles).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });
  }, [groupedArticles]);

  const getTypeColor = () => {
    if (!source) return '#3B82F6';
    switch (source.type) {
      case 'rss':
        return '#F97316';
      case 'youtube':
        return '#EF4444';
      case 'podcast':
        return '#8B5CF6';
      default:
        return '#3B82F6';
    }
  };

  return (
    <div>
      <div
        style={{
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: `${getTypeColor()}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: getTypeColor(),
          }}
        >
          {source?.type === 'rss' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1Z" />
            </svg>
          )}
          {source?.type === 'youtube' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
            </svg>
          )}
          {source?.type === 'podcast' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: '#111827' }}>
            {source?.name || '加载中...'}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            {source?.url}
          </div>
        </div>
        <div
          style={{
            backgroundColor: getTypeColor(),
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {articles.filter(a => !a.isRead).length} 篇未读
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="#9CA3AF"
          style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="搜索文章..."
          style={{
            width: '100%',
            padding: '14px 16px 14px 48px',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            fontSize: '1rem',
            outline: 'none',
            backgroundColor: 'white',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3B82F6';
            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#E5E7EB';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280' }}>
          加载中...
        </div>
      ) : (
        <div>
          {sortedDates.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px',
                color: '#6B7280',
                backgroundColor: 'white',
                borderRadius: '12px',
              }}
            >
              没有找到相关文章
            </div>
          ) : (
            sortedDates.map((dateKey, dateIndex) => (
              <div key={dateKey}>
                {dateIndex > 0 && (
                  <div
                    style={{
                      height: '1px',
                      backgroundColor: '#E5E7EB',
                      margin: '16px 0',
                    }}
                  />
                )}
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: '#6B7280',
                    marginBottom: '12px',
                    fontWeight: 500,
                  }}
                >
                  {formatDate(groupedArticles[dateKey][0].publishTime)}
                </div>
                <div
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  {groupedArticles[dateKey].map((article, index) => (
                    <div
                      key={article.id}
                      onClick={() => handleArticleClick(article)}
                      style={{
                        padding: '16px 20px',
                        cursor: 'pointer',
                        backgroundColor: article.isRead ? '#E8F0FE' : 'white',
                        transition: 'background-color 0.2s ease',
                        borderBottom:
                          index < groupedArticles[dateKey].length - 1
                            ? '1px solid #F3F4F6'
                            : 'none',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                      }}
                      onMouseEnter={(e) => {
                        if (!article.isRead) {
                          e.currentTarget.style.backgroundColor = '#F3F4F6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!article.isRead) {
                          e.currentTarget.style.backgroundColor = 'white';
                        } else {
                          e.currentTarget.style.backgroundColor = '#E8F0FE';
                        }
                      }}
                    >
                      <div style={{ paddingTop: '4px' }}>
                        {!article.isRead && (
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#3B82F6',
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: article.isRead ? 400 : 700,
                            color: '#111827',
                            fontSize: '1rem',
                            marginBottom: '6px',
                            lineHeight: 1.4,
                          }}
                        >
                          {highlightText(article.title, debouncedSearch)}
                        </div>
                        <div
                          style={{
                            fontSize: '0.875rem',
                            color: '#6B7280',
                            lineHeight: 1.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {highlightText(article.summary, debouncedSearch)}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#9CA3AF',
                            marginTop: '8px',
                          }}
                        >
                          {formatTime(article.publishTime)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SourceDetail;
