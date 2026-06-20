import React from 'react';
import AnalysisPanel from '@/modules/analysis/AnalysisPanel';
import PerformanceChart from '@/modules/analysis/PerformanceChart';

const AnalysisPage: React.FC = () => {
  return (
    <div className="page-enter">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-2">绩效分析</h2>
        <p className="text-text-secondary">查看您的投资组合绩效和资产配置情况</p>
      </div>

      <AnalysisPanel />
      <PerformanceChart />
    </div>
  );
};

export default AnalysisPage;
