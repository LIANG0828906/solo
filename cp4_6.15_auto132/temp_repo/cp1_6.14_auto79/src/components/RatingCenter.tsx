import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Star, Clock, Sparkles, Heart, Volume2, HandCoins, ChevronDown, ChevronUp, UserRound, Quote, BarChart3 } from 'lucide-react';
import { ratingsApi, type Rating, type RatingDimensions, type Member } from '../services/api';

type DimKey = keyof RatingDimensions;

const DIMENSIONS: { key: DimKey; label: string; icon: React.ComponentType<{ size?: number }>; desc: string }[] = [
  { key: 'punctuality', label: '准时', icon: Clock, desc: '按时交租、守约情况' },
  { key: 'cleanliness', label: '整洁', icon: Sparkles, desc: '个人与公共区域卫生' },
  { key: 'friendliness', label: '友善', icon: Heart, desc: '相处融洽度、沟通态度' },
  { key: 'quietness', label: '安静', icon: Volume2, desc: '噪音控制、生活作息影响' },
  { key: 'sharing', label: '分担', icon: HandCoins, desc: '公共事务、采买值日配合' },
];

function barColor(score: number): string {
  if (score >= 7) return 'linear-gradient(90deg, #cfad7b, #e8c99b)';
  if (score >= 4) return 'linear-gradient(90deg, #4a90a4, #6eb4c7)';
  return 'linear-gradient(90deg, #a9b8c3, #c5d0d8)';
}

function barTextColor(score: number): string {
  if (score >= 7) return '#8b6b3a';
  if (score >= 4) return '#356d7e';
  return '#6b7c8a';
}

