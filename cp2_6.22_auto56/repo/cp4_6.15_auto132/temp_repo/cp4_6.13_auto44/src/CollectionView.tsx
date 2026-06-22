import { useEffect, useMemo, useRef, useState } from 'react';
import { usePlantStore, type SavedPlant } from './store';
import { renderPlantSVG } from './svgRenderer';
import { MOODS, formatDate, formatDateTime, type Mood } from './plantGenerator';

interface CardLayout {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

export default function CollectionView() {
  const { savedPlants, isLoading, computeStats } = usePlantStore();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [containerW, setContainerW] = useState(720);

  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(600);

  const { columns, columnGap, cardGap } = useMemo(() => {
    if (containerW <= 520) return { columns: 1, columnGap: 12, cardGap: 16 };
    if (containerW <= 900) return { columns: 2, columnGap: 16, cardGap: 16 };
    if (containerW <= 1200) return { columns: 3, columnGap: 16, cardGap: 16 };
    return { columns: 4, columnGap: 16, cardGap: 18 };
  }, [containerW]);

  const cardBaseHeight = 260;
  const cardMaxExtra = 50;

  const { layouts, totalHeight, cardWidth } = useMemo(() => {
    if (containerW <= 0) return { layouts: [] as CardLayout[], totalHeight: 0, cardWidth: 0 };
    const usableW = containerW - 8 * 2;
    const totalGapW = (columns - 1) * columnGap;
    const w = Math.floor((usableW - totalGapW) / columns);
    if (w <= 0) return { layouts: [] as CardLayout[], totalHeight: 0, cardWidth: 0 };

    const colHeights = new Array(columns).fill(0);
    const ls: CardLayout[] = [];

    for (let i = 0; i < savedPlants.length; i++) {
      const saved = savedPlants[i];
      const plant = saved.plant;
      const hasNote = !!saved.note;
      const noteExtra = hasNote ? Math.min(50, 14 + Math.ceil(saved.note.length / 16) * 16) : 0;

      const densityFactor = Math.min(1, plant.metrics.leafCount / 60);
      const h = cardBaseHeight + Math.floor(densityFactor * cardMaxExtra) + noteExtra;

      let shortestIdx = 0;
      for (let c = 1; c < columns; c++) {
        if (colHeights[c] < colHeights[shortestIdx]) shortestIdx = c;
      }
      const left = 8 + shortestIdx * (w + columnGap);
      const top = colHeights[shortestIdx];
      colHeights[shortestIdx] = top + h + cardGap;
      ls.push({ id: saved.id, left, top, width: w, height: h });
    }
    const th = Math.max(...colHeights) - cardGap + 8 * 2;
    return { layouts: ls, totalHeight: Math.max(th, 0), cardWidth: w };
  }, [savedPlants, columns, columnGap, cardGap, containerW]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        setContainerW(Math.floor(e.contentRect.width));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setViewportH(el.clientHeight);
    const onScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setViewportH(e.contentRect.height);
    });
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, []);

  const visibleMargin = 120;
  const windowTop = Math.max(0, scrollTop - visibleMargin);
  const windowBottom = scrollTop + viewportH + visibleMargin;

  const visibleCards = useMemo(() => {
    const result: Array<{ saved: SavedPlant; layout: CardLayout }> = [];
    for (let i = 0; i < layouts.length; i++) {
      const l = layouts[i];
      if (l.top + l.height < windowTop) continue;
      if (l.top > windowBottom) break;
      const sp = savedPlants.find((s) => s.id === l.id);
      if (sp) result.push({ saved: sp, layout: l });
    }
    return result;
  }, [layouts, savedPlants, windowTop, windowBottom]);

  const detailPlant = detailId ? savedPlants.find((s) => s.id === detailId) ?? null : null;
  const stats = useMemo(() => computeStats(), [computeStats, savedPlants.length, savedPlants]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div className="collection-header">
        <div>
          <div className="panel-title" style={{ marginBottom: 0 }}>
            📚 我的收藏
          </div>
          <div className="collection-count">
            {isLoading ? '加载中...' : `共 ${savedPlants.length} / 50 株`}
          </div>
        </div>
        <button
          className="stats-btn"
          onClick={() => setShowStats(true)}
          disabled={savedPlants.length === 0}
          style={{ opacity: savedPlants.length === 0 ? 0.5 : 1 }}
        >
          <span>📊</span>
          <span>统计</span>
        </button>
      </div>

      {savedPlants.length === 0 && !isLoading ? (
        <div className="panel">
          <div className="empty-collection">
            <div className="empty-collection-icon">🌵</div>
            <div className="empty-collection-text">还没有收藏任何植物</div>
            <div className="empty-collection-hint">回到「生成」页面，收藏你喜欢的植物吧</div>
          </div>
        </div>
      ) : (
        <div
          className="virtual-scroll-container"
          ref={scrollRef}
          onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
        >
          <div className="waterfall-grid" style={{ height: totalHeight, maxWidth: containerW - 16 }}>
            {visibleCards.map(({ saved, layout }) => (
              <CollectionCard
                key={saved.id}
                saved={saved}
                layout={layout}
                onClick={() => setDetailId(saved.id)}
                cardWidth={cardWidth}
              />
            ))}
          </div>
        </div>
      )}

      {detailPlant && (
        <DetailModal
          saved={detailPlant}
          onClose={() => setDetailId(null)}
        />
      )}

      {showStats && (
        <StatsModal stats={stats} onClose={() => setShowStats(false)} />
      )}
    </div>
  );
}

