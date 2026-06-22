import { Suspense } from 'react';
import Link from 'next/link';
import { Coffee, Clock, TrendingUp, Plus, Sparkles } from 'lucide-react';
import { prisma, DEFAULT_USER_ID } from '@/lib/prisma';
import { analyzeFlavorProfile, hexToRgb, mixColors } from '@/lib/flavorAnalyzer';
import { Calendar } from '@/components/Calendar';
import { RecordCard } from '@/components/RecordCard';
import { RadarChart } from '@/components/RadarChart';
import { FlavorTagPill } from '@/components/FlavorTagPill';
import type { RoastLevel } from '@prisma/client';

export const revalidate = 30;
export const dynamic = 'force-dynamic';

interface LoadingPulseProps {
  label?: string;
}

function LoadingPulse({ label = '加载中...' }: LoadingPulseProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="loading-ripple mb-4" />
      <p className="text-sm text-white/50 animate-pulse">{label}</p>
    </div>
  );
}

function RecordSkeleton() {
  return (
    <div className="glass-card p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-12 rounded-full bg-white/10" />
          <div className="h-4 w-16 rounded bg-white/10" />
        </div>
        <div className="h-8 w-8 rounded-full bg-white/10" />
      </div>
      <div className="h-6 w-3/4 rounded bg-white/10 mb-3" />
      <div className="h-4 w-1/2 rounded bg-white/10 mb-4" />
      <div className="flex gap-2">
        <div className="h-6 w-14 rounded-full bg-white/10" />
        <div className="h-6 w-14 rounded-full bg-white/10" />
      </div>
    </div>
  );
}

async function getRecentRecords() {
  const records = await prisma.record.findMany({
    where: { userId: DEFAULT_USER_ID },
    include: { flavorTags: true },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });
  return records;
}

async function getAllRecords() {
  const records = await prisma.record.findMany({
    where: { userId: DEFAULT_USER_ID },
    include: { flavorTags: true },
    orderBy: { createdAt: 'desc' },
  });
  return records;
}

const ROAST_MAP: Record<RoastLevel, string> = {
  LIGHT: '浅焙',
  MEDIUM: '中焙',
  DARK: '深焙',
  EXTRA_DARK: '极深焙',
};

export default async function HomePage() {
  const recentPromise = getRecentRecords();
  const allPromise = getAllRecords();

  return (
    <div className="space-y-10">
      <section className="glass-card p-8 overflow-hidden relative">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse at 20% 0%, rgba(255,215,0,0.25) 0%, transparent 50%), radial-gradient(ellipse at 100% 100%, rgba(255,99,71,0.2) 0%, transparent 50%)',
          }}
        />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 mb-4">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-medium text-yellow-300">
                  欢迎回来
                </span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">
                探索你的
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-400">
                  {' '}味觉世界{' '}
                </span>
              </h1>
              <p className="text-white/60 max-w-lg leading-relaxed">
                记录每一杯咖啡的风味记忆，让数据描绘你独一无二的味觉地图
              </p>
            </div>
            <Link
              href="#create"
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('open-create-modal'));
              }}
              className="coffee-btn-primary inline-flex items-center gap-2 self-start md:self-center"
            >
              <Plus className="w-5 h-5" />
              记录新品尝
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Suspense fallback={<div className="h-24 rounded-xl bg-white/5 animate-pulse" />}>
              <StatCards />
            </Suspense>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400/20 to-red-500/20 flex items-center justify-center border border-orange-400/20">
                  <Clock className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">
                    最近品尝
                  </h2>
                  <p className="text-xs text-white/50">点击卡片查看详情</p>
                </div>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-white/5 text-white/50">
                最近 6 条
              </span>
            </div>

            <Suspense
              fallback={
                <div className="grid sm:grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <RecordSkeleton key={i} />
                  ))}
                </div>
              }
            >
              <RecentRecordsSection promise={recentPromise} />
            </Suspense>
          </section>

          <section>
            <Suspense fallback={<LoadingPulse label="加载日历中..." />}>
              <CalendarSection promise={allPromise} />
            </Suspense>
          </section>
        </div>

        <div className="space-y-8">
          <section id="radar" className="scroll-mt-20">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400/20 to-purple-500/20 flex items-center justify-center border border-yellow-400/20">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-white">
                  风味雷达
                </h2>
                <p className="text-xs text-white/50">你的味觉画像</p>
              </div>
            </div>

            <div className="glass-card p-6">
              <Suspense
                fallback={
                  <div className="h-[400px] flex items-center justify-center">
                    <LoadingPulse label="分析风味数据..." />
                  </div>
                }
              >
                <FlavorRadarSection promise={allPromise} />
              </Suspense>
            </div>
          </section>

          <section id="profile" className="scroll-mt-20">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center border border-amber-400/20">
                <Coffee className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-white">
                  烘焙偏好
                </h2>
                <p className="text-xs text-white/50">你的口味倾向</p>
              </div>
            </div>

            <Suspense fallback={<div className="h-[200px] glass-card animate-pulse" />}>
              <RoastPreferenceSection promise={allPromise} />
            </Suspense>
          </section>
        </div>
      </div>
    </div>
  );
}

