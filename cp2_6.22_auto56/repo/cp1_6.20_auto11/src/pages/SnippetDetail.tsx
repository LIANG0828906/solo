import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSnippetDetail } from '../hooks/useSnippets';

const LANG_ICONS: Record<string, string> = {
  JavaScript: 'JS',
  TypeScript: 'TS',
  Python: 'PY',
  HTML: 'HTML',
  CSS: 'CSS',
  Java: 'J',
  Go: 'GO',
  Rust: 'RS',
  React: '⚛',
  Vue: 'V',
  Shell: '$',
  SQL: 'SQL',
};

export default function SnippetDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const { snippet, loading, likeSnippet, favoriteSnippet } = useSnippetDetail(id);
  const [copied, setCopied] = useState(false);
  const [pressingLike, setPressingLike] = useState(false);
  const [pressingFav, setPressingFav] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!snippet) return;
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [snippet]);

  const handleLike = useCallback(async () => {
    if (!snippet) return;
    setPressingLike(true);
    setTimeout(() => setPressingLike(false), 300);
    await likeSnippet(snippet.id);
  }, [snippet, likeSnippet]);

  const handleFavorite = useCallback(async () => {
    if (!snippet) return;
    setPressingFav(true);
    setTimeout(() => setPressingFav(false), 300);
    await favoriteSnippet(snippet.id);
  }, [snippet, favoriteSnippet]);

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!snippet) {
    return (
      <div className="empty-state">
        <h3>片段不存在</h3>
        <Link to="/" className="back-btn">返回首页</Link>
      </div>
    );
  }

  const langIcon = LANG_ICONS[snippet.language] || snippet.language.slice(0, 2).toUpperCase();
  const codeLines = snippet.code.split('\n');

  return (
    <div className="detail-page">
      <Link to="/" className="back-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        返回列表
      </Link>

      <div className="detail-card">
        <div className="detail-header">
          <h1 className="detail-title">{snippet.title}</h1>
          <div className="detail-meta">
            <span className="lang-badge">
              <span className="lang-icon">{langIcon}</span>
              {snippet.language}
            </span>
            {snippet.tags.length > 0 && snippet.tags.map((tag, i) => (
              <span key={i} className="tag">#{tag}</span>
            ))}
            <span style={{ color: '#707090', fontSize: '13px' }}>
              创建于 {new Date(snippet.createdAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
        </div>

        <div className="detail-actions">
          <button
            className={`action-btn action-btn-large ${snippet.isLiked ? 'active' : ''} ${pressingLike ? 'pressing' : ''}`}
            onClick={handleLike}
          >
            <svg viewBox="0 0 24 24" fill={snippet.isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            {snippet.likes} 点赞
          </button>

          <button
            className={`action-btn action-btn-large ${snippet.isFavorited ? 'active' : ''} ${pressingFav ? 'pressing' : ''}`}
            onClick={handleFavorite}
          >
            <svg viewBox="0 0 24 24" fill={snippet.isFavorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            {snippet.isFavorited ? '已收藏' : '收藏'}
          </button>
        </div>

        <div className="code-block-wrapper">
          <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
            {copied ? '已复制!' : '复制代码'}
          </button>
          <pre className="code-block">
            {codeLines.map((line, i) => (
              <div key={i} className="code-line">
                <span className="line-number">{i + 1}</span>
                <span className="line-code">{line || ' '}</span>
              </div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  );
}