const svgCache = new Map<string, string>();

function getSvgForCard(saved: SavedPlant, idx: number): string {
  if (svgCache.has(saved.id)) return svgCache.get(saved.id)!;
  const svg = renderPlantSVG(saved.plant, { animate: false, compact: true, id: `c-${saved.id.slice(-6)}-${idx}` });
  if (svgCache.size > 80) {
    const it = svgCache.keys();
    svgCache.delete(it.next().value!);
  }
  svgCache.set(saved.id, svg);
  return svg;
}

function CollectionCard({
  saved,
  layout,
  onClick,
  cardWidth,
}: {
  saved: SavedPlant;
  layout: CardLayout;
  onClick: () => void;
  cardWidth: number;
}) {
  const svg = useMemo(() => getSvgForCard(saved, 0), [saved]);
  const dateStr = formatDate(saved.createdAt);
  const mood = MOODS[saved.plant.mood];

  const style: React.CSSProperties = {
    left: layout.left,
    top: layout.top,
    width: layout.width,
    height: layout.height,
  };

  return (
    <div className="collection-card" style={style} onClick={onClick}>
      <div className="card-meta">
        <span className="card-meta-emoji">{mood.emoji}</span>
        <span>{dateStr}</span>
      </div>
      <div className="card-plant-preview">
        <div dangerouslySetInnerHTML={{ __html: svg }} style={{ width: '100%', height: '100%' }} />
      </div>
      {saved.note ? (
        <div className="card-note">{saved.note}</div>
      ) : (
        <div className="card-note card-note-empty">点击添加备注...</div>
      )}
    </div>
  );
}

