import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Flame,
  MessageSquare,
  Share2,
  Plus,
} from 'lucide-react';
import { prisma, DEFAULT_USER_ID } from '@/lib/prisma';
import { analyzeFlavorProfile, hexToRgb, mixColors } from '@/lib/flavorAnalyzer';
import { getRecommendations } from '@/lib/recommender';
import { RadarChart } from '@/components/RadarChart';
import { FlavorTagPill } from '@/components/FlavorTagPill';
import { RatingStars } from '@/components/RatingStars';
import { RecommendList } from '@/components/RecommendList';
import type { RoastLevel } from '@prisma/client';
import type { RecommendedRecord, RecordWithTags } from '@/lib/recommender';

export const revalidate = 30;
export const dynamic = 'force-dynamic';

interface Params {
  params: { id: string };
}

const ROAST_INFO: Record<
  RoastLevel,
  { label: string; desc: string; color: string; gradient: string }
> = {
  LIGHT: {
    label: '浅度烘焙',
    desc: '保留产区特色，明亮的花果酸质',
    color: '#FBBF24',
    gradient: 'from-amber-300 to-amber-500',
  },
  MEDIUM: {
    label: '中度烘焙',
    desc: '酸甜平衡，甜感明显，层次丰富',
    color: '#F97316',
    gradient: 'from-orange-400 to-orange-600',
  },
  DARK: {
    label: '深度烘焙',
    desc: '醇厚浓郁，低酸，焦糖巧克力感',
    color: '#DC2626',
    gradient: 'from-red-500 to-red-700',
  },
  EXTRA_DARK: {
    label: '极深烘焙',
    desc: '炭烧烟熏，厚重强烈，意式经典',
    color: '#7F1D1D',
    gradient: 'from-red-800 to-gray-900',
  },
};

async function getRecordDetail(id: string) {
  const record = await prisma.record.findUnique({
    where: { id, userId: DEFAULT_USER_ID },
    include: { flavorTags: true },
  });
  return record;
}

