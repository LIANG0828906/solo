import React, { useState, useMemo } from 'react';
import { CalendarRange, FileText } from 'lucide-react';
import type { ReportData } from '@/types';
import { useAssetStore } from '../asset/assetStore';
import {
  calculateTotalMarketValue,
  calculateTotalPortfolioReturn,
  calculateAvgReturnRate,
  getTopPerformer,
  getWorstPerformer,
  getDateRange,
  filterAssetsByDateRange,
} from '@/utils/calculations';
import ReportCard from './ReportCard';

const ReportGenerator: React.FC = () => {
  const { assets } = useAssetStore();
  const [period, setPeriod] = useState<'month' | 'quarter'>('month');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const { start, end } = useMemo(() => getDateRange(period), [period]);

  const generateReport = () => {
    const filteredAssets = filterAssetsByDateRange(assets, start, end);

    if (filteredAssets.length === 0) {
      setReportData({
        period,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        assets: [],
        totalValue: 0,
        totalReturn: 0,
        avgReturnRate: 0,
        bestPerformer: null,
        worstPerformer: null,
        assetCount: 0,
      });
      setHasGenerated(true);
      return;
    }

    const totalValue = calculateTotalMarketValue(filteredAssets);
    const totalReturn = calculateTotalPortfolioReturn(filteredAssets);
    const avgReturnRate = calculateAvgReturnRate(filteredAssets);
    const bestPerformer = getTopPerformer(filteredAssets);
    const worstPerformer = getWorstPerformer(filteredAssets);

    setReportData({
      period,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      assets: filteredAssets,
      totalValue,
      totalReturn,
      avgReturnRate,
      bestPerformer,
      worstPerformer,
      assetCount: filteredAssets.length,
    });
    setHasGenerated(true);
  };

  return (
    <div className="page-enter">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-2">报告生成</h2>
        <p className="text-text-secondary">选择时间范围，生成绩效分析报告</p>
      </div>

      <div className="card p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              时间范围
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setPeriod('month')}
                className={`flex-1 md:flex-none px-6 py-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                  period === 'month'
                    ? 'border-accent bg-accent/20 text-accent'
                    : 'border-bg-tertiary text-text-secondary hover:border-accent/50'
                }`}
              >
                <CalendarRange size={18} />
                近一个月
              </button>
              <button
                onClick={() => setPeriod('quarter')}
                className={`flex-1 md:flex-none px-6 py-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                  period === 'quarter'
                    ? 'border-accent bg-accent/20 text-accent'
                    : 'border-bg-tertiary text-text-secondary hover:border-accent/50'
                }`}
              >
                <CalendarRange size={18} />
                近三个月
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="text-text-secondary text-sm">
              <p>报告范围：{start.toISOString().split('T')[0]} ~ {end.toISOString().split('T')[0]}</p>
              <p>符合条件资产：{filterAssetsByDateRange(assets, start, end).length} 项</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={generateReport}
            className="btn-primary flex items-center gap-2"
          >
            <FileText size={18} />
            生成报告
          </button>
        </div>
      </div>

      {!hasGenerated && assets.length > 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="text-accent" size={36} />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">等待生成报告</h3>
          <p className="text-text-secondary">选择时间范围后点击"生成报告"按钮</p>
        </div>
      )}

      {hasGenerated && <ReportCard reportData={reportData} />}
    </div>
  );
};

export default ReportGenerator;
