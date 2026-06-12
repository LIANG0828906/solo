import { useEffect, useMemo, useState } from 'react';
import {
  Blessing,
  CheckinRecord,
  DataManager,
  EMOTION_META,
  EmotionType
} from '../utils/DataManager';
import ImageLightbox from './ImageLightbox';
import './AdminPanel.css';

interface Props {
  onLogout: () => void;
  onDataChanged: () => void;
}

type TabKey = 'blessings' | 'photos' | 'checkins' | 'stats';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'blessings', label: '祝福管理', icon: '💌' },
  { key: 'photos',    label: '照片墙',   icon: '🖼️' },
  { key: 'checkins',  label: '签到记录', icon: '📝' },
  { key: 'stats',     label: '统计报告', icon: '📊' }
];

function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN');
}

function useCountUp(target: number, duration = 800): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function StatCard({
  title, value, icon, borderColor,
}: { title: string; value: number; icon: string; borderColor: string }) {
  const display = useCountUp(value);
  return (
    <div className="stat-card" style={{ borderLeftColor }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{display}</div>
      <div className="stat-title">{title}</div>
    </div>
  );
}

function AdminPanel({ onLogout, onDataChanged }: Props) {
  const [tab, setTab] = useState<TabKey>('blessings');
  const [allBlessings, setAllBlessings] = useState<Blessing[]>([]);
  const [checkins, setCheckins] = useState<CheckinRecord[]>([]);
  const [search, setSearch] = useState('');
  const [filterEmotion, setFilterEmotion] = useState<EmotionType | 'all'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [toast, setToast] = useState('');

  const refresh = () => {
    setAllBlessings(DataManager.getBlessings());
    setCheckins(DataManager.getCheckins());
    onDataChanged();
  };

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (msg: string) => setToast(msg);

  const filtered = useMemo(() => {
    if (filterEmotion !== 'all' || search.trim()) {
      return DataManager.searchBlessings(search, filterEmotion === 'all' ? undefined : filterEmotion);
    }
    return allBlessings;
  }, [allBlessings, search, filterEmotion]);

  const allPhotos = useMemo(() => {
    const list: { src: string; nickname: string; createdAt: number }[] = [];
    for (const b of allBlessings) {
      for (const p of b.photos) {
        list.push({ src: p, nickname: b.nickname, createdAt: b.createdAt });
      }
    }
    return list;
  }, [allBlessings]);

  const stats = useMemo(() => DataManager.getStats(), [allBlessings]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(b => b.id)));
  };

  const handleDeleteSelected = () => {
    if (selected.size === 0) return showToast('请先选择要删除的祝福');
    if (!confirm(`确定删除选中的 ${selected.size} 条祝福吗？`)) return;
    DataManager.deleteBlessings(Array.from(selected));
    setSelected(new Set());
    refresh();
    showToast('已删除');
  };

  const handleExportJSON = () => {
    const content = DataManager.exportBlessingsJSON();
    downloadFile(
      `wedding-blessings-${Date.now()}.json`,
      content,
      'application/json'
    );
    showToast('JSON 已导出');
  };

  const handleExportCSV = () => {
    const content = DataManager.exportCheckinsCSV();
    const bom = '\uFEFF';
    downloadFile(
      `wedding-checkins-${Date.now()}.csv`,
      bom + content,
      'text/csv;charset=utf-8'
    );
    showToast('CSV 已导出');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span style={{ fontSize: 22 }}>💒</span>
          <div>
            <div className="admin-brand-title">婚礼管理后台</div>
            <div className="admin-brand-sub">Wedding Admin</div>
          </div>
        </div>
        <nav className="admin-nav">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`nav-item ${tab === t.key ? 'active' : ''}`}
              onClick={() => { setTab(t.key); setSelected(new Set()); }}
            >
              <span className="nav-icon">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="admin-footer">
          <button className="logout-btn" onClick={onLogout}>
            ← 返回首页
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h2 className="admin-page-title">{TABS.find(t => t.key === tab)?.label}</h2>
          <div className="admin-header-actions">
            {tab === 'blessings' && (
              <>
                <button className="btn-ghost btn-sm" onClick={handleExportJSON}>📥 导出 JSON</button>
                <button
                  className="btn-ghost btn-sm danger"
                  onClick={handleDeleteSelected}
                  disabled={selected.size === 0}
                >
                  🗑️ 删除 ({selected.size})
                </button>
              </>
            )}
            {tab === 'checkins' && (
              <button className="btn-ghost btn-sm" onClick={handleExportCSV}>📥 导出 CSV</button>
            )}
          </div>
        </header>

        <div className="admin-content">
          {tab === 'blessings' && (
            <section className="tab-pane">
              <div className="filter-bar">
                <input
                  className="form-input filter-input"
                  placeholder="🔍 搜索昵称或祝福语…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <div className="emotion-filter">
                  <button
                    className={`chip ${filterEmotion === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterEmotion('all')}
                  >全部</button>
                  {(Object.keys(EMOTION_META) as EmotionType[]).map(k => {
                    const m = EMOTION_META[k];
                    return (
                      <button
                        key={k}
                        className={`chip ${filterEmotion === k ? 'active' : ''}`}
                        style={filterEmotion === k ? { background: m.bg, color: m.color, borderColor: m.color } : undefined}
                        onClick={() => setFilterEmotion(k)}
                      >{m.emoji} {m.label}</button>
                    );
                  })}
                </div>
                <label className="select-all">
                  <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleSelectAll} />
                  全选
                </label>
              </div>
              <div className="blessing-list">
                {filtered.length === 0 ? (
                  <div className="empty-state">暂无匹配的祝福</div>
                ) : (
                  filtered.map(b => {
                    const m = EMOTION_META[b.emotion];
                    const isSel = selected.has(b.id);
                    return (
                      <div key={b.id} className={`blessing-row card ${isSel ? 'selected' : ''}`}>
                        <label className="row-check">
                          <input type="checkbox" checked={isSel} onChange={() => toggleSelect(b.id)} />
                        </label>
                        <div className="row-main">
                          <div className="row-head">
                            <span className="row-nick">{b.nickname}</span>
                            <span className="row-time">{formatDateTime(b.createdAt)} · {b.ip}</span>
                            <span
                              className="emotion-tag"
                              style={{ background: m.bg, color: m.color }}
                            >
                              {m.emoji} {m.label}
                            </span>
                            <span className="row-likes">❤️ {b.likes}</span>
                          </div>
                          <div className="row-content">{b.content}</div>
                          {b.photos.length > 0 && (
                            <div className="row-photos">
                              {b.photos.map((p, i) => (
                                <div
                                  key={i}
                                  className="row-thumb"
                                  onClick={() => setLightbox({ images: b.photos, index: i })}
                                >
                                  <img src={p} alt="" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {tab === 'photos' && (
            <section className="tab-pane">
              {allPhotos.length === 0 ? (
                <div className="empty-state">还没有上传任何照片</div>
              ) : (
                <div className="photo-waterfall">
                  {allPhotos.map((p, i) => (
                    <div
                      key={i}
                      className="wf-item"
                      onClick={() => setLightbox({ images: allPhotos.map(x => x.src), index: i })}
                    >
                      <div className="wf-placeholder">
                        <span className="wf-spinner" />
                      </div>
                      <img
                        src={p.src}
                        alt=""
                        className="wf-img"
                        loading="lazy"
                        onLoad={e => {
                          (e.target as HTMLImageElement).classList.add('loaded');
                        }}
                      />
                      <div className="wf-meta">
                        <span>{p.nickname}</span>
                        <span>{new Date(p.createdAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'checkins' && (
            <section className="tab-pane">
              <div className="table-wrap card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>#</th>
                      <th>昵称</th>
                      <th style={{ width: 200 }}>签到时间</th>
                      <th style={{ width: 120 }}>IP属地</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkins.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="empty-td">暂无签到记录</td>
                      </tr>
                    ) : (
                      checkins.map((r, i) => (
                        <tr key={r.id} className={i % 2 === 1 ? 'alt' : ''}>
                          <td>{i + 1}</td>
                          <td style={{ fontWeight: 600 }}>{r.nickname}</td>
                          <td>{formatDateTime(r.createdAt)}</td>
                          <td>{r.ip}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === 'stats' && (
            <section className="tab-pane">
              <div className="stats-grid">
                <StatCard title="总祝福数" value={stats.totalBlessings} icon="💌" borderColor="#ff6b9d" />
                <StatCard title="照片总数" value={stats.totalPhotos} icon="🖼️" borderColor="#f7d794" />
                <StatCard title="平均祝福字数" value={stats.avgWords} icon="✍️" borderColor="#5dade2" />
                <StatCard title="签到人数" value={checkins.length} icon="🎉" borderColor="#58d68d" />
              </div>
              <div className="card stats-detail">
                <h4 style={{ marginTop: 0 }}>📊 表情分布</h4>
                <EmotionBreakdown blessings={allBlessings} />
              </div>
            </section>
          )}
        </div>
      </main>

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}

      {toast && <div className="admin-toast">{toast}</div>}
    </div>
  );
}

function EmotionBreakdown({ blessings }: { blessings: Blessing[] }) {
  const total = blessings.length || 1;
  const counts: Record<EmotionType, number> = { happy: 0, moved: 0, funny: 0, warm: 0 };
  for (const b of blessings) counts[b.emotion] = (counts[b.emotion] || 0) + 1;
  return (
    <div className="breakdown">
      {(Object.keys(counts) as EmotionType[]).map(k => {
        const m = EMOTION_META[k];
        const pct = Math.round((counts[k] / total) * 100);
        return (
          <div key={k} className="breakdown-row">
            <div className="bd-label" style={{ color: m.color }}>
              {m.emoji} {m.label}
            </div>
            <div className="bd-bar">
              <div
                className="bd-bar-fill"
                style={{ width: `${pct}%`, background: m.bg, borderColor: m.color }}
              />
            </div>
            <div className="bd-val">{counts[k]} · {pct}%</div>
          </div>
        );
      })}
    </div>
  );
}

export default AdminPanel;