function DetailModal({ saved, onClose }: { saved: SavedPlant; onClose: () => void }) {
  const { updatePlantNote, deletePlant, showToast } = usePlantStore();
  const [editing, setEditing] = useState(false);
  const [draftNote, setDraftNote] = useState(saved.note);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setDraftNote(saved.note);
  }, [saved.id, saved.note]);

  const svg = useMemo(
    () => renderPlantSVG(saved.plant, { animate: false, id: `d-${saved.id.slice(-6)}` }),
    [saved]
  );

  const handleSave = async () => {
    const ok = await updatePlantNote(saved.id, draftNote);
    if (ok) {
      setEditing(false);
      showToast('备注已保存');
    }
  };

  const handleDelete = async () => {
    if (!deleting) {
      setDeleting(true);
      return;
    }
    await deletePlant(saved.id);
    onClose();
  };

  const plant = saved.plant;
  const mood = MOODS[plant.mood];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">🌿 植物详情</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="detail-plant-view">
            <div dangerouslySetInnerHTML={{ __html: svg }} style={{ width: '100%', height: '100%' }} />
          </div>

          <div className="detail-meta-row">
            <span className="detail-meta-tag">
              <span style={{ fontSize: 16 }}>{mood.emoji}</span>
              <span>{mood.label}</span>
            </span>
            <span className="detail-meta-tag">
              📅 {formatDateTime(saved.createdAt)}
            </span>
            <span className="detail-meta-tag">
              👟 {plant.input.steps} 步
            </span>
            <span className="detail-meta-tag">
              💧 {plant.input.water} 杯
            </span>
            <span className="detail-meta-tag">
              💼 {plant.input.workHours} h
            </span>
          </div>

          <div className="params-grid">
            <ParamItem label="主干高度" value={`${plant.metrics.trunkHeight} px`} />
            <ParamItem label="主干粗细" value={`${plant.metrics.trunkThickness} px`} />
            <ParamItem label="枝条数量" value={`${plant.metrics.branchCount} 根`} />
            <ParamItem label="叶片数量" value={`${plant.metrics.leafCount} 片`} />
            <ParamItem label="平均叶大小" value={`${plant.metrics.avgLeafSize} px`} />
            <ParamItem label="叶密度" value={`${Math.round(plant.metrics.leafDensity * 100)}%`} />
          </div>

          <div className="note-section">
            {!editing ? (
              <div className="note-display">
                <div className={saved.note ? 'note-text' : 'note-text note-text-empty'}>
                  {saved.note || '还没有备注，记录一下当时的心情吧～'}
                </div>
                <button className="edit-note-btn" onClick={() => setEditing(true)}>
                  {saved.note ? '编辑' : '+ 添加'}
                </button>
              </div>
            ) : (
              <>
                <textarea
                  className="note-textarea"
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value.slice(0, 80))}
                  placeholder="写下此刻的感受...（80字以内）"
                  autoFocus
                />
                <div className="note-counter">{draftNote.length} / 80</div>
              </>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn-danger"
            onClick={handleDelete}
          >
            {deleting ? '确定删除？' : '🗑 删除'}
          </button>
          {editing ? (
            <>
              <button className="btn-secondary" onClick={() => { setEditing(false); setDraftNote(saved.note); setDeleting(false); }}>
                取消
              </button>
              <button className="btn-primary" onClick={handleSave}>保存</button>
            </>
          ) : (
            <button className="btn-primary" onClick={onClose}>关闭</button>
          )}
        </div>
      </div>
    </div>
  );
}

function ParamItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="param-item">
      <div className="param-label">{label}</div>
      <div className="param-value">{value}</div>
    </div>
  );
}

function StatsModal({ stats, onClose }: { stats: PlantStats; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">📊 花园统计</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <StatsContent stats={stats} />
        </div>
        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}

function StatsContent({ stats }: { stats: PlantStats }) {
  const maxTrunk = 260;
  const maxBranches = 20;
  const maxLeafSize = 24;

  const trunkPct = Math.min(1, stats.avgTrunkHeight / maxTrunk);
  const branchPct = Math.min(1, stats.avgBranchCount / maxBranches);
  const leafPct = Math.min(1, stats.avgLeafSize / maxLeafSize);

  return (
    <div className="stats-grid">
      <StatRing
        label="主干"
        iconType="trunk"
        progress={trunkPct}
        valueText={stats.avgTrunkHeight.toString()}
        valueUnit="px 平均"
        color="#5c4033"
      />
      <StatRing
        label="枝条"
        iconType="branch"
        progress={branchPct}
        valueText={stats.avgBranchCount.toString()}
        valueUnit="根 平均"
        color="#8b6914"
      />
      <StatRing
        label="叶片"
        iconType="leaf"
        progress={leafPct}
        valueText={stats.avgLeafSize.toString()}
        valueUnit="px 平均"
        color="#40916c"
      />
      <MoodDistribution stats={stats} />
    </div>
  );
}

function StatRing({
  label,
  iconType,
  progress,
  valueText,
  valueUnit,
  color,
}: {
  label: string;
  iconType: 'trunk' | 'branch' | 'leaf' | 'heart';
  progress: number;
  valueText: string;
  valueUnit: string;
  color: string;
}) {
  return (
    <div className="stat-row">
      <div className="stat-icon-label">
        <div className="stat-icon-circle">
          <span style={{ fontSize: iconType === 'trunk' ? 22 : iconType === 'heart' ? 20 : 20 }}>
            {iconType === 'trunk' ? '🌳' : iconType === 'branch' ? '🌿' : iconType === 'leaf' ? '🍃' : '💚'}
          </span>
        </div>
        <div className="stat-label">{label}</div>
      </div>

      <div className="ring-container">
        <RingSVG progress={progress} color={color} />
        <div className="ring-center-text">
          <div className="ring-value">{valueText}</div>
          <div className="ring-sub">{valueUnit}</div>
        </div>
      </div>

      <RotatingIconSVG type={iconType} color={color} />
    </div>
  );
}

function RingSVG({ progress, color }: { progress: number; color: string }) {
  const cx = 28;
  const cy = 28;
  const r = 22;
  const C = 2 * Math.PI * r;
  const offset = C * (1 - progress);
  return (
    <svg className="ring-svg" viewBox="0 0 56 56" preserveAspectRatio="none">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e8e3d9" strokeWidth="5" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{
          transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)',
        }}
      />
    </svg>
  );
}

