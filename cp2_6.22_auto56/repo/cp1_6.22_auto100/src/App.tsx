import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Work, AddWorkForm, Tag, TagCategory } from './types';
import { fetchWorks, getRecommendations, addWork, getFavoriteCount } from './api';
import WorksCarousel from './components/WorksCarousel';
import WorksList from './components/WorksList';

const App: React.FC = () => {
  const [sortedWorks, setSortedWorks] = useState<Work[]>([]);
  const [topRecs, setTopRecs] = useState<Work[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [topThree, setTopThree] = useState<Work[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lastSortTime, setLastSortTime] = useState<number>(0);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCover, setNewCover] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tagCategory, setTagCategory] = useState<TagCategory>('tech');
  const [tempTags, setTempTags] = useState<Tag[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsAdmin(params.get('mode') === 'admin');
  }, []);

  const loadData = useCallback(async () => {
    const { favorites: favs } = await fetchWorks();
    setFavorites(favs);
    const sorted = await getRecommendations();
    setSortedWorks(sorted);
    setTopRecs(sorted.slice(0, 3));
    setTopThree(sorted.slice(0, 3));
    setLastSortTime(Date.now());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const sorted = await getRecommendations();
      setSortedWorks(sorted);
      setTopRecs(sorted.slice(0, 3));
      setTopThree(sorted.slice(0, 3));
      setLastSortTime(Date.now());
      const { favorites: favs } = await fetchWorks();
      setFavorites(favs);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleFavoriteChange = useCallback(() => {
    setTimeout(async () => {
      const { favorites: favs } = await fetchWorks();
      setFavorites(favs);
      const sorted = await getRecommendations();
      setSortedWorks(sorted);
      setTopRecs(sorted.slice(0, 3));
      setTopThree(sorted.slice(0, 3));
      setLastSortTime(Date.now());
    }, 150);
  }, []);

  const handleAddTag = () => {
    const name = tagInput.trim();
    if (!name) return;
    if (tempTags.some(t => t.name === name)) return;
    setTempTags([...tempTags, { name, category: tagCategory }]);
    setTagInput('');
  };

  const handleRemoveTag = (name: string) => {
    setTempTags(tempTags.filter(t => t.name !== name));
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCover.trim() || !newDesc.trim() || tempTags.length === 0) {
      alert('请填写完整作品信息并至少添加一个标签');
      return;
    }
    const form: AddWorkForm = {
      title: newTitle.trim(),
      coverUrl: newCover.trim(),
      description: newDesc.trim(),
      tags: tempTags
    };
    await addWork(form);
    setNewTitle('');
    setNewCover('');
    setNewDesc('');
    setTempTags([]);
    setShowAddForm(false);
    await loadData();
  };

  const maxScore = useMemo(() => {
    if (topThree.length === 0) return 1;
    return Math.max(...topThree.map(w => w.score), 1);
  }, [topThree]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const tagColorMap: Record<string, string> = {
    tech: 'rgba(79, 139, 249, 0.25)',
    design: 'rgba(155, 89, 182, 0.25)',
    illustration: 'rgba(233, 69, 96, 0.25)'
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.siteTitle}>🎨 作品集展示平台</h1>
            <p style={styles.siteSubtitle}>
              基于用户行为智能排序 · 上次排序更新: {new Date(lastSortTime).toLocaleTimeString()}
            </p>
          </div>
          <div style={styles.headerRight}>
            <span style={styles.favCount} title="当前收藏数">
              ❤️ {favorites.size}
            </span>
            {isAdmin && <span style={styles.adminBadge}>管理员模式</span>}
          </div>
        </header>

        <section style={styles.carouselSection}>
          <WorksCarousel works={topRecs} />
        </section>

        <section style={styles.statsSection}>
          <div style={styles.statsHeader}>
            <h2 style={styles.sectionTitle}>📊 热度排行榜</h2>
            <span style={styles.statsHint}>Top 3 作品得分对比</span>
          </div>
          <div style={styles.chart}>
            {topThree.map((w, idx) => {
              const pct = maxScore > 0 ? (w.score / maxScore) * 100 : 0;
              const goldIntensity = 1 - idx * 0.35;
              return (
                <div key={w.id} style={styles.chartRow}>
                  <div style={styles.chartRank}>#{idx + 1}</div>
                  <div style={styles.chartName} title={w.title}>
                    {w.title.length > 18 ? w.title.slice(0, 18) + '…' : w.title}
                  </div>
                  <div style={styles.chartBarWrap}>
                    <div
                      style={{
                        ...styles.chartBar,
                        width: `${Math.max(pct, 2)}%`,
                        background: `linear-gradient(90deg,
                          rgba(201, 162, 39, ${goldIntensity * 0.95}) 0%,
                          rgba(233, 69, 96, ${goldIntensity * 0.8}) 60%,
                          rgba(158, 158, 158, ${0.5 + goldIntensity * 0.3}) 100%)`,
                        transition: 'width 0.5s ease-out, background 0.5s ease-out'
                      }}
                    />
                  </div>
                  <div style={styles.chartScore}>{w.score.toFixed(1)}</div>
                </div>
              );
            })}
            {topThree.length === 0 && (
              <div style={styles.emptyChart}>暂无数据</div>
            )}
          </div>
        </section>

        <section style={styles.listSection}>
          <div style={styles.listHeader}>
            <h2 style={styles.sectionTitle}>🖼️ 全部作品</h2>
            <span style={styles.listCount}>共 {sortedWorks.length} 件 · 按热度降序</span>
          </div>
          <WorksList
            works={sortedWorks}
            favorites={favorites}
            onFavoriteChange={handleFavoriteChange}
          />
        </section>

        {isAdmin && (
          <section style={styles.adminSection}>
            <div style={styles.adminHeader}>
              <h2 style={{ ...styles.sectionTitle, margin: 0 }}>🛠️ 站主管理面板</h2>
              <button
                style={styles.addBtn}
                onClick={() => setShowAddForm(!showAddForm)}
              >
                {showAddForm ? '✕ 取消' : '+ 添加新作品'}
              </button>
            </div>

            {showAddForm && (
              <form style={styles.addForm} onSubmit={handleSubmitWork}>
                <div style={styles.formRow}>
                  <label style={styles.formLabel}>
                    作品标题
                    <input
                      type="text"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="输入作品标题"
                      style={styles.input}
                    />
                  </label>
                </div>
                <div style={styles.formRow}>
                  <label style={styles.formLabel}>
                    封面图片链接
                    <input
                      type="text"
                      value={newCover}
                      onChange={e => setNewCover(e.target.value)}
                      placeholder="https://..."
                      style={styles.input}
                    />
                  </label>
                </div>
                <div style={styles.formRow}>
                  <label style={styles.formLabel}>
                    作品简介
                    <textarea
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                      placeholder="简要描述这件作品..."
                      rows={3}
                      style={{ ...styles.input, resize: 'vertical' }}
                    />
                  </label>
                </div>
                <div style={styles.formRow}>
                  <label style={styles.formLabel}>标签管理</label>
                  <div style={styles.tagManager}>
                    <div style={styles.tagInputRow}>
                      <select
                        value={tagCategory}
                        onChange={e => setTagCategory(e.target.value as TagCategory)}
                        style={styles.select}
                      >
                        <option value="tech">技术类 (蓝)</option>
                        <option value="design">设计类 (紫)</option>
                        <option value="illustration">插画类 (粉)</option>
                      </select>
                      <input
                        type="text"
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                        placeholder="输入标签名后回车"
                        style={{ ...styles.input, flex: 1 }}
                      />
                      <button type="button" onClick={handleAddTag} style={styles.tagAddBtn}>
                        添加
                      </button>
                    </div>
                    <div style={styles.tagList}>
                      {tempTags.map(t => (
                        <span
                          key={t.name}
                          style={{
                            ...styles.chip,
                            backgroundColor: tagColorMap[t.category],
                            cursor: 'pointer'
                          }}
                          onClick={() => handleRemoveTag(t.name)}
                          title="点击移除"
                        >
                          {t.name} ✕
                        </span>
                      ))}
                      {tempTags.length === 0 && (
                        <span style={styles.emptyHint}>尚未添加标签</span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={styles.formActions}>
                  <button type="submit" style={styles.submitBtn}>
                    ✅ 提交作品
                  </button>
                </div>
              </form>
            )}

            <div style={styles.adminTableWrap}>
              <table style={styles.adminTable}>
                <thead>
                  <tr>
                    <th style={styles.th}>作品名称</th>
                    <th style={styles.th}>上传时间</th>
                    <th style={styles.th}>当前得分</th>
                    <th style={styles.th}>收藏次数</th>
                    <th style={styles.th}>标签</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedWorks.map(w => (
                    <tr key={w.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: 600 }}>
                        {w.title.length > 20 ? w.title.slice(0, 20) + '…' : w.title}
                      </td>
                      <td style={styles.td}>{formatTime(w.createdAt)}</td>
                      <td style={{ ...styles.td, color: '#ffb74d', fontWeight: 600 }}>
                        {w.score.toFixed(2)}
                      </td>
                      <td style={styles.td}>{getFavoriteCount(w.id)}</td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {w.tags.map(t => (
                            <span
                              key={t.name}
                              style={{
                                ...styles.chip,
                                backgroundColor: tagColorMap[t.category],
                                fontSize: 11,
                                padding: '2px 8px'
                              }}
                            >
                              {t.name}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <footer style={styles.footer}>
          <p style={styles.footerText}>
            © 2024 Smart Portfolio · 浏览 1 分 · 点击 2 分 · 收藏 3 分 · 每小时衰减 5%
          </p>
        </footer>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; }
        button:hover { filter: brightness(1.1); }
        button:active { filter: brightness(0.95); }
        @media (max-width: 960px) {
          .works-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .carousel-viewport { height: 50vw !important; }
        }
        @media (max-width: 640px) {
          .works-grid { grid-template-columns: 1fr !important; }
          .chart-row { flex-wrap: wrap !important; gap: 8px !important; }
          .chart-name { width: 100% !important; }
          .chart-bar-wrap { width: 100% !important; }
        }
        @keyframes hover { }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#1a1a2e',
    color: '#e0e0e0'
  },
  container: {
    maxWidth: 1200,
    minWidth: 300,
    margin: '0 auto',
    padding: '32px 24px 48px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 28,
    borderBottom: '1px solid rgba(224, 224, 224, 0.1)',
    marginBottom: 32,
    gap: 16,
    flexWrap: 'wrap'
  },
  siteTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: '#e0e0e0',
    letterSpacing: 0.5
  },
  siteSubtitle: {
    margin: '6px 0 0 0',
    fontSize: 13,
    color: 'rgba(224, 224, 224, 0.55)'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12
  },
  favCount: {
    padding: '6px 14px',
    borderRadius: 20,
    backgroundColor: 'rgba(233, 69, 96, 0.15)',
    color: '#e94560',
    fontSize: 14,
    fontWeight: 600
  },
  adminBadge: {
    padding: '6px 14px',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 183, 77, 0.15)',
    color: '#ffb74d',
    fontSize: 14,
    fontWeight: 600
  },
  carouselSection: {
    marginBottom: 32
  },
  statsSection: {
    marginBottom: 32,
    padding: 24,
    backgroundColor: '#16213e',
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
  },
  statsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 10
  },
  sectionTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
    color: '#e0e0e0'
  },
  statsHint: {
    fontSize: 12,
    color: 'rgba(224, 224, 224, 0.5)'
  },
  chart: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14
  },
  chartRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    transition: 'all 0.5s ease-out'
  },
  chartRank: {
    width: 36,
    fontSize: 16,
    fontWeight: 700,
    color: '#ffb74d',
    flexShrink: 0
  },
  chartName: {
    width: 180,
    fontSize: 14,
    color: '#e0e0e0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flexShrink: 0
  },
  chartBarWrap: {
    flex: 1,
    height: 22,
    backgroundColor: 'rgba(224, 224, 224, 0.08)',
    borderRadius: 11,
    overflow: 'hidden'
  },
  chartBar: {
    height: '100%',
    borderRadius: 11,
    minWidth: 4,
    transition: 'width 0.5s ease-out, background 0.5s ease-out'
  },
  chartScore: {
    width: 60,
    fontSize: 14,
    fontWeight: 600,
    color: '#ffb74d',
    textAlign: 'right',
    flexShrink: 0
  },
  emptyChart: {
    padding: 20,
    textAlign: 'center',
    color: 'rgba(224, 224, 224, 0.4)',
    fontSize: 14
  },
  listSection: {
    marginBottom: 32
  },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 10
  },
  listCount: {
    fontSize: 13,
    color: 'rgba(224, 224, 224, 0.5)'
  },
  adminSection: {
    marginTop: 40,
    padding: 28,
    backgroundColor: '#16213e',
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
  },
  adminHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12
  },
  addBtn: {
    padding: '10px 20px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: '#e94560',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease-out'
  },
  addForm: {
    padding: 20,
    backgroundColor: 'rgba(26, 26, 46, 0.5)',
    borderRadius: 12,
    marginBottom: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  formRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  formLabel: {
    fontSize: 13,
    color: 'rgba(224, 224, 224, 0.75)',
    fontWeight: 500,
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  input: {
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid rgba(224, 224, 224, 0.15)',
    backgroundColor: '#1a1a2e',
    color: '#e0e0e0',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s ease-out',
    fontFamily: 'inherit'
  },
  select: {
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid rgba(224, 224, 224, 0.15)',
    backgroundColor: '#1a1a2e',
    color: '#e0e0e0',
    fontSize: 14,
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  tagManager: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  tagInputRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap'
  },
  tagAddBtn: {
    padding: '10px 18px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: 'rgba(79, 139, 249, 0.25)',
    color: '#8fb3ff',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease-out'
  },
  tagList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: {
    padding: '5px 12px',
    borderRadius: 14,
    fontSize: 13,
    color: '#e0e0e0',
    transition: 'all 0.2s ease-out'
  },
  emptyHint: {
    fontSize: 13,
    color: 'rgba(224, 224, 224, 0.4)'
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  submitBtn: {
    padding: '12px 28px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: 'linear-gradient(135deg, #e94560, #ff7d93)',
    background: 'linear-gradient(135deg, #e94560, #ff7d93)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease-out'
  },
  adminTableWrap: {
    overflowX: 'auto',
    borderRadius: 10,
    border: '1px solid rgba(224, 224, 224, 0.08)'
  },
  adminTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13
  },
  th: {
    padding: '14px 16px',
    textAlign: 'left',
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    color: 'rgba(224, 224, 224, 0.7)',
    fontWeight: 600,
    borderBottom: '1px solid rgba(224, 224, 224, 0.08)',
    whiteSpace: 'nowrap'
  },
  tr: {
    borderBottom: '1px solid rgba(224, 224, 224, 0.05)'
  },
  td: {
    padding: '12px 16px',
    color: 'rgba(224, 224, 224, 0.85)',
    verticalAlign: 'middle'
  },
  footer: {
    marginTop: 48,
    paddingTop: 24,
    borderTop: '1px solid rgba(224, 224, 224, 0.08)',
    textAlign: 'center'
  },
  footerText: {
    margin: 0,
    fontSize: 12,
    color: 'rgba(224, 224, 224, 0.4)'
  }
};

export default App;
