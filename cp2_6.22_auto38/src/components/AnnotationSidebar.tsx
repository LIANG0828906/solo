import { useEffect, useMemo, useRef, useState } from 'react';
import type { Annotation, User } from '../utils/annotationStore';
import { store } from '../utils/annotationStore';
import { extractSections } from './DocumentViewer';

interface AnnotationSidebarProps {
  annotations: Annotation[];
  users: User[];
  activeAnnotationId: string | null;
  onSelectAnnotation: (line: number, annotationId: string) => void;
}

type FilterKey = 'all' | 'open' | 'resolved' | 'mine';

const formatTime = (d: Date): string => {
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 86400000 * 7) return `${Math.floor(diff / 86400000)} 天前`;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
};

const getInitial = (name: string): string => (name ? name.slice(0, 1) : '?');

const getUser = (users: User[], id: string): User | undefined => users.find(u => u.id === id);

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const IconEmpty = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="9" y1="15" x2="15" y2="15"></line>
  </svg>
);

const highlightText = (text: string, keyword: string): React.ReactNode => {
  if (!keyword) return text;
  const kw = keyword.trim();
  if (!kw) return text;
  const lower = text.toLowerCase();
  const kwLower = kw.toLowerCase();
  const idx = lower.indexOf(kwLower);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="hl">{text.slice(idx, idx + kw.length)}</span>
      {text.slice(idx + kw.length)}
    </>
  );
};

