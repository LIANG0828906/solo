import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useResourceContext, type Resource } from '../../context/ResourceContext';
import { requestScreenshot, updateResource, deleteResource } from '../ResourceManager/FetchService';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

const CARD_MIN = 280;
const CARD_MAX = 320;
const CARD_GAP = 16;

const tagChip: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  padding: '3px 9px', borderRadius: '8px',
  background: '#334155', color: '#E2E8F0',
  border: '2px dashed #475569', fontSize: '11px',
  cursor: 'pointer', transition: 'all 0.2s ease'
};

export default function KnowledgeBase() {
  const { currentResourceId, setCurrentResourceId } = useResourceContext();
  const [menuOpen, setMenuOpen] = useState(false);

  const currentResource = useMemo(() => {
    const { resources } = useResourceContext;
    return resources.find(r => r.id === currentResourceId) || null;
  }, [currentResourceId]);

  return (
    <div style={{ position: 'relative', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopSearchBar onToggleMenu={() => setMenuOpen(v => !v)} />

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {menuOpen && <MobileMenuOverlay onClose={() => setMenuOpen(false)} />}
        <FilterTreeWrapper mobileOpen={menuOpen} onCloseMobile={() => setMenuOpen(false)} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {currentResource
            ? <ResourceDetailView key={currentResource.id} resource={currentResource} onClose={() => setCurrentResourceId(null)} />
            : <CardGridView />}
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}

/* ===================== 顶部搜索栏 ===================== */
function TopSearchBar({ onToggleMenu }: { onToggleMenu: () => void }) {
  const { searchTerm, setSearchTerm, clearFilters, filterTags, resources, toast } = useResourceContext();
  const [local, setLocal] = useState(searchTerm);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isTablet = useMediaQuery('(max-width: 1200px)');

  useEffect(() => { setLocal(searchTerm); }, [searchTerm]);
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSearchTerm(local), 250);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [local, setSearchTerm]);

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -2px rgba(0,0,0,0.2)',
      padding: '14px 20px',
      borderBottom: '1px solid #1E293B'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onToggleMenu} style={{
          display: isTablet ? 'inline-flex' : 'none',
          padding: '8px 10px', borderRadius: '8px',
          background: '#334155', color: '#E2E8F0', border: 'none',
          cursor: 'pointer'
        }} aria-label="菜单">☰</button>

        <div style={{ position: 'relative', flex: 1, maxWidth: '720px' }}>
          <span style={{
            position: 'absolute', left: '14px', top: '50%',
            transform: 'translateY(-50%)', color: '#64748B',
            fontSize: '14px', pointerEvents: 'none'
          }}>🔍</span>
          <input
            value={local}
            onChange={e => setLocal(e.target.value)}
            placeholder="搜索标题、摘要、标签、URL..."
            style={{
              width: '100%', padding: '11px 44px 11px 40px',
              background: '#0F172A', color: '#E2E8F0',
              border: '1px solid #334155', borderRadius: '12px',
              fontSize: '14px', outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
            onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)'; }}
            onBlur={e => { e.target.style.borderColor = '#334155'; e.target.style.boxShadow = 'none'; }}
          />
          {local && (
            <button onClick={() => setLocal('')} style={{
              position: 'absolute', right: '10px', top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent', border: 'none', color: '#64748B',
              cursor: 'pointer', fontSize: '14px', padding: '4px'
            }}>✕</button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
          {filterTags.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', maxWidth: '360px' }}>
              {filterTags.map(t => (
                <ActiveTagChip key={t} tag={t} />
              ))}
              <button onClick={clearFilters} style={{
                fontSize: '11px', color: '#64748B',
                background: 'transparent', border: '1px solid #334155',
                padding: '4px 10px', borderRadius: '6px', cursor: 'pointer'
              }}>清除全部</button>
            </div>
          )}
          <div style={{
            fontSize: '12px', color: '#64748B', padding: '6px 12px',
            background: '#1E293B', borderRadius: '8px',
            border: '1px solid #334155', whiteSpace: 'nowrap'
          }}>
            共 <span style={{ color: '#3B82F6', fontWeight: 600 }}>{resources.length}</span> 条
          </div>
        </div>
      </div>
    </div>
  );
}

function ActiveTagChip({ tag }: { tag: string }) {
  const { toggleFilterTag } = useResourceContext();
  return (
    <span
      onClick={() => toggleFilterTag(tag)}
      style={{
        ...tagChip,
        background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
        borderColor: '#6366F1',
        borderStyle: 'solid',
        paddingRight: '6px',
        fontWeight: 500
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
    >
      {tag}
      <span style={{ marginLeft: '4px', fontSize: '12px', opacity: 0.8 }}>×</span>
    </span>
  );
}

/* ===================== 筛选树 ===================== */
function MobileMenuOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 80
    }} />
  );
}

