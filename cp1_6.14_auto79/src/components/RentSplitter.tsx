import { useEffect, useMemo, useRef, useState } from 'react';
import { Calculator, RefreshCw, Wallet, ChevronRight } from 'lucide-react';
import { transactionsApi, type HouseInfo, type Member, type RatioItem, type SplitResult } from '../services/api';

function RollingNumber({ value, duration = 600, prefix = '', suffix = '' }: { value: number; duration?: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const startRef = useRef(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (value === prevRef.current) return;
    const from = prevRef.current;
    const to = value;
    startRef.current = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      const v = Math.round(from + (to - from) * ease);
      setDisplay(v);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else prevRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const digits = (prefix + display.toLocaleString() + suffix).split('');
  return (
    <span className="num-roll" style={{ height: '1.1em' }} aria-label={`${prefix}${value}${suffix}`}>
      {digits.map((d, i) => (
        <span
          key={`${i}-${d}`}
          className="num-roll-digit"
          style={{
            display: 'inline-block',
            minWidth: d === '.' || d === ',' || d === '¥' ? 'auto' : '0.6em',
          }}
        >
          {d}
        </span>
      ))}
    </span>
  );
}

export default function RentSplitter({ house }: { house: HouseInfo }) {
  const [totalRent, setTotalRent] = useState(house.totalRent);
  const [ratios, setRatios] = useState<RatioItem[]>(() => {
    const per = Math.floor(100 / house.members.length);
    const remainder = 100 - per * house.members.length;
    return house.members.map((m, i) => ({ userId: m.id, ratio: per + (i === 0 ? remainder : 0) }));
  });
  const [results, setResults] = useState<SplitResult[]>([]);
  const [calculating, setCalculating] = useState(false);

  const totalRatio = ratios.reduce((s, r) => s + r.ratio, 0);

  const updateRatio = (userId: string, ratio: number) => {
    setRatios((rs) => rs.map((r) => (r.userId === userId ? { ...r, ratio: Math.max(0, Math.min(100, ratio)) } : r)));
  };

  const autoSplit = () => {
    setRatios(() => {
      const per = Math.floor(100 / house.members.length);
      const remainder = 100 - per * house.members.length;
      return house.members.map((m, i) => ({
        userId: m.id,
        ratio: per + (i === house.members.length - 1 ? remainder : 0),
      }));
    });
  };

  const doSplit = async () => {
    setCalculating(true);
    try {
      const res = await transactionsApi.splitRent(totalRent, ratios);
      setResults(res);
    } finally {
      setTimeout(() => setCalculating(false), 150);
    }
  };

  useEffect(() => {
    if (ratios.length > 0) {
      const res = ratios.map((r) => ({
        userId: r.userId,
        amount: Math.round((totalRent * r.ratio) / 100),
      }));
      setResults(res);
    }
  }, [totalRent, ratios]);

  const memberById = useMemo(() => {
    const m: Record<string, Member> = {};
    house.members.forEach((mem) => (m[mem.id] = mem));
    return m;
  }, [house.members]);

  return (
    <div className="space-y-6 fade-in">
      <div className="grid md:grid-cols-2 gap-5">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-serif-sc text-lg font-bold text-[#356d7e] flex items-center gap-2">
              <Calculator size={18} />
              分摊参数
            </h4>
            <button
              onClick={autoSplit}
              className="text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/70 hover:bg-white border border-white/80 text-[#4a90a4] font-medium transition-colors"
            >
              <RefreshCw size={12} />
              平均分配
            </button>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-[#6b7c8a] uppercase tracking-wider mb-2">
              月租总额（元）
            </label>
            <div className="flex items-center gap-2 rounded-xl border-2 border-white bg-white/70 px-4 py-3 focus-within:border-[#4a90a4] transition-colors">
              <span className="text-[#6b7c8a] font-medium">¥</span>
              <input
                type="number"
                className="flex-1 bg-transparent outline-none text-lg font-semibold text-[#2c3e50]"
                value={totalRent}
                onChange={(e) => setTotalRent(Math.max(0, +e.target.value || 0))}
              />
            </div>
          </div>

          <div className="space-y-3">
            {ratios.map((r) => {
              const m = memberById[r.userId];
              return (
                <div key={r.userId}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <img
                        src={m?.avatar}
                        alt=""
                        className="w-7 h-7 rounded-lg border-2 border-white bg-white/80"
                      />
                      <span className="font-medium text-sm">{m?.nickname}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={r.ratio}
                        onChange={(e) => updateRatio(r.userId, +e.target.value)}
                        className="w-24 sm:w-32"
                      />
                      <span
                        className={`text-sm font-bold tabular-nums min-w-[3ch] text-right ${
                          r.ratio > 100 / house.members.length ? 'text-[#cfad7b]' : 'text-[#4a90a4]'
                        }`}
                      >
                        {r.ratio}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/60 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${r.ratio}%`,
                        background: 'linear-gradient(90deg, #4a90a4, #e8c99b)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className={`mt-4 text-xs flex justify-between items-center py-2 px-3 rounded-lg ${
              totalRatio === 100 ? 'bg-[#27ae60]/10 text-[#27ae60]' : 'bg-[#e74c3c]/10 text-[#e74c3c]'
            }`}
          >
            <span>占比合计</span>
            <span className="font-bold tabular-nums">
              {totalRatio}% {totalRatio === 100 ? '✓ 已分配完毕' : `还差 ${100 - totalRatio}%`}
            </span>
          </div>

          <button
            className="btn-primary w-full mt-4 inline-flex items-center justify-center gap-2"
            onClick={doSplit}
            disabled={calculating}
          >
            {calculating ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Calculator size={16} />
            )}
            一键分摊（自动实时计算）
          </button>
        </div>

        <div className="glass-card p-5">
          <h4 className="font-serif-sc text-lg font-bold text-[#356d7e] flex items-center gap-2 mb-4">
            <Wallet size={18} />
            每人应付
          </h4>
          <div className="space-y-3">
            {results.map((r, i) => {
              const m = memberById[r.userId];
              return (
                <div
                  key={r.userId}
                  className="fade-in flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-white/80 to-white/50 border border-white shadow-sm"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <img
                    src={m?.avatar}
                    alt=""
                    className="w-11 h-11 rounded-xl border-2 border-white bg-white shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#2c3e50]">{m?.nickname}</p>
                    <p className="text-xs text-[#6b7c8a] mt-0.5">
                      占比 {ratios.find((rr) => rr.userId === r.userId)?.ratio ?? 0}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-[#6b7c8a] mb-0.5">应付</p>
                    <p className="font-serif-sc text-2xl font-bold">
                      <span className="text-[#cfad7b]">¥</span>
                      <RollingNumber value={r.amount} />
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-white/70 flex items-center justify-between">
            <span className="text-sm text-[#6b7c8a]">合计校验</span>
            <span className="font-bold text-[#356d7e] font-serif-sc text-lg">
              ¥ {results.reduce((s, r) => s + r.amount, 0).toLocaleString()}
              <ChevronRight size={16} className="inline ml-1 opacity-60" /> ¥{totalRent.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