function RotatingIconSVG({ type, color }: { type: string; color: string }) {
  const paths: Record<string, JSX.Element> = {
    trunk: (
      <g>
        <path d="M12 2 L12 22 L8 22 L14 28 L20 22 L16 22 L16 2 Z" fill={color} />
        <path d="M6 24 Q14 22 22 24" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
    ),
    branch: (
      <g fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
        <path d="M4 24 Q12 16 24 6" />
        <path d="M10 20 Q14 14 18 16" />
        <path d="M16 14 Q18 10 22 12" />
      </g>
    ),
    leaf: (
      <g>
        <path d="M4 24 Q4 8 20 6 Q24 18 14 24 Q8 26 4 24 Z" fill={color} />
        <path d="M6 22 Q14 18 20 8" stroke="#fff" strokeWidth="1" fill="none" opacity="0.6" />
      </g>
    ),
    heart: (
      <path
        d="M14 6 C 8 6 4 10 4 14 C 4 20 12 24 14 26 C 16 24 24 20 24 14 C 24 10 20 6 14 6 Z"
        fill={color}
      />
    ),
  };

  return (
    <svg width="36" height="36" viewBox="0 0 28 28" className={`rotating-icon ${type === 'heart' ? 'fast' : ''}`}>
      {paths[type] || paths.leaf}
    </svg>
  );
}

function MoodDistribution({ stats }: { stats: PlantStats }) {
  const cx = 28;
  const cy = 28;
  const r = 22;
  const C = 2 * Math.PI * r;

  const total = Math.max(1, stats.totalCount);
  const moods: Mood[] = ['happy', 'calm', 'anxious', 'tired'];
  const moodColors: Record<Mood, string> = {
    happy: '#e9c46a',
    calm: '#40916c',
    anxious: '#9d8ec4',
    tired: '#7b9cb8',
  };

  let accumulated = 0;
  const segments = moods.map((m) => {
    const count = stats.moodDistribution[m] || 0;
    const pct = count / total;
    const dash = C * pct;
    const gap = C - dash;
    const startOffset = -accumulated * C;
    accumulated += pct;
    return { mood: m, count, pct, dash, gap, startOffset, color: moodColors[m] };
  });

  const dominant = moods.reduce<Mood>((best, m) =>
    (stats.moodDistribution[m] || 0) > (stats.moodDistribution[best] || 0) ? m : best,
    'calm'
  );

  return (
    <div className="stat-row">
      <div className="stat-icon-label">
        <div className="stat-icon-circle">
          <span style={{ fontSize: 20 }}>{MOODS[dominant].emoji}</span>
        </div>
        <div className="stat-label">心情</div>
      </div>

      <div className="ring-container">
        <svg className="ring-svg" viewBox="0 0 56 56" preserveAspectRatio="none">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e8e3d9" strokeWidth="5" />
          {segments.map((seg, i) =>
            seg.count > 0 ? (
              <circle
                key={seg.mood}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth="5"
                strokeLinecap="butt"
                strokeDasharray={`${seg.dash} ${seg.gap}`}
                strokeDashoffset={-seg.startOffset - C * 0.25}
                style={{
                  transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)',
                  transitionDelay: `${i * 80}ms`,
                }}
              />
            ) : null
          )}
        </svg>
        <div className="ring-center-text">
          <div className="ring-value">{stats.totalCount}</div>
          <div className="ring-sub">株 · 主{MOODS[dominant].label}</div>
        </div>
      </div>

      <RotatingIconSVG type="heart" color={moodColors[dominant]} />
    </div>
  );
}