function FilterTreeWrapper({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  const isTablet = useMediaQuery('(max-width: 1200px)');
  const desktopStyle: React.CSSProperties = isTablet ? {
    position: 'fixed', left: mobileOpen ? 0 : '-280px',
    top: 0, zIndex: 90, height: '100vh',
    transition: 'left 0.3s ease',
    boxShadow: mobileOpen ? '8px 0 24px rgba(0,0,0,0.4)' : 'none',
    width: '260px',
    padding: '72px 16px 16px',
    overflowY: 'auto',
    background: '#0F172A'
  } : {
    width: '260px', flexShrink: 0,
    borderRight: '1px solid #1E293B',
    overflowY: 'auto',
    padding: '16px',
    position: 'sticky', top: 0, alignSelf: 'flex-start',
    height: 'calc(100vh - 62px)',
    background: '#0F172A'
  };

  return (
    <div style={desktopStyle}>
      <FilterTree />
    </div>
  );
}

function FilterTree() {
  const { resources, filterTags, toggleFilterTag, searchTerm } = useResourceContext();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ tags: true, time: true, domain: true });
  const toggle = (k: string) => setExpanded(e => ({ ...e, [k]: !e[k] }));

  const tagCounts = useMemo(() => {
    const m = new Map<string, number>();
    resources.forEach(r => r.tags.forEach(t => m.set(t, (m.get(t) || 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40);
  }, [resources]);

  const timeBuckets = useMemo(() => {
    const now = Date.now();
    const DAY = 86400_000;
    const buckets = [
      { key: 'today', label: '今天', from: now - DAY },
      { key: 'week', label: '近 7 天', from: now - 7 * DAY },
      { key: 'month', label: '近 30 天', from: now - 30 * DAY },
      { key: 'older', label: '更早', from: 0 }
    ];
    return buckets.map(b => ({
      ...b,
      count: resources.filter(r => b.key === 'older'
        ? r.createdAt < now - 30 * DAY
        : r.createdAt >= b.from && (b.key === 'today' ? r.createdAt < now : b.key === 'week' ? r.createdAt < now - DAY : r.createdAt < now - 7 * DAY)
      ).length
    }));
  }, [resources]);

  const domainCounts = useMemo(() => {
    const m = new Map<string, number>();
    resources.forEach(r => { if (r.domain) m.set(r.domain, (m.get(r.domain) || 0) + 1); });
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  }, [resources]);

  const section = {
    marginBottom: '18px',
    border: '1px solid #1E293B',
    borderRadius: '10px',
    overflow: 'hidden'
  };
  const sectionHeader: React.CSSProperties = {
    padding: '10px 12px', fontSize: '12px', fontWeight: 600,
    color: '#94A3B8', cursor: 'pointer', userSelect: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#1E293B', border: 'none'
  };

  return (
    <div>
      {(searchTerm || filterTags.length > 0) && (
        <div style={{
          padding: '10px 12px', marginBottom: '16px',
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: '10px', fontSize: '12px',
          color: '#93C5FD', lineHeight: 1.6
        }}>
          当前筛选命中 <b style={{ color: '#3B82F6' }}>{resources.length > 0 ? 0 : 0}</b> 条
          <FilteredCountHint />
        </div>
      )}

      <div style={section}>
        <button onClick={() => toggle('tags')} style={sectionHeader}>
          <span>🏷️ 标签分类</span>
          <span style={{ transition: 'transform 0.2s', display: 'inline-block', transform: expanded.tags ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
        </button>
        {expanded.tags && (
          <div style={{ padding: '8px' }}>
            {tagCounts.length === 0 && <div style={{ fontSize: '11px', color: '#475569', padding: '6px 8px' }}>暂无标签</div>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {tagCounts.map(([t, c]) => {
                const active = filterTags.includes(t);
                return (
                  <span key={t}
                    onClick={() => toggleFilterTag(t)}
                    style={{
                      ...tagChip,
                      background: active ? '#475569' : tagChip.background,
                      borderColor: active ? '#3B82F6' : '#475569',
                      borderStyle: active ? 'solid' : 'dashed'
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.background = '#475569';
                        e.currentTarget.style.borderColor = '#3B82F6';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.background = tagChip.background as string;
                        e.currentTarget.style.borderColor = '#475569';
                      }
                    }}
                  >
                    {t}
                    <span style={{ marginLeft: '3px', opacity: 0.5, fontSize: '10px' }}>{c}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div style={section}>
        <button onClick={() => toggle('time')} style={sectionHeader}>
          <span>⏰ 收藏时间</span>
          <span style={{ transition: 'transform 0.2s', display: 'inline-block', transform: expanded.time ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
        </button>
        {expanded.time && (
          <div style={{ padding: '4px 0' }}>
            {timeBuckets.map(b => (
              <div key={b.key} style={{
                padding: '7px 14px', fontSize: '12px', color: '#94A3B8',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                cursor: b.count > 0 ? 'pointer' : 'default',
                opacity: b.count === 0 ? 0.4 : 1,
                transition: 'background 0.15s'
              }}
                onMouseEnter={e => { if (b.count > 0) e.currentTarget.style.background = '#1E293B'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span>{b.label}</span>
                <span style={{ fontSize: '11px', color: '#64748B' }}>{b.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={section}>
        <button onClick={() => toggle('domain')} style={sectionHeader}>
          <span>🌐 来源域名</span>
          <span style={{ transition: 'transform 0.2s', display: 'inline-block', transform: expanded.domain ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
        </button>
        {expanded.domain && (
          <div style={{ padding: '4px 0' }}>
            {domainCounts.length === 0 && <div style={{ fontSize: '11px', color: '#475569', padding: '6px 8px' }}>暂无数据</div>}
            {domainCounts.map(([d, c]) => (
              <div key={d} style={{
                padding: '6px 14px', fontSize: '12px', color: '#94A3B8',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                cursor: 'pointer', transition: 'background 0.15s'
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1E293B'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                onClick={() => {
                  if (!filterTags.includes(d)) toggleFilterTag(d);
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${d}&sz=16`}
                    alt="" style={{ width: 14, height: 14, borderRadius: 2, flexShrink: 0 }}
                    onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                  />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{d}</span>
                </span>
                <span style={{ fontSize: '11px', color: '#64748B', flexShrink: 0 }}>{c}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilteredCountHint() {
  const { filteredResources } = useResourceContext();
  return <><br />命中：<b style={{ color: '#3B82F6' }}>{filteredResources.length}</b> 条</>;
}

/* ===================== 卡片网格视图 ===================== */
function CardGridView() {
  const { filteredResources, resources } = useResourceContext();
  const displayList = filteredResources.length > 0 || resources.length === 0 ? filteredResources : [];

  if (resources.length === 0) return <EmptyState />;
  if (displayList.length === 0) return <NoResultsHint />;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        display: 'grid', gap: `${CARD_GAP}px`,
        gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_MIN}px, ${CARD_MAX}px))`,
        justifyContent: 'flex-start',
        alignItems: 'stretch'
      }}>
        {displayList.map((r, i) => (
          <ResourceCardWrapper key={r.id} resource={r} index={i} />
        ))}
      </div>
    </div>
  );
}

const ResourceCardWrapper = React.memo(function ResourceCardWrapper({ resource, index }: { resource: Resource; index: number }) {
  return <ResourceCard resource={resource} index={index} />;
});

function ResourceCard({ resource, index }: { resource: Resource; index: number }) {
  const { setCurrentResourceId, toggleFilterTag } = useResourceContext();
  const delay = Math.min(index * 0.05, 0.5);

  return (
    <article
      onClick={() => setCurrentResourceId(resource.id)}
      className="card-enter"
      style={{
        animationDelay: `${delay}s`,
        background: '#0F172A',
        borderRadius: '12px',
        border: '1px solid #334155',
        padding: '16px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        transition: 'transform 0.3s ease-out, border-color 0.3s ease-out, box-shadow 0.3s ease-out',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '200px'
      } as React.CSSProperties}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#3B82F6';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 10px 30px rgba(59,130,246,0.15), 0 4px 12px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#334155';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, transparent, #3B82F6, transparent)',
        opacity: 0, transition: 'opacity 0.3s'
      }} className="card-top-glow" />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: '#1E293B', border: '1px solid #334155',
          flexShrink: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', overflow: 'hidden'
        }}>
          {resource.favicon ? (
            <img
              src={resource.favicon}
              alt="" style={{ width: '18px', height: '18px', borderRadius: '3px' }}
              loading="lazy"
              onError={(e) => { const t = e.target as HTMLImageElement; t.style.display = 'none'; }}
            />
          ) : <span style={{ fontSize: '12px', color: '#64748B' }}>🌐</span>}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            margin: 0, fontSize: '18px', fontWeight: 600, color: '#FFFFFF',
            lineHeight: 1.4, wordBreak: 'break-word',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {resource.title}
          </h3>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px' }}>
            {resource.domain || resource.url.split('/')[2] || ''}
          </div>
        </div>
      </div>

      <p style={{
        margin: 0, fontSize: '13px', color: '#94A3B8',
        lineHeight: 1.6, flex: 1,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>
        {resource.summary || resource.description || '暂无摘要'}
      </p>

      {resource.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {resource.tags.slice(0, 4).map(t => (
            <span key={t}
              onClick={e => { e.stopPropagation(); toggleFilterTag(t); }}
              style={tagChip}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#475569';
                e.currentTarget.style.borderColor = '#3B82F6';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = tagChip.background as string;
                e.currentTarget.style.borderColor = '#475569';
              }}
            >
              {t}
            </span>
          ))}
          {resource.tags.length > 4 && (
            <span style={{ fontSize: '11px', color: '#64748B', padding: '3px 0' }}>+{resource.tags.length - 4}</span>
          )}
        </div>
      )}

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid #1E293B', paddingTop: '8px', marginTop: '2px'
      }}>
        <time style={{ fontSize: '12px', color: '#64748B' }}>
          {formatDate(resource.createdAt)}
        </time>
        <span style={{ fontSize: '11px', color: '#475569', transition: 'color 0.2s' }} className="read-more-hint">
          查看详情 →
        </span>
      </div>

      <style>{`
        article:hover .card-top-glow { opacity: 1 !important; }
        article:hover .read-more-hint { color: #3B82F6 !important; }
      `}</style>
    </article>
  );
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const diffH = (now.getTime() - ts) / 3600_000;
  if (diffH < 1) return `${Math.max(1, Math.floor(diffH * 60))} 分钟前`;
  if (diffH < 24) return `${Math.floor(diffH)} 小时前`;
  if (diffH < 48) return '昨天';
  if (diffH < 7 * 24) return `${Math.floor(diffH / 24)} 天前`;
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

function EmptyState() {
  return (
    <div style={{
      padding: '80px 40px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      gap: '16px', minHeight: '400px'
    }}>
      <div style={{
        width: '100px', height: '100px', borderRadius: '28px',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.1))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '48px', border: '1px solid rgba(59,130,246,0.2)'
      }}>📚</div>
      <div>
        <h2 style={{ color: '#F1F5F9', margin: '0 0 10px', fontSize: '22px', fontWeight: 700 }}>
          开始构建你的知识库
        </h2>
        <p style={{ color: '#64748B', margin: 0, fontSize: '14px', lineHeight: 1.8, maxWidth: '460px' }}>
          在左侧面板粘贴任意优质文章、工具或教程的 URL，系统将自动抓取内容、生成摘要与标签。<br />
          支持一键导入浏览器书签，快速整理散落的收藏资源。
        </p>
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
        {['React', 'TypeScript', 'NodeJs', '工具推荐', '教程'].map(t => (
          <span key={t} style={{
            ...tagChip, padding: '6px 14px', fontSize: '12px'
          }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function NoResultsHint() {
  const { clearFilters } = useResourceContext();
  return (
    <div style={{
      padding: '80px 40px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '12px'
    }}>
      <div style={{ fontSize: '56px', opacity: 0.3 }}>🔍</div>
      <h3 style={{ color: '#94A3B8', margin: 0, fontSize: '18px', fontWeight: 500 }}>未找到匹配的资源</h3>
      <p style={{ color: '#64748B', margin: 0, fontSize: '13px' }}>尝试调整关键词或清除筛选条件</p>
      <button onClick={clearFilters} style={{
        marginTop: '10px', padding: '8px 20px',
        background: 'transparent', color: '#3B82F6',
        border: '1px solid #3B82F6', borderRadius: '8px',
        cursor: 'pointer', fontSize: '13px'
      }}>清除所有筛选</button>
    </div>
  );
}

/* ===================== 详情视图 ===================== */
function ResourceDetailView({ resource: initial, onClose }: { resource: Resource; onClose: () => void }) {
  const { updateResource: ctxUpdate, removeResource: ctxRemove, toast, toggleFilterTag } = useResourceContext();
  const [resource, setResource] = useState<Resource>(initial);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [removingTagId, setRemovingTagId] = useState<string | null>(null);
  const [notes, setNotes] = useState(resource.notes || '');
  const [screenshot, setScreenshot] = useState<string | null>(resource.screenshotUrl || null);
  const [screenshotLoading, setScreenshotLoading] = useState(!resource.screenshotUrl);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!resource.screenshotUrl) {
      requestScreenshot(resource.url).then(u => {
        if (u) {
          setScreenshot(u);
          updateResource(resource.id, { screenshotUrl: u }).then(r => {
            if (r) setResource(r);
          });
        } else {
          setScreenshotLoading(false);
        }
      }).catch(() => setScreenshotLoading(false));
    }
  }, []);

  useEffect(() => {
    if (notesRef.current) {
      const t = notesRef.current;
      t.style.height = 'auto';
      t.style.height = t.scrollHeight + 'px';
    }
  }, [notes]);

  const triggerSaveNotes = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const saved = await updateResource(resource.id, { notes });
      if (saved) {
        setResource(saved);
        ctxUpdate(saved.id, { notes: saved.notes });
        toast('success', '笔记已保存');
      }
    }, 600);
  };

  const handleRemoveTag = async (tag: string) => {
    setRemovingTagId(tag);
    await new Promise(r => setTimeout(r, 200));
    const newTags = resource.tags.filter(t => t !== tag);
    const saved = await updateResource(resource.id, { tags: newTags });
    setRemovingTagId(null);
    if (saved) {
      setResource(saved);
      ctxUpdate(saved.id, { tags: saved.tags });
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定删除该资源？此操作不可撤销。')) return;
    const ok = await deleteResource(resource.id);
    if (ok) {
      ctxRemove(resource.id);
      toast('success', '已删除资源');
      onClose();
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(resource.url);
      toast('success', '链接已复制到剪贴板');
    } catch {
      toast('error', '复制失败，请手动复制');
    }
  };

  const handleExportMarkdown = () => {
    const md = [
      `# ${resource.title}`,
      '',
      `- 来源: [${resource.domain || resource.url}](${resource.url})`,
      `- 收藏时间: ${new Date(resource.createdAt).toLocaleString('zh-CN')}`,
      `- 标签: ${resource.tags.map(t => '`' + t + '`').join(' ')}`,
      '',
      '## 摘要',
      '',
      resource.summary || resource.description || '（暂无摘要）',
      '',
      resource.notes ? ['## 笔记', '', resource.notes, ''].join('\n') : ''
    ].filter(Boolean).join('\n');

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resource.title.slice(0, 50).replace(/[\\/:*?"<>|]/g, '_')}.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('success', '已导出为 Markdown');
  };

  const summaryText = resource.summary || resource.description || '暂无摘要信息';
  const summaryIsLong = summaryText.length > 280;

  const headerBtn: React.CSSProperties = {
    padding: '8px 14px', borderRadius: '8px',
    background: 'transparent', color: '#E2E8F0',
    border: '1px solid #334155', fontSize: '12px',
    cursor: 'pointer', display: 'inline-flex',
    alignItems: 'center', gap: '5px'
  };

  return (
    <div style={{
      animation: 'card-fade-in 0.3s ease-out'
    }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(8px)',
        padding: '14px 24px', borderBottom: '1px solid #1E293B',
        display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <button onClick={onClose} style={{
          padding: '8px 12px', borderRadius: '8px',
          background: '#1E293B', color: '#E2E8F0',
          border: '1px solid #334155', cursor: 'pointer',
          fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px'
        }}>← 返回列表</button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '15px', fontWeight: 600, color: '#F1F5F9',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>{resource.title}</div>
          <div style={{ fontSize: '11px', color: '#64748B' }}>{resource.url}</div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button onClick={handleShare} style={headerBtn}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.color = '#3B82F6'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#E2E8F0'; }}
          >🔗 分享链接</button>
          <button onClick={handleExportMarkdown} style={headerBtn}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.color = '#3B82F6'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#E2E8F0'; }}
          >📝 导出 MD</button>
          <button onClick={handleDelete} style={{
            ...headerBtn, borderColor: 'rgba(239,68,68,0.3)', color: '#F87171'
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = '#EF4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
          >🗑 删除</button>
        </div>
      </div>

      <div style={{
        padding: '24px', display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1fr)',
        gap: '24px', alignItems: 'start',
        maxWidth: '1400px', margin: '0 auto'
      }}>
        {/* 左侧截图 */}
        <div>
          <div style={{
            background: '#0F172A', borderRadius: '12px',
            border: '1px solid #334155', overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
          }}>
            {screenshotLoading || !screenshot ? (
              <div className="skeleton" style={{
                width: '100%',
                aspectRatio: '4/3',
                minHeight: '280px'
              }} />
            ) : (
              <a href={resource.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                <img
                  src={screenshot}
                  alt={resource.title}
                  loading="lazy"
                  style={{
                    width: '100%', display: 'block',
                    transition: 'transform 0.4s ease'
                  }}
                  onLoad={() => setScreenshotLoading(false)}
                  onError={() => setScreenshotLoading(false)}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.01)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                />
              </a>
            )}
          </div>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#1E293B', borderRadius: '8px' }}>
            <img src={resource.favicon} alt="" style={{ width: 18, height: 18, borderRadius: 3 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <a href={resource.url} target="_blank" rel="noopener noreferrer" style={{
              fontSize: '12px', color: '#93C5FD', textDecoration: 'none',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0
            }}>
              {resource.url}
            </a>
            <span style={{ fontSize: '11px', color: '#64748B', flexShrink: 0 }}>{formatDate(resource.createdAt)}</span>
          </div>
        </div>

        {/* 右侧详情 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#F8FAFC', lineHeight: 1.35, flex: 1 }}>
                {resource.title}
              </h1>
            </div>
            {resource.description && resource.description !== resource.summary && (
              <div style={{ fontSize: '13px', color: '#94A3B8', fontStyle: 'italic', marginBottom: '8px' }}>
                {resource.description}
              </div>
            )}
          </section>

          <SectionCard title="📄 内容摘要" action={summaryIsLong ? (
            <button onClick={() => setSummaryExpanded(v => !v)} style={{
              background: 'transparent', border: 'none',
              color: '#3B82F6', cursor: 'pointer', fontSize: '12px'
            }}>{summaryExpanded ? '收起' : '展开全部'}</button>
          ) : null}>
            <p style={{
              margin: 0, fontSize: '14px', color: '#CBD5E1',
              lineHeight: 1.8,
              display: summaryExpanded ? 'block' : '-webkit-box',
              WebkitLineClamp: summaryExpanded ? 'unset' : 6,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {summaryText}
            </p>
          </SectionCard>

          <SectionCard title="🏷️ 标签管理" hint="点击 × 移除（动画 0.2s）">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {resource.tags.length === 0 && (
                <div style={{ fontSize: '12px', color: '#64748B', padding: '4px 8px' }}>暂无标签</div>
              )}
              {resource.tags.map(t => (
                <span key={t}
                  onClick={() => { toggleFilterTag(t); onClose(); }}
                  className={removingTagId === t ? 'tag-leaving' : ''}
                  style={{
                    ...tagChip, padding: '5px 12px', fontSize: '12px',
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    overflow: removingTagId === t ? 'hidden' : 'visible',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#475569';
                    e.currentTarget.style.borderColor = '#3B82F6';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = tagChip.background as string;
                    e.currentTarget.style.borderColor = '#475569';
                  }}
                >
                  <span>{t}</span>
                  <button onClick={e => { e.stopPropagation(); handleRemoveTag(t); }}
                    style={{
                      background: 'transparent', border: 'none', color: '#94A3B8',
                      cursor: 'pointer', padding: 0, fontSize: '13px', lineHeight: 1,
                      width: '16px', height: '16px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', borderRadius: '50%'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'transparent'; }}
                  >×</button>
                </span>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="📝 我的笔记" hint={notes ? '已自动保存' : '点击开始记录，内容自动保存'}>
            <textarea
              ref={notesRef}
              value={notes}
              onChange={e => { setNotes(e.target.value); triggerSaveNotes(); }}
              rows={3}
              placeholder="记录你的想法、待办事项或关键摘录...支持换行"
              style={{
                width: '100%', resize: 'none',
                padding: '12px 14px',
                background: '#1E293B', color: '#E2E8F0',
                border: '1px solid #475569', borderRadius: '10px',
                fontSize: '13px', lineHeight: 1.7,
                outline: 'none', fontFamily: 'inherit',
                transition: 'border-color 0.3s, border-width 0.3s',
                minHeight: '80px'
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#3B82F6';
                e.currentTarget.style.borderWidth = '2px';
                e.currentTarget.style.padding = '11px 13px';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = '#475569';
                e.currentTarget.style.borderWidth = '1px';
                e.currentTarget.style.padding = '12px 14px';
              }}
            />
          </SectionCard>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px'
          }}>
            <InfoTile label="来源域名" value={resource.domain || '未知'} icon="🌐" />
            <InfoTile label="收藏时间" value={new Date(resource.createdAt).toLocaleDateString('zh-CN') + ' ' + new Date(resource.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} icon="⏰" />
            <InfoTile label="标签数量" value={`${resource.tags.length} 个`} icon="🏷️" />
            <InfoTile label="内容长度" value={`${(resource.summary || '').length + (resource.description || '').length} 字`} icon="📊" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, action, hint, children }: { title: string; action?: React.ReactNode; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#0F172A', borderRadius: '12px',
      border: '1px solid #334155', padding: '16px 18px'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9' }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {hint && <span style={{ fontSize: '11px', color: '#64748B' }}>{hint}</span>}
          {action}
        </div>
      </div>
      {children}
    </div>
  );
}

function InfoTile({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: '10px',
      background: '#0F172A', border: '1px solid #334155',
      display: 'flex', alignItems: 'center', gap: '10px'
    }}>
      <div style={{ fontSize: '20px' }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{
          fontSize: '12px', color: '#E2E8F0', fontWeight: 500,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>{value}</div>
      </div>
    </div>
  );
}

/* ===================== Toast 容器 ===================== */
function ToastContainer() {
  const { toasts } = useResourceContext();
  return (
    <div style={{
      position: 'fixed', top: '20px', right: '20px',
      zIndex: 9999, display: 'flex', flexDirection: 'column',
      gap: '8px', pointerEvents: 'none'
    }}>
      {toasts.map(t => (
        <div key={t.id}
          style={{
            animation: 'toast-in 0.25s ease-out',
            padding: '10px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            pointerEvents: 'auto',
            display: 'flex', alignItems: 'center', gap: '8px',
            border: '1px solid',
            ...(t.type === 'success' ? {
              background: 'rgba(34,197,94,0.15)',
              borderColor: 'rgba(34,197,94,0.4)',
              color: '#86EFAC'
            } : t.type === 'error' ? {
              background: 'rgba(239,68,68,0.15)',
              borderColor: 'rgba(239,68,68,0.4)',
              color: '#FCA5A5'
            } : {
              background: 'rgba(59,130,246,0.15)',
              borderColor: 'rgba(59,130,246,0.4)',
              color: '#93C5FD'
            })
          }}>
          <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '⚠' : 'ℹ'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
