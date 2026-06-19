import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Download, Calendar, TrendingUp, TrendingDown, Award } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { ReportData } from '@/types';
import {
  calculateReturnRate,
  calculateTypeAllocation,
  generateMonthlyTrendData,
  formatCurrency,
  formatPercentage,
} from '@/utils/calculations';

interface ReportCardProps {
  reportData: ReportData | null;
}

const ReportCard: React.FC<ReportCardProps> = ({ reportData }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!cardRef.current) return;

    setIsExporting(true);

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `投资绩效报告_${reportData?.startDate}_${reportData?.endDate}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setTimeout(() => setIsExporting(false), 600);
    }
  };

  if (!reportData) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="text-gray-400">
          <Calendar size={48} className="mx-auto mb-4" />
          <p className="text-lg">请选择时间范围生成报告</p>
        </div>
      </div>
    );
  }

  const { assets, totalValue, totalReturn, avgReturnRate, bestPerformer, worstPerformer, startDate, endDate, assetCount } = reportData;

  const trendData = generateMonthlyTrendData(assets, 6);
  const allocationData = calculateTypeAllocation(assets).filter((item) => item.value > 0);

  const COLORS = ['#4A90D9', '#50C878', '#FF6B6B'];

  return (
    <>
      <div
        ref={cardRef}
        className="bg-white rounded-2xl shadow-xl overflow-hidden animate-scale-in"
        style={{ maxWidth: '800px', margin: '0 auto' }}
      >
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <h2 className="text-2xl font-bold">投资绩效报告</h2>
          <p className="text-indigo-100 mt-1">
            {startDate} 至 {endDate}
          </p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500">资产数量</p>
              <p className="text-2xl font-bold text-gray-800">{assetCount}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500">总市值</p>
              <p className="text-2xl font-bold text-gray-800">¥{formatCurrency(totalValue)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500">总收益</p>
              <p className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalReturn >= 0 ? '+' : ''}¥{formatCurrency(totalReturn)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500">平均收益率</p>
              <p className={`text-2xl font-bold ${avgReturnRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(avgReturnRate)}
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">报告摘要</h3>
            <div className="bg-gray-50 rounded-xl p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">表现最佳</p>
                  <p className="font-medium text-gray-800">
                    {bestPerformer
                      ? `${bestPerformer.name} (${formatPercentage(calculateReturnRate(bestPerformer.buyPrice, bestPerformer.currentPrice))})`
                      : '--'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <TrendingDown className="text-red-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">表现不佳</p>
                  <p className="font-medium text-gray-800">
                    {worstPerformer
                      ? `${worstPerformer.name} (${formatPercentage(calculateReturnRate(worstPerformer.buyPrice, worstPerformer.currentPrice))})`
                      : '--'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Award className="text-purple-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">资产配置</p>
                  <p className="font-medium text-gray-800">
                    {allocationData.map((a) => `${a.label} ${a.percentage.toFixed(1)}%`).join(' · ')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3">市值趋势</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: '#6B7280', fontSize: 11 }}
                      axisLine={{ stroke: '#E5E7EB' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#6B7280', fontSize: 11 }}
                      axisLine={{ stroke: '#E5E7EB' }}
                      tickLine={false}
                      tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                    />
                    <Tooltip
                      formatter={(value: number) => [`¥${formatCurrency(value)}`, '市值']}
                      labelFormatter={(label) => `${label}`}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#7C4DFF"
                      strokeWidth={3}
                      dot={{ fill: '#7C4DFF', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3">资产配置</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {allocationData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`¥${formatCurrency(value)}`, '市值']}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend
                      formatter={(value) => <span className="text-gray-600 text-sm">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-8 py-4 text-center text-sm text-gray-400">
          投资有风险，入市需谨慎 · 本报告仅供参考
        </div>
      </div>

      {reportData && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`btn-primary flex items-center gap-2 ${isExporting ? 'animate-download' : ''}`}
          >
            <Download size={18} />
            {isExporting ? '导出中...' : '导出为图片'}
          </button>
        </div>
      )}
    </>
  );
};

export default ReportCard;