async function StatCards() {
  const records = await prisma.record.findMany({
    where: { userId: DEFAULT_USER_ID },
    include: { flavorTags: true },
  });

  const totalCups = records.length;
  const avgRating = totalCups > 0
    ? (records.reduce((s, r) => s + r.rating, 0) / totalCups).toFixed(1)
    : '0.0';
  const uniqueFlavors = new Set(
    records.flatMap((r) => r.flavorTags.map((t) => t.name))
  ).size;
  const uniqueCoffees = new Set(records.map((r) => r.coffeeName)).size;

  const stats = [
    { label: '总品尝次数', value: totalCups, unit: '杯', color: 'from-yellow-400 to-orange-400', icon: '☕' },
    { label: '平均评分', value: avgRating, unit: '分', color: 'from-orange-400 to-red-400', icon: '⭐' },
    { label: '探索风味', value: uniqueFlavors, unit: '种', color: 'from-pink-400 to-purple-500', icon: '🌸' },
    { label: '品尝种类', value: uniqueCoffees, unit: '款', color: 'from-cyan-400 to-blue-500', icon: '🫘' },
  ];

  return (
    <>
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="relative overflow-hidden p-4 rounded-xl bg-white/5 border border-white/10 animate-slide-up"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div
            className={`absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br ${s.color} opacity-20 blur-xl`}
          />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white/50 uppercase tracking-wider font-medium">
                {s.label}
              </span>
              <span className="text-base">{s.icon}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className={`font-display text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br ${s.color}`}
              >
                {s.value}
              </span>
              <span className="text-xs text-white/40">{s.unit}</span>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

async function RecentRecordsSection({
  promise,
}: {
  promise: ReturnType<typeof getRecentRecords>;
}) {
  const records = await promise;

  if (records.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-6xl mb-4">☕</div>
        <h3 className="font-display text-xl font-semibold text-white mb-2">
          还没有记录
        </h3>
        <p className="text-white/50 mb-6">
          开始记录你的第一杯咖啡吧！
        </p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {records.map((record, idx) => (
        <RecordCard
          key={record.id}
          id={record.id}
          coffeeName={record.coffeeName}
          roastLevel={record.roastLevel}
          rating={record.rating}
          createdAt={record.createdAt}
          flavorTags={record.flavorTags}
          index={idx}
        />
      ))}
    </div>
  );
}

async function CalendarSection({
  promise,
}: {
  promise: ReturnType<typeof getAllRecords>;
}) {
  const records = await promise;
  return <Calendar records={records} />;
}

async function FlavorRadarSection({
  promise,
}: {
  promise: ReturnType<typeof getAllRecords>;
}) {
  const records = await promise;
  const radarData = analyzeFlavorProfile(records);

  if (records.length === 0) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center text-center">
        <div className="text-5xl mb-4">📊</div>
        <p className="text-white/50 text-sm">记录咖啡后生成风味雷达图</p>
      </div>
    );
  }

  return (
    <div>
      <RadarChart data={radarData} records={records} size="lg" />
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-white/50 mb-3">前 5 位风味强度</p>
        <div className="space-y-2.5">
          {radarData.filter((d) => d.intensity > 0).slice(0, 5).map((d, i) => (
            <div key={d.flavor} className="flex items-center gap-3">
              <span className="text-xs text-white/60 w-12 shrink-0">
                #{i + 1}
              </span>
              <FlavorTagPill
                name={d.flavor}
                color={d.color || '#FFD700'}
                size="sm"
              />
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${d.intensity}%`,
                    background: `linear-gradient(90deg, ${hexToRgb(d.color || '#FFD700', 0.7)}, ${d.color || '#FFD700'})`,
                  }}
                />
              </div>
              <span className="text-xs font-bold text-white/80 w-10 text-right">
                {d.intensity}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function RoastPreferenceSection({
  promise,
}: {
  promise: ReturnType<typeof getAllRecords>;
}) {
  const records = await promise;

  const counts: Record<RoastLevel, number> = {
    LIGHT: 0, MEDIUM: 0, DARK: 0, EXTRA_DARK: 0,
  };
  for (const r of records) counts[r.roastLevel]++;
  const total = records.length || 1;

  const levels: Array<{ key: RoastLevel; label: string; color: string }> = [
    { key: 'LIGHT', label: '浅焙', color: '#FBBF24' },
    { key: 'MEDIUM', label: '中焙', color: '#F97316' },
    { key: 'DARK', label: '深焙', color: '#DC2626' },
    { key: 'EXTRA_DARK', label: '极深焙', color: '#7F1D1D' },
  ];

  const primary = levels
    .slice()
    .sort((a, b) => counts[b.key] - counts[a.key])[0];

  return (
    <div className="glass-card p-5">
      {records.length === 0 ? (
        <p className="text-center text-white/40 py-4 text-sm">暂无数据</p>
      ) : (
        <>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
                偏好烘焙度
              </p>
              <p
                className="font-display text-xl font-bold"
                style={{ color: primary.color }}
              >
                {primary.label}爱好者
              </p>
            </div>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
              style={{
                background: `radial-gradient(circle, ${hexToRgb(primary.color, 0.35)}, transparent)`,
              }}
            >
              ☕
            </div>
          </div>

          <div className="space-y-3">
            {levels.map((l) => {
              const pct = Math.round((counts[l.key] / total) * 100);
              return (
                <div key={l.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-white/70">{l.label}</span>
                    <span className="text-[10px] text-white/50">
                      {counts[l.key]} 杯 · {pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${l.color}cc, ${l.color})`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