async function getAllRecordsForRecommend() {
  return prisma.record.findMany({
    where: { userId: DEFAULT_USER_ID },
    include: { flavorTags: true },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function RecordDetailPage({ params }: Params) {
  const record = await getRecordDetail(params.id);
  if (!record) notFound();

  const allRecords = await getAllRecordsForRecommend();

  const recordForAnalyzer: RecordWithTags = {
    id: record.id,
    coffeeName: record.coffeeName,
    roastLevel: record.roastLevel,
    rating: record.rating,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    flavorTags: record.flavorTags,
  };
  const allRecordsForRec: RecordWithTags[] = allRecords.map((r) => ({
    id: r.id,
    coffeeName: r.coffeeName,
    roastLevel: r.roastLevel,
    rating: r.rating,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    flavorTags: r.flavorTags,
  }));

  const radarData = analyzeFlavorProfile([recordForAnalyzer]);
  const overallRadarData = analyzeFlavorProfile(allRecordsForRec);
  const recommendations: RecommendedRecord[] = getRecommendations(
    recordForAnalyzer,
    allRecordsForRec,
    3
  );

  const roast = ROAST_INFO[record.roastLevel];
  const mainColor = record.flavorTags[0]?.color || roast.color;
  const mixedColor = mixColors(record.flavorTags.map((t) => t.color));
  const dateStr = new Date(record.createdAt).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-create-modal'));
            }}
            className="coffee-btn-secondary text-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">再记一杯</span>
          </button>
          <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <section className="glass-card p-6 md:p-10 overflow-hidden relative">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            background: `radial-gradient(ellipse at 100% 0%, ${hexToRgb(mixedColor, 0.7)} 0%, transparent 50%),
                         radial-gradient(ellipse at 0% 100%, ${hexToRgb(roast.color, 0.5)} 0%, transparent 50%)`,
          }}
        />

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <span
                  className="roast-badge bg-gradient-to-r text-white font-bold px-3 py-1"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${roast.color}cc, ${roast.color})`,
                  }}
                >
                  <Flame className="w-3 h-3 inline mr-1" />
                  {roast.label}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
                  <CalendarIcon className="w-3 h-3" />
                  {dateStr}
                </span>
              </div>

              <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                {record.coffeeName}
              </h1>

              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/50">评分</span>
                  <RatingStars value={record.rating} readOnly size="lg" />
                </div>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  已归档
                </div>
              </div>
            </div>

            <div
              className="relative w-28 h-28 lg:w-36 lg:h-36 shrink-0 rounded-3xl overflow-hidden border-2 border-white/10"
              style={{
                background: `conic-gradient(from 90deg, ${record.flavorTags
                  .map((t) => t.color)
                  .join(', ')})`,
              }}
            >
              <div className="absolute inset-2 rounded-[20px] bg-[#1A1A2E]/80 backdrop-blur-md flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl lg:text-5xl mb-1">☕</div>
                  <div className="text-[10px] lg:text-xs text-white/60 font-medium tracking-widest uppercase">
                    TASTE
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                烘焙特征
              </h3>
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl shrink-0 bg-gradient-to-br flex items-center justify-center text-white font-bold"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${roast.color}bb, ${roast.color})`,
                  }}
                >
                  {record.roastLevel === 'LIGHT' ? '1' : record.roastLevel === 'MEDIUM' ? '2' : record.roastLevel === 'DARK' ? '3' : '4'}
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">{roast.label}</p>
                  <p className="text-xs text-white/60 leading-relaxed">{roast.desc}</p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                品鉴笔记
              </h3>
              {record.notes ? (
                <p className="text-sm text-white/80 leading-relaxed italic">
                  "{record.notes}"
                </p>
              ) : (
                <p className="text-sm text-white/40 italic">
                  这一次没有留下文字记录...
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white/80 mb-3 uppercase tracking-wider">
              风味标签
            </h3>
            <div className="flex flex-wrap gap-2">
              {record.flavorTags.length === 0 ? (
                <span className="text-sm text-white/40">未添加风味标签</span>
              ) : (
                record.flavorTags.map((tag, i) => (
                  <div
                    key={tag.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <FlavorTagPill
                      name={tag.name}
                      color={tag.color}
                      className="!px-4 !py-1.5 !text-base !font-semibold"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="glass-card p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-white mb-1">
                  本次风味雷达
                </h2>
                <p className="text-xs text-white/50">这杯咖啡的风味分布</p>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: `radial-gradient(circle, ${hexToRgb(mainColor, 0.4)}, transparent)`,
                }}
              >
                ✨
              </div>
            </div>
            <div className="h-[400px]">
              <RadarChart data={radarData} size="lg" records={allRecordsForRec} />
            </div>
          </section>

          <section>
            <Suspense fallback={<div className="h-[200px] glass-card animate-pulse" />}>
              <RecommendList
                recommendations={recommendations}
                currentRecordId={record.id}
              />
            </Suspense>
          </section>
        </div>

        <div className="space-y-8">
          <section className="glass-card p-6">
            <h3 className="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-yellow-400">📊</span>
              综合风味档案
            </h3>
            <p className="text-xs text-white/50 mb-4">
              基于你所有历史记录生成
            </p>
            <div className="h-[300px] -mx-2">
              <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="loading-ripple" /></div>}>
                <RadarChart data={overallRadarData} size="md" records={allRecordsForRec} />
              </Suspense>
            </div>
            <p className="mt-4 pt-4 border-t border-white/10 text-[11px] text-white/40 leading-relaxed">
              对比本次品尝与整体档案，观察你的味觉探索轨迹
            </p>
          </section>

          <section className="glass-card p-6">
            <h3 className="font-display text-lg font-bold text-white mb-5 flex items-center gap-2">
              <span className="text-cyan-400">💡</span>
              搭配建议
            </h3>
            <div className="space-y-3">
              {record.roastLevel === 'LIGHT' && (
                <>
                  <TipItem icon="🥐" text="可颂、黄油饼干等轻盈点心" />
                  <TipItem icon="🍋" text="适合清晨或午后，清爽解腻" />
                  <TipItem icon="🫖" text="建议手冲、冷萃，突出产区风味" />
                </>
              )}
              {record.roastLevel === 'MEDIUM' && (
                <>
                  <TipItem icon="🥧" text="水果塔、司康饼、芝士蛋糕" />
                  <TipItem icon="☀️" text="午后时光最适宜享用" />
                  <TipItem icon="☕" text="手冲、爱乐压、虹吸都很合适" />
                </>
              )}
              {record.roastLevel === 'DARK' && (
                <>
                  <TipItem icon="🍫" text="黑巧克力、布朗尼、提拉米苏" />
                  <TipItem icon="🌙" text="餐后或工作间隙，提神醒脑" />
                  <TipItem icon="⚡" text="意式浓缩、摩卡壶、法压壶" />
                </>
              )}
              {record.roastLevel === 'EXTRA_DARK' && (
                <>
                  <TipItem icon="🍮" text="焦糖布丁、烟熏杏仁" />
                  <TipItem icon="🔥" text="寒冷天气的温暖陪伴" />
                  <TipItem icon="🥛" text="加牛奶制成拿铁、卡布奇诺" />
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function TipItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
      <span className="text-xl shrink-0">{icon}</span>
      <span className="text-sm text-white/75 leading-relaxed pt-0.5">{text}</span>
    </div>
  );
}
