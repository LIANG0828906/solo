import React, { useMemo } from 'react';
import { ArrowLeft, Trophy, Flower2, CloudRain, Star, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useGardenStore } from '@/store/gardenStore';
import { RARITY_COLORS, RARITY_LABELS, SEASON_LABELS, SEASON_COLORS } from '@/types';
import type { Rarity, Season } from '@/types';

export const Report: React.FC = () => {
  const navigate = useNavigate();
  const { reportHistory, gameState, weatherEventHistory, generateWeeklyReport, isLoading } = useGardenStore();

  const latestReport = reportHistory[reportHistory.length - 1];

  const liveStats = useMemo(() => {
    const rarityDist: Record<Rarity, number> = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
    const seasonDist: Record<Season, number> = { spring: 0, summer: 0, autumn: 0, winter: 0 };
    let totalBlooming = 0;

    gameState.gardenPlots.forEach((plot) => {
      if (plot) {
        rarityDist[plot.rarity]++;
        seasonDist[plot.season]++;
        if (plot.currentStage === 'blooming' || plot.currentStage === 'seeding') {
          totalBlooming++;
        }
      }
    });

    return {
      rarityDist,
      seasonDist,
      totalBlooming,
      uniqueSpecies: gameState.collectedFlowers.length,
    };
  }, [gameState]);

  const displayReport = useMemo(() => {
    if (latestReport) {
      return {
        ...latestReport,
        isPreview: false,
      };
    }

    return {
      weekNumber: 0,
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      totalFlowers: liveStats.totalBlooming,
      uniqueSpecies: liveStats.uniqueSpecies,
      rarityDistribution: liveStats.rarityDist,
      seasonDistribution: liveStats.seasonDist,
      weatherEvents: weatherEventHistory,
      diversityScore: Math.min(100, Math.round((liveStats.uniqueSpecies / 24) * 100)),
      bloomCount: liveStats.totalBlooming,
      topFlowers: gameState.gardenPlots.filter((p): p is NonNullable<typeof p> => p !== null).slice(0, 3),
      rating: liveStats.uniqueSpecies >= 12 ? 'S' as const : liveStats.uniqueSpecies >= 8 ? 'A' as const : liveStats.uniqueSpecies >= 4 ? 'B' as const : 'C' as const,
      isPreview: true,
    };
  }, [latestReport, liveStats, weatherEventHistory, gameState.gardenPlots]);

  const rarityData = Object.entries(displayReport.rarityDistribution).map(([key, value]) => ({
    name: RARITY_LABELS[key as Rarity],
    value,
    color: RARITY_COLORS[key as Rarity],
  }));

  const seasonData = Object.entries(displayReport.seasonDistribution).map(([key, value]) => ({
    name: SEASON_LABELS[key as Season],
    value,
    fill: SEASON_COLORS[key as Season],
  }));

  const radarData = [
    { subject: '多样性', A: displayReport.diversityScore, fullMark: 100 },
    { subject: '开花数', A: Math.min(100, displayReport.bloomCount * 12.5), fullMark: 100 },
    { subject: '稀有度', A: Math.min(100, (displayReport.rarityDistribution.rare + displayReport.rarityDistribution.legendary * 2) * 20), fullMark: 100 },
    { subject: '季节均衡', A: Math.min(100, Object.values(displayReport.seasonDistribution).filter(v => v > 0).length * 25), fullMark: 100 },
    { subject: '天气触发', A: Math.min(100, displayReport.weatherEvents.length * 20), fullMark: 100 },
  ];

  const ratingColors: Record<string, string> = {
    S: 'from-amber-400 to-orange-500',
    A: 'from-emerald-400 to-teal-500',
    B: 'from-blue-400 to-indigo-500',
    C: 'from-gray-400 to-gray-500',
  };

  const weatherNames: Record<string, string> = {
    spring_rain: '🌧️ 春雨',
    summer_thunder: '⚡ 夏雷',
    autumn_wind: '🍂 秋风',
    winter_snow: '❄️ 冬雪',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <ArrowLeft size={20} className="text-[#2d5016]" />
            <span className="font-medium text-[#2d5016]">返回花园</span>
          </button>

          {displayReport.isPreview && (
            <button
              onClick={() => generateWeeklyReport()}
              disabled={isLoading || gameState.gardenPlots.every(p => p === null)}
              className="px-6 py-2 bg-gradient-to-r from-[#2d5016] to-[#4a7c23] text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '生成中...' : '生成周报'}
            </button>
          )}
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#2d5016] mb-2">
            📋 时令周报
          </h1>
          <p className="text-[#2d5016]/60">
            {displayReport.isPreview ? '实时数据预览' : `第 ${displayReport.weekNumber} 周`}
            <span className="mx-2">·</span>
            {displayReport.startDate} ~ {displayReport.endDate}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Flower2 className="text-pink-500" size={24} />
              <span className="text-gray-500 text-sm">总花卉数</span>
            </div>
            <p className="text-3xl font-bold text-[#2d5016]">{displayReport.totalFlowers}</p>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Star className="text-amber-500" size={24} />
              <span className="text-gray-500 text-sm">品种数</span>
            </div>
            <p className="text-3xl font-bold text-[#2d5016]">{displayReport.uniqueSpecies}</p>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="text-emerald-500" size={24} />
              <span className="text-gray-500 text-sm">多样性分</span>
            </div>
            <p className="text-3xl font-bold text-[#2d5016]">{displayReport.diversityScore}</p>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="text-orange-500" size={24} />
              <span className="text-gray-500 text-sm">评级</span>
            </div>
            <p className={`text-3xl font-bold bg-gradient-to-r ${ratingColors[displayReport.rating]} bg-clip-text text-transparent`}>
              {displayReport.rating}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-[#2d5016] mb-4">稀有度分布</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rarityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {rarityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-[#2d5016] mb-4">季节分布</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seasonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {seasonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-[#2d5016] mb-4">综合能力雷达图</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#d1d5db" />
                  <PolarAngleAxis dataKey="subject" stroke="#4b5563" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#9ca3af" />
                  <Radar
                    name="花园指数"
                    dataKey="A"
                    stroke="#2d5016"
                    fill="#2d5016"
                    fillOpacity={0.3}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-[#2d5016] mb-4 flex items-center gap-2">
              <CloudRain size={20} />
              天气事件记录
            </h3>
            <div className="space-y-3">
              {displayReport.weatherEvents.length > 0 ? (
                displayReport.weatherEvents.slice(-8).map((event, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl"
                  >
                    <span className="text-2xl">{weatherNames[event!]?.split(' ')[0]}</span>
                    <span className="font-medium text-[#2d5016]">
                      {weatherNames[event!]?.split(' ')[1]}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-8">暂无天气事件</p>
              )}
            </div>
          </div>
        </div>

        {displayReport.topFlowers.length > 0 && (
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg mb-8">
            <h3 className="text-lg font-bold text-[#2d5016] mb-4">🌟 本周明星花卉</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {displayReport.topFlowers.map((flower, index) => (
                <div
                  key={flower.id}
                  className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{ backgroundColor: `${flower.color}22` }}
                >
                  <span className="text-5xl">{flower.emoji}</span>
                  <div>
                    <p className="font-bold text-[#2d5016]">{flower.name}</p>
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-xs text-white"
                      style={{ backgroundColor: RARITY_COLORS[flower.rarity] }}
                    >
                      {RARITY_LABELS[flower.rarity]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {reportHistory.length > 1 && (
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-[#2d5016] mb-4">📜 历史周报</h3>
            <div className="space-y-3">
              {[...reportHistory].reverse().slice(1).map((report, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-green-50 transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-bold text-[#2d5016]">第 {report.weekNumber} 周</p>
                    <p className="text-sm text-gray-500">
                      {report.startDate} ~ {report.endDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      {report.uniqueSpecies} 种 · {report.bloomCount} 朵
                    </span>
                    <span
                      className={`text-xl font-bold bg-gradient-to-r ${ratingColors[report.rating]} bg-clip-text text-transparent`}
                    >
                      {report.rating}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
