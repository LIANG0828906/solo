import { memo, useMemo, useState } from 'react';
import { Sparkles, RotateCcw, Wallet, Moon, Sun, Sparkles as CleanIcon, HandHeart, Users as UsersIcon, UserMinus, ArrowRight } from 'lucide-react';
import { matchApi, type CleanlinessType, type MatchUser, type ScheduleType, type SocialType } from '../services/api';

type TagPair = { key: string; left: { value: string; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; active: 'sea' }; right: { value: string; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; active: 'sand' } };

const TAG_PAIRS: TagPair[] = [
  {
    key: 'schedule',
    left: { value: 'early', label: '早睡星人', icon: Sun, active: 'sea' },
    right: { value: 'night', label: '夜猫子', icon: Moon, active: 'sand' },
  },
  {
    key: 'cleanliness',
    left: { value: 'tidy', label: '洁癖常态', icon: CleanIcon, active: 'sea' },
    right: { value: 'flexible', label: '随叫随到', icon: HandHeart, active: 'sand' },
  },
  {
    key: 'social',
    left: { value: 'outgoing', label: '社交达人', icon: UsersIcon, active: 'sea' },
    right: { value: 'solo', label: '独行侠', icon: UserMinus, active: 'sand' },
  },
];

function scoreColor(score: number): string {
  if (score >= 80) return '#27ae60';
  if (score >= 60) return '#f39c12';
  return '#e74c3c';
}

function scoreGradient(score: number): string {
  if (score >= 80) return 'url(#grad-good)';
  if (score >= 60) return 'url(#grad-mid)';
  return 'url(#grad-low)';
}

const RingProgress = memo(function RingProgress({ score, size = 96 }: { score: number; size?: number }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = scoreColor(score);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <defs>
        <linearGradient id="grad-good" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#27ae60" />
          <stop offset="100%" stopColor="#2ecc71" />
        </linearGradient>
        <linearGradient id="grad-mid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e67e22" />
          <stop offset="100%" stopColor="#f39c12" />
        </linearGradient>
        <linearGradient id="grad-low" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c0392b" />
          <stop offset="100%" stopColor="#e74c3c" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(74,144,164,0.12)" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={scoreGradient(score)}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)' }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontWeight="700" fontSize={size * 0.26} fill={color} fontFamily="'Noto Serif SC', serif">
        {score}%
      </text>
    </svg>
  );
});