export function AnnotationSidebar({ annotations, users, activeAnnotationId, onSelectAnnotation }: AnnotationSidebarProps) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sectionFilter, setSectionFilter] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const searchRafRef = useRef<number | null>(null);

  const currentUserId = store.getCurrentUser().id;
  const sections = useMemo(() => extractSections(store.getDocument()), []);

  useEffect(() => {
    if (searchRafRef.current) cancelAnimationFrame(searchRafRef.current);
    searchRafRef.current = requestAnimationFrame(() => {
      setSearch(searchInput.trim().toLowerCase());
    });
    return () => {
      if (searchRafRef.current) cancelAnimationFrame(searchRafRef.current);
    };
  }, [searchInput]);

  const findSectionForLine = (line: number): { line: number; title: string } | null => {
    let match: { line: number; title: string } | null = null;
    for (const s of sections) {
      if (s.line <= line) match = s;
      else break;
    }
    return match;
  };

  const filtered = useMemo(() => {
    return annotations
      .filter(a => {
        if (filter === 'open' && a.isResolved) return false;
        if (filter === 'resolved' && !a.isResolved) return false;
        if (filter === 'mine') {
          if (a.authorId !== currentUserId && !a.replies.some(r => r.authorId === currentUserId)) {
            return false;
          }
        }
        if (sectionFilter != null) {
          const sec = findSectionForLine(a.documentLine);
          if (!sec || sec.line !== sectionFilter) return false;
        }
        if (search) {
          const author = getUser(users, a.authorId);
          const hitAuthor = author?.name.toLowerCase().includes(search) ?? false;
          const hitContent = a.content.toLowerCase().includes(search);
          const hitSelected = a.selectedText.toLowerCase().includes(search);
          const hitReplies = a.replies.some(r => {
            const ru = getUser(users, r.authorId);
            return r.content.toLowerCase().includes(search) || (ru?.name.toLowerCase().includes(search) ?? false);
          });
          if (!hitAuthor && !hitContent && !hitSelected && !hitReplies) return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [annotations, filter, sectionFilter, search, users, currentUserId, sections]);

  const filters: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all', label: '全部', count: annotations.length },
    { key: 'open', label: '未解决', count: annotations.filter(a => !a.isResolved).length },
    { key: 'resolved', label: '已解决', count: annotations.filter(a => a.isResolved).length },
    {
      key: 'mine',
      label: '我参与的',
      count: annotations.filter(a =>
        a.authorId === currentUserId || a.replies.some(r => r.authorId === currentUserId),
      ).length,
    },
  ];

  return (
    <>
      <div className="sidebar-head">
        <div className="sidebar-title">
          <span>批注列表</span>
          <span className="sidebar-stat">共 {annotations.length} 条</span>
        </div>
        <div className="sidebar-subtitle">点击条目可在文档中定位高亮</div>
      </div>

      <div className="filter-row">
        {filters.map(f => (
          <button
            key={f.key}
            className={`filter-chip ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label} · {f.count}
          </button>
        ))}
      </div>

      {sections.length > 0 && (
        <select
          className="section-select"
          value={sectionFilter ?? ''}
          onChange={e => setSectionFilter(e.target.value ? parseInt(e.target.value, 10) : null)}
        >
          <option value="">全部章节</option>
          {sections.map(s => (
            <option key={s.line} value={s.line}>
              § {s.title}
            </option>
          ))}
        </select>
      )}

      <div className="annotation-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <IconEmpty />
            <div className="empty-text">暂无匹配的批注</div>
            <div className="empty-hint">
              {search ? '尝试调整搜索词或清除筛选条件' : '选中文档中的任意文本即可创建批注'}
            </div>
          </div>
        ) : (
          filtered.map(a => {
            const author = getUser(users, a.authorId);
            return (
              <div
                key={a.id}
                className={`sb-item ${a.isResolved ? 'resolved' : ''} ${activeAnnotationId === a.id ? 'active' : ''}`}
                onClick={() => onSelectAnnotation(a.documentLine, a.id)}
              >
                <div className="sb-item-head">
                  <div className="sb-author">
                    {author && (
                      <div
                        className="sb-avatar"
                        style={{ background: author.avatarColor }}
                      >
                        {getInitial(author.name)}
                      </div>
                    )}
                    <span className="sb-name">{highlightText(author?.name ?? '未知', search)}</span>
                  </div>
                  <span className="sb-line">L{a.documentLine}</span>
                </div>
                <div className="sb-snippet" title={a.selectedText}>
                  {highlightText(a.selectedText, search)}
                </div>
                <div className="sb-content">{highlightText(a.content, search)}</div>
                {a.replies.length > 0 && (
                  <div style={{
                    marginTop: 6,
                    paddingLeft: 8,
                    borderLeft: '2px solid var(--color-gray-line)',
                    fontSize: 11.5,
                    color: 'var(--color-gray-sub)',
                    lineHeight: 1.55,
                    maxHeight: 48,
                    overflow: 'hidden',
                  }}>
                    {a.replies.slice(0, 2).map(r => {
                      const ru = getUser(users, r.authorId);
                      return (
                        <div key={r.id} style={{ marginBottom: 2 }}>
                          <b style={{ color: 'var(--color-gray-text)', fontWeight: 600, marginRight: 4 }}>
                            {highlightText(ru?.name ?? '?', search)}
                          </b>
                          {highlightText(r.content, search)}
                        </div>
                      );
                    })}
                    {a.replies.length > 2 && (
                      <div style={{ color: 'var(--color-gray-muted)', fontSize: 10.5 }}>
                        还有 {a.replies.length - 2} 条回复…
                      </div>
                    )}
                  </div>
                )}
                <div className="sb-meta">
                  <span className="sb-time">{formatTime(a.createdAt)}</span>
                  <div className="sb-badges">
                    {a.replies.length > 0 && (
                      <span className="badge badge-replies">{a.replies.length} 回复</span>
                    )}
                    {a.isResolved ? (
                      <span className="badge badge-resolved">已解决</span>
                    ) : (
                      <span className="badge" style={{ background: 'var(--color-haze-50)', color: 'var(--color-haze-500)' }}>
                        进行中
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="search-wrap">
        <div className="search-input-wrap">
          <IconSearch />
          <input
            className="search-input"
            type="text"
            placeholder="搜索批注内容、作者、回复…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
        </div>
      </div>
    </>
  );
}