// === 单维度条形图 ===
const DimensionBar = memo(function DimensionBar({
  dim,
  avg,
  count,
  expanded,
  onToggle,
  animKey,
}: {
  dim: (typeof DIMENSIONS)[number];
  avg: number;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  animKey: number;
}) {
  const percent = Math.min(100, (avg / 10) * 100);
  const color = barColor(avg);
  const txtColor = barTextColor(avg);
  return (
    <div className="glass-card p-5 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left flex items-center gap-4 group"
        aria-expanded={expanded}
      >
        <div
          className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${color.includes('cfad') ? '#e8c99b40' : color.includes('4a90') ? '#4a90a420' : '#a9b8c330'})` }}
        >
          <dim.icon size={20} style={{ color: txtColor }} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <div>
              <span className="font-serif-sc text-lg font-bold">{dim.label}</span>
              <span className="ml-2 text-xs text-[#8b9bab]">· {dim.desc}</span>
            </div>
            <div className="shrink-0 text-right">
              <span className="font-serif-sc text-2xl font-bold tabular-nums" style={{ color: txtColor }}>
                {avg.toFixed(1)}
              </span>
              <span className="text-sm text-[#8b9bab] ml-0.5">/10</span>
              <span className="text-[11px] text-[#8b9bab] ml-2">({count}条)</span>
            </div>
          </div>
          <div className="h-3 rounded-full bg-white/60 overflow-hidden relative">
            <div
              key={animKey}
              className="h-full rounded-full bar-fill-anim relative"
              style={{
                width: `${percent}%`,
                background: color,
                animationDuration: '0.9s',
                animationDelay: '0.05s',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            </div>
          </div>
        </div>
        <div
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-white/70 transition-colors text-[#6b7c8a]"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>
    </div>
  );
});

// === 单条评价卡片 ===
const RatingCard = memo(function RatingCard({ r, highlightDim }: { r: Rating; highlightDim?: DimKey | null }) {
  return (
    <div className="fade-in rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="flex items-start gap-3 mb-3">
        <img
          src={r.fromUser?.avatar}
          alt=""
          className="w-10 h-10 rounded-xl border-2 border-white shadow-sm bg-white"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-sm">{r.fromUser?.nickname || '匿名'}</p>
              <p className="text-[11px] text-[#8b9bab] mt-0.5 flex items-center gap-1">
                评价给 <span className="font-medium text-[#4a90a4]">{r.toUser?.nickname}</span>
                <span>·</span>
                <span>{new Date(r.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 mb-3">
        {DIMENSIONS.map((d) => {
          const s = r.dimensions[d.key];
          const isHi = highlightDim === d.key;
          return (
            <div
              key={d.key}
              className={`text-center p-2 rounded-lg transition-all ${
                isHi ? 'bg-gradient-to-br from-[#4a90a4]/15 to-[#e8c99b]/25 ring-2 ring-[#4a90a4]/30' : 'bg-white/60'
              }`}
              title={`${d.label}：${s}分`}
            >
              <d.icon size={13} className="mx-auto mb-1 text-[#6b7c8a]" strokeWidth={2} />
              <p
                className="font-serif-sc font-bold text-sm tabular-nums"
                style={{ color: barTextColor(s) }}
              >
                {s}
              </p>
              <p className="text-[9px] text-[#8b9bab] mt-0.5">{d.label}</p>
            </div>
          );
        })}
      </div>

      {r.comment && (
        <div className="flex gap-2 text-sm text-[#4a5568] leading-relaxed bg-gradient-to-r from-[#4a90a4]/5 via-transparent to-[#e8c99b]/10 p-3 rounded-xl border-l-4 border-[#4a90a4]/40">
          <Quote size={14} className="shrink-0 mt-0.5 text-[#cfad7b]" />
          <p>{r.comment}</p>
        </div>
      )}
    </div>
  );
});

// === 室友横向评分概览 ===
function RoommateOverview({ ratings }: { ratings: Rating[] }) {
  const byUser = useMemo(() => {
    const map: Record<string, { member: Member; scores: number[]; dims: RatingDimensions; count: number }> = {};
    ratings.forEach((r) => {
      if (!r.toUser) return;
      const key = r.toUserId;
      if (!map[key]) {
        map[key] = {
          member: r.toUser,
          scores: [],
          dims: { punctuality: 0, cleanliness: 0, friendliness: 0, quietness: 0, sharing: 0 },
          count: 0,
        };
      }
      const e = map[key];
      e.count++;
      (Object.keys(r.dimensions) as DimKey[]).forEach((k) => (e.dims[k] += r.dimensions[k]));
      e.scores.push(
        (r.dimensions.punctuality + r.dimensions.cleanliness + r.dimensions.friendliness + r.dimensions.quietness + r.dimensions.sharing) / 5
      );
    });
    Object.values(map).forEach((e) => {
      (Object.keys(e.dims) as DimKey[]).forEach((k) => (e.dims[k] = +(e.dims[k] / e.count).toFixed(2)));
    });
    return map;
  }, [ratings]);

  if (Object.keys(byUser).length === 0) return null;

  return (
    <div className="glass-card p-6">
      <h3 className="font-serif-sc text-xl font-bold text-[#356d7e] flex items-center gap-2 mb-5">
        <UserRound size={20} />
        室友综合印象
      </h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.values(byUser).map(({ member, dims, scores, count }, idx) => {
          const avg = scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
          const color = avg >= 7 ? '#27ae60' : avg >= 5 ? '#f39c12' : '#a9b8c3';
          return (
            <div
              key={member.id}
              className="fade-in rounded-2xl p-4 bg-gradient-to-br from-white/80 via-white/70 to-[#e8c99b]/20 border border-white/80 hover:shadow-lg hover:-translate-y-1 transition-all"
              style={{ animationDelay: `${idx * 0.06}s` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <img src={member.avatar} className="w-12 h-12 rounded-2xl border-2 border-white bg-white shadow-sm" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="font-serif-sc text-lg font-bold truncate">{member.nickname}</p>
                  <p className="text-[11px] text-[#8b9bab]">{count} 条评价 · 综合</p>
                </div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-serif-sc text-xl font-bold text-white shadow-md"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
                >
                  {avg.toFixed(1)}
                </div>
              </div>
              <div className="space-y-1.5">
                {DIMENSIONS.map((d) => (
                  <div key={d.key} className="flex items-center gap-2">
                    <d.icon size={12} className="text-[#6b7c8a] shrink-0" />
                    <span className="text-xs w-8 text-[#6b7c8a]">{d.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/70 overflow-hidden">
                      <div
                        className="h-full rounded-full bar-fill-anim"
                        style={{
                          width: `${(dims[d.key] / 10) * 100}%`,
                          background: barColor(dims[d.key]),
                          animationDelay: `${idx * 0.1 + 0.05}s`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold tabular-nums w-7 text-right" style={{ color: barTextColor(dims[d.key]) }}>
                      {dims[d.key].toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// === 主组件 ===
export default function RatingCenter() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [expandedDim, setExpandedDim] = useState<DimKey | null>(null);
  const [animTick, setAnimTick] = useState(0);
  const expandRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [expandH, setExpandH] = useState(0);

  useEffect(() => {
    ratingsApi.getAll().then((rs) => {
      setRatings(rs);
      setAnimTick((t) => t + 1);
    });
  }, []);

  // 计算每个维度平均分
  const dimStats = useMemo(() => {
    const result: Record<DimKey, { total: number; count: number; avg: number; related: Rating[] }> = {
      punctuality: { total: 0, count: 0, avg: 0, related: [] },
      cleanliness: { total: 0, count: 0, avg: 0, related: [] },
      friendliness: { total: 0, count: 0, avg: 0, related: [] },
      quietness: { total: 0, count: 0, avg: 0, related: [] },
      sharing: { total: 0, count: 0, avg: 0, related: [] },
    };
    ratings.forEach((r) => {
      (Object.keys(r.dimensions) as DimKey[]).forEach((k) => {
        result[k].total += r.dimensions[k];
        result[k].count++;
      });
    });
    (Object.keys(result) as DimKey[]).forEach((k) => {
      result[k].avg = result[k].count ? result[k].total / result[k].count : 0;
      result[k].related = [...ratings]
        .filter((r) => r.dimensions[k] >= 7 || (expandedDim === k && r.comment))
        .sort((a, b) => b.dimensions[k] - a.dimensions[k]);
    });
    return result;
  }, [ratings, expandedDim]);

  const toggleDim = (k: DimKey) => {
    setExpandedDim((cur) => (cur === k ? null : k));
    setTimeout(() => {
      if (contentRef.current && expandedRef.current) {
        setExpandH(expandedDim !== k ? contentRef.current.scrollHeight + 32 : 0);
      }
    }, 10);
  };

  useEffect(() => {
    if (contentRef.current && expandedRef.current) {
      setExpandH(expandedDim ? contentRef.current.scrollHeight + 32 : 0);
    }
  }, [ratings, expandedDim]);

  const overallAvg = useMemo(() => {
    if (ratings.length === 0) return 0;
    let sum = 0;
    let n = 0;
    ratings.forEach((r) => {
      (Object.keys(r.dimensions) as DimKey[]).forEach((k) => {
        sum += r.dimensions[k];
        n++;
      });
    });
    return n ? sum / n : 0;
  }, [ratings]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="fade-in text-center mb-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 border border-white text-xs text-[#356d7e] mb-4 backdrop-blur">
          <Star size={14} className="text-[#cfad7b]" fill="#cfad7b" />
          室友互评记录 & 五维雷达
        </div>
        <h1 className="font-serif-sc text-4xl sm:text-5xl font-bold mb-3">
          <span className="bg-gradient-to-r from-[#356d7e] via-[#4a90a4] to-[#8b6b3a] bg-clip-text text-transparent">
            评分中心
          </span>
        </h1>
        <p className="text-[#6b7c8a] max-w-xl mx-auto">
          每一次真诚的评价，都能让合租生活更加默契。点击任意维度查看具体的文字反馈。
        </p>
      </div>

      {/* 综合概览 */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="glass-card p-5 md:col-span-1 flex flex-col items-center justify-center text-center bg-gradient-to-br from-[#4a90a4]/15 via-white/70 to-[#e8c99b]/20">
          <BarChart3 size={24} className="text-[#4a90a4] mb-2" />
          <p className="text-xs text-[#6b7c8a] uppercase tracking-wider font-semibold">整体均分</p>
          <p className="font-serif-sc text-5xl font-bold mt-1 bg-gradient-to-br from-[#356d7e] to-[#8b6b3a] bg-clip-text text-transparent">
            {overallAvg.toFixed(1)}
          </p>
          <p className="text-xs text-[#8b9bab] mt-2">满分 10 分</p>
        </div>
        <div className="glass-card p-5 md:col-span-3 space-y-1">
          <p className="text-xs text-[#6b7c8a] uppercase tracking-wider font-semibold mb-3">五维度分布</p>
          <div className="grid grid-cols-5 gap-3">
            {DIMENSIONS.map((d) => {
              const s = dimStats[d.key].avg;
              return (
                <div key={d.key} className="text-center">
                  <div
                    className="w-full aspect-square rounded-2xl flex items-center justify-center mb-2 border-2 border-white shadow-sm"
                    style={{ background: barColor(s) }}
                  >
                    <div className="text-white">
                      <d.icon size={18} className="mx-auto mb-0.5" strokeWidth={2.2} />
                      <p className="font-serif-sc font-bold text-lg leading-none">{s.toFixed(0)}</p>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-[#4a5568]">{d.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 室友概览 */}
      <RoommateOverview ratings={ratings} />

      {/* 可展开的维度详情 */}
      <div className="space-y-3">
        {DIMENSIONS.map((d) => (
          <div key={d.key}>
            <DimensionBar
              dim={d}
              avg={dimStats[d.key].avg}
              count={dimStats[d.key].count}
              expanded={expandedDim === d.key}
              onToggle={() => toggleDim(d.key)}
              animKey={animTick}
            />

            <div
              ref={expandRef}
              className="height-expand"
              style={{
                maxHeight: expandedDim === d.key ? `${expandH}px` : '0px',
                opacity: expandedDim === d.key ? 1 : 0,
                paddingTop: expandedDim === d.key ? '12px' : '0',
                paddingBottom: expandedDim === d.key ? '4px' : '0',
              }}
            >
              <div ref={contentRef}>
                <div className="grid sm:grid-cols-2 gap-3">
                  {(dimStats[d.key].related.length ? dimStats[d.key].related : ratings).map((r) => (
                    <RatingCard key={r.id} r={r} highlightDim={expandedDim} />
                  ))}
                </div>
                {ratings.length === 0 && (
                  <p className="text-center py-8 text-[#8b9bab] text-sm">还没有任何评价记录～</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 全部评价瀑布流 */}
      <div className="glass-card p-6 mt-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-serif-sc text-xl font-bold text-[#356d7e] flex items-center gap-2">
            <Quote size={20} />
            全部评价记录
            <span className="ml-2 text-sm font-normal text-[#8b9bab]">({ratings.length})</span>
          </h3>
          <button
            onClick={() => setAnimTick((t) => t + 1)}
            className="text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/70 hover:bg-white border border-white/80 text-[#4a90a4] font-medium transition-colors"
          >
            <Star size={12} />
            重播进度动画
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {ratings.map((r, i) => (
            <div key={r.id} style={{ animationDelay: `${i * 0.05}s` }}>
              <RatingCard r={r} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