const MatchCard = memo(function MatchCard({ user, index }: { user: MatchUser; index: number }) {
  const highMatch = user.matchScore >= 80;
  return (
    <div
      className={`glass-card p-4 sm:p-5 flex gap-4 items-center fade-in ${highMatch ? 'pulse-glow' : ''}`}
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      <div className="relative shrink-0">
        <img src={user.avatar} alt={user.nickname} className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/80 border-2 border-white shadow" />
        {highMatch && (
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-[#27ae60] to-[#2ecc71] text-white text-[10px] font-bold flex items-center justify-center shadow">
            A+
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-serif-sc font-bold text-lg truncate">{user.nickname}</h4>
          <div className="shrink-0 flex items-center gap-1 text-xs text-[#6b7c8a]">
            <Wallet size={13} />
            <span>¥{user.budget[0]}–{user.budget[1]}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {user.tags.map((t) => (
            <span key={t} className="text-[11px] px-2.5 py-1 rounded-full bg-white/70 text-[#356d7e] border border-white">
              {t}
            </span>
          ))}
        </div>
      </div>
      <RingProgress score={user.matchScore} size={82} />
    </div>
  );
});

export default function HomePage() {
  const [schedule, setSchedule] = useState<ScheduleType>('early');
  const [cleanliness, setCleanliness] = useState<CleanlinessType>('tidy');
  const [social, setSocial] = useState<SocialType>('outgoing');
  const [budgetMin, setBudgetMin] = useState(1500);
  const [budgetMax, setBudgetMax] = useState(3000);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatchUser[]>([]);

  const selections = useMemo(
    () => ({ schedule, cleanliness, social }),
    [schedule, cleanliness, social]
  );

  const handleMatch = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await matchApi.find({
        schedule,
        cleanliness,
        social,
        budgetMin: Math.min(budgetMin, budgetMax),
        budgetMax: Math.max(budgetMin, budgetMax),
      });
      setResults(data);
      if (!flipped) setTimeout(() => setFlipped(true), 120);
    } finally {
      setTimeout(() => setLoading(false), 200);
    }
  };

  const handleBack = () => setFlipped(false);

  const renderTagPair = (pair: TagPair) => {
    const currentValue = (selections as Record<string, string>)[pair.key];
    const setters: Record<string, (v: never) => void> = {
      schedule: setSchedule as never,
      cleanliness: setCleanliness as never,
      social: setSocial as never,
    };
    const setter = setters[pair.key];
    return (
      <div key={pair.key}>
        <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
          <button
            type="button"
            onClick={() => setter(pair.left.value as never)}
            className={`tag-toggle inline-flex items-center gap-2 ${currentValue === pair.left.value ? 'active-sea' : ''}`}
          >
            <pair.left.icon size={16} strokeWidth={2} />
            {pair.left.label}
          </button>
          <button
            type="button"
            onClick={() => setter(pair.right.value as never)}
            className={`tag-toggle inline-flex items-center gap-2 ${currentValue === pair.right.value ? 'active-sand' : ''}`}
          >
            <pair.right.icon size={16} strokeWidth={2} />
            {pair.right.label}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8 fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 border border-white text-xs text-[#356d7e] mb-4 backdrop-blur">
          <Sparkles size={14} className="text-[#cfad7b]" />
          基于生活习惯与预算的智能匹配
        </div>
        <h1 className="font-serif-sc text-4xl sm:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-[#356d7e] via-[#4a90a4] to-[#8b6b3a] bg-clip-text text-transparent">遇见合拍的室友</span>
        </h1>
        <p className="text-[#6b7c8a] max-w-xl mx-auto leading-relaxed">
          选择属于你的生活标签，设置可承受的预算区间，让我们帮你找到那个「相处起来像呼吸一样自然」的合租伙伴。
        </p>
      </div>

      <div className="card-flip-container">
        <div className={`card-flip-inner ${flipped ? 'flipped' : ''}`}>
          <div className="card-face front glass-card p-6 sm:p-10 overflow-hidden">
            <div className="space-y-7">
              {TAG_PAIRS.map((pair, idx) => (
                <div key={pair.key} className="fade-in" style={{ animationDelay: `${idx * 0.08}s` }}>
                  <p className="text-xs font-semibold text-[#6b7c8a] tracking-wider text-center mb-3 uppercase">
                    {idx === 0 ? '· 生活作息 ·' : idx === 1 ? '· 清洁偏好 ·' : '· 社交风格 ·'}
                  </p>
                  {renderTagPair(pair)}
                </div>
              ))}

              <div className="fade-in" style={{ animationDelay: '0.3s' }}>
                <p className="text-xs font-semibold text-[#6b7c8a] tracking-wider text-center mb-4 uppercase">· 预算区间（元 / 月）·</p>
                <div className="grid sm:grid-cols-2 gap-5 px-2 sm:px-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[#6b7c8a]">最低预算</span>
                      <span className="font-semibold text-[#356d7e]">¥ {budgetMin.toLocaleString()}</span>
                    </div>
                    <input type="range" min={500} max={5000} step={100} value={budgetMin} onChange={(e) => setBudgetMin(Math.min(+e.target.value, budgetMax - 100))} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[#6b7c8a]">最高预算</span>
                      <span className="font-semibold text-[#8b6b3a]">¥ {budgetMax.toLocaleString()}</span>
                    </div>
                    <input type="range" min={1000} max={8000} step={100} value={budgetMax} onChange={(e) => setBudgetMax(Math.max(+e.target.value, budgetMin + 100))} />
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-2 fade-in" style={{ animationDelay: '0.38s' }}>
                <button className="btn-primary inline-flex items-center gap-2" onClick={handleMatch} disabled={loading}>
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      匹配中...
                    </span>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      开始匹配室友
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="card-face back glass-card p-5 sm:p-8 overflow-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-serif-sc text-2xl font-bold text-[#356d7e]">匹配结果</h3>
                <p className="text-sm text-[#6b7c8a] mt-1">
                  共找到 <span className="font-bold text-[#cfad7b]">{results.length}</span> 位潜在室友，按匹配度排序
                </p>
              </div>
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/70 hover:bg-white border border-white/80 text-sm font-medium text-[#356d7e] transition-colors"
              >
                <RotateCcw size={15} />
                重新匹配
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {results.map((u, i) => (
                <MatchCard key={u.id} user={u} index={i} />
              ))}
            </div>

            {results.length > 0 && (
              <div className="mt-6 text-center">
                <p className="text-xs text-[#8b9bab] mb-3">对匹配结果满意？前往合租模块开启共同生活</p>
                <a
                  href="/my-roommate"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#4a90a4] hover:text-[#356d7e] underline underline-offset-4 decoration-dotted decoration-[#cfad7b]"
                >
                  进入「我的合租」
                  <ArrowRight size={14} />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
