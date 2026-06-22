import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useCoffeeStore } from '../store';
import { BREW_METHODS, RATING_RANGES } from '../types';
import type { CoffeeRecord } from '../types';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface CoffeeListProps {
  tagFilter: string | null;
  onTagFilterCleared: () => void;
}

function ratingGradient(rating: number): string {
  if (rating >= 80) return 'linear-gradient(135deg, #6B8E5A, #4A6B3E)';
  if (rating >= 50) return 'linear-gradient(135deg, #D4A574, #A87642)';
  return 'linear-gradient(135deg, #A85757, #7E3D3D)';
}

function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), 'yyyy年M月d日 HH:mm', { locale: zhCN });
  } catch {
    return iso;
  }
}

function formatShortDate(iso: string): string {
  try {
    return format(parseISO(iso), 'M月d日', { locale: zhCN });
  } catch {
    return iso;
  }
}

export default function CoffeeList({ tagFilter, onTagFilterCleared }: CoffeeListProps) {
  const records = useCoffeeStore((s) => s.records);
  const deleteRecord = useCoffeeStore((s) => s.deleteRecord);

  const [search, setSearch] = useState('');
  const [brewFilter, setBrewFilter] = useState('__all__');
  const [ratingIdx, setRatingIdx] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CoffeeRecord | null>(null);
  const [fading, setFading] = useState(false);

  const pressTimer = useRef<number | null>(null);
  const movedRef = useRef(false);

  const filterKey = `${search}__${brewFilter}__${ratingIdx}__${tagFilter ?? ''}`;

  useEffect(() => {
    setFading(true);
    const t = window.setTimeout(() => setFading(false), 280);
    return () => window.clearTimeout(t);
  }, [filterKey]);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    const range = RATING_RANGES[ratingIdx];
    return records.filter((r) => {
      if (tagFilter && !r.flavorTags.includes(tagFilter)) return false;
      if (kw && !(r.name.toLowerCase().includes(kw) || r.notes.toLowerCase().includes(kw))) return false;
      if (brewFilter !== '__all__' && r.brewMethod !== brewFilter) return false;
      if (r.rating < range.min || r.rating > range.max) return false;
      return true;
    });
  }, [records, search, brewFilter, ratingIdx, tagFilter]);

  const onCardClick = useCallback((id: string) => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const startPress = useCallback((record: CoffeeRecord) => {
    movedRef.current = false;
    pressTimer.current = window.setTimeout(() => {
      setDeleteTarget(record);
      pressTimer.current = null;
    }, 650);
  }, []);

  const cancelPress = useCallback(() => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }, []);

  const onPointerMove = useCallback(() => {
    movedRef.current = true;
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteRecord(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, deleteRecord]);

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>📖 我的咖啡护照</h2>
        {tagFilter && (
          <button
            className="btn btn-secondary"
            onClick={onTagFilterCleared}
            style={{ padding: '6px 14px', fontSize: 13 }}
          >
            🏷️ 标签筛选：{tagFilter} ✕
          </button>
        )}
      </div>

      <div className="filter-bar">
        <input
          className="input"
          type="text"
          placeholder="🔍 搜索咖啡名称或笔记…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="select" value={brewFilter} onChange={(e) => setBrewFilter(e.target.value)}>
          <option value="__all__">☕ 全部冲泡方式</option>
          {BREW_METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select className="select" value={ratingIdx} onChange={(e) => setRatingIdx(Number(e.target.value))}>
          {RATING_RANGES.map((r, i) => (
            <option key={i} value={i}>⭐ {r.label}</option>
          ))}
        </select>
      </div>

      <div className={'list-transition-wrapper' + (fading ? ' fading' : '')}>
        {filtered.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state-icon">☕</div>
            <div className="empty-state-text">
              {records.length === 0 ? '还没有品鉴记录呢' : '没有匹配的记录'}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {records.length === 0 ? '去「新记录」添加你的第一杯咖啡吧～' : '试试调整筛选条件或清空搜索'}
            </p>
          </div>
        ) : (
          <div className="coffee-grid">
            {filtered.map((r) => (
              <article
                key={r.id}
                className="coffee-card"
                onClick={() => onCardClick(r.id)}
                onPointerDown={() => startPress(r)}
                onPointerUp={cancelPress}
                onPointerLeave={cancelPress}
                onPointerMove={onPointerMove}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setDeleteTarget(r);
                }}
              >
                <header className="coffee-card-header">
                  <div>
                    <div className="coffee-name">{r.name}</div>
                    <div className="card-meta" style={{ marginTop: 4 }}>
                      {r.brewMethod} · {formatShortDate(r.createdAt)}
                    </div>
                  </div>
                  <div
                    className="rating-badge"
                    style={{ background: ratingGradient(r.rating) }}
                    title={`评分 ${r.rating}`}
                  >
                    {r.rating}
                  </div>
                </header>

                {r.flavorTags.length > 0 && (
                  <div className="card-tag-list">
                    {r.flavorTags.slice(0, 5).map((t) => (
                      <span key={t} className="card-tag">{t}</span>
                    ))}
                    {r.flavorTags.length > 5 && (
                      <span className="card-tag">+{r.flavorTags.length - 5}</span>
                    )}
                  </div>
                )}

                <div className={'card-details' + (expandedId === r.id ? ' open' : '')}>
                  <hr className="details-divider" />
                  <div className="details-grid">
                    <div><span className="detail-label">品种</span></div>
                    <div><span className="detail-value">{r.variety}</span></div>
                    <div><span className="detail-label">烘焙日期</span></div>
                    <div><span className="detail-value">{r.roastDate}</span></div>
                    <div><span className="detail-label">冲泡方式</span></div>
                    <div><span className="detail-value">{r.brewMethod}</span></div>
                    <div><span className="detail-label">品鉴时间</span></div>
                    <div><span className="detail-value">{formatDate(r.createdAt)}</span></div>
                    <div><span className="detail-label">风味标签</span></div>
                    <div><span className="detail-value">{r.flavorTags.join('、') || '—'}</span></div>
                  </div>
                  {r.notes && (
                    <div className="notes-block">
                      💭 {r.notes}
                    </div>
                  )}
                  <div style={{ marginTop: 12, textAlign: 'right' }}>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '6px 14px', fontSize: 12 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(r);
                      }}
                    >
                      🗑️ 删除
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">⚠️ 确认删除？</div>
            <p className="modal-message">
              即将删除「<strong style={{ color: 'var(--coffee)' }}>{deleteTarget.name}</strong>」的品鉴记录，
              此操作不可恢复。
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                取消
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
