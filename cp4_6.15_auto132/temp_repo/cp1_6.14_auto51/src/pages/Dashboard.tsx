import { useState, useEffect } from 'react';
import {
  BarChart3,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import TrendChart from '@/components/TrendChart';
import Layout from '@/components/Layout';
import { dashboardApi, engagementApi } from '@/services/api';
import type { DashboardStats, EngagementData, Platform } from '@/types';
import { PLATFORM_COLORS, PLATFORM_NAMES } from '@/types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    weeklyPosts: 0,
    totalEngagement: 0,
    pendingDrafts: 0,
  });
  const [engagementData, setEngagementData] = useState<EngagementData[]>([]);
  const [expandedPlatform, setExpandedPlatform] = useState<Platform | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, engagementRes] = await Promise.all([
        dashboardApi.getStats(),
        engagementApi.getEngagement(),
      ]);
      setStats(statsRes);
      setEngagementData(engagementRes);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (platform: Platform) => {
    setExpandedPlatform(expandedPlatform === platform ? null : platform);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据仪表盘</h1>
          <p className="text-gray-500 mt-1">查看您的内容发布表现与互动数据分析</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="本周发布数"
            value={stats.weeklyPosts}
            icon={<FileText />}
            color="blue"
          />
          <StatCard
            title="总互动量"
            value={stats.totalEngagement}
            icon={<Heart />}
            color="pink"
          />
          <StatCard
            title="待发布草稿"
            value={stats.pendingDrafts}
            icon={<TrendingUp />}
            color="green"
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">各平台互动数据</h2>
              <p className="text-sm text-gray-500 mt-1">点击行查看详细趋势</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <BarChart3 size={16} />
              <span>过去7天</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">平台</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                    <div className="flex items-center justify-end gap-1">
                      <Heart size={14} /> 点赞数
                    </div>
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                    <div className="flex items-center justify-end gap-1">
                      <MessageCircle size={14} /> 评论数
                    </div>
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                    <div className="flex items-center justify-end gap-1">
                      <Share2 size={14} /> 分享数
                    </div>
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                    平均互动率
                  </th>
                  <th className="w-10 py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {engagementData.map((item, index) => (
                  <>
                    <tr
                      key={item.platform}
                      className={`border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                      onClick={() => toggleExpand(item.platform)}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: PLATFORM_COLORS[item.platform] }}
                          />
                          <span className="font-medium text-gray-900">
                            {PLATFORM_NAMES[item.platform]}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right text-gray-700 font-medium">
                        {item.likes.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right text-gray-700 font-medium">
                        {item.comments.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right text-gray-700 font-medium">
                        {item.shares.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                          {item.avgEngagementRate.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-center text-gray-400">
                          {expandedPlatform === item.platform ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedPlatform === item.platform && (
                      <tr key={`${item.platform}-chart`}>
                        <td colSpan={6} className="py-4 px-4 bg-gray-50">
                          <div
                            style={{
                              animation: 'fadeIn 0.3s ease',
                            }}
                          >
                            <TrendChart platform={item.platform} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Layout>
  );
}
