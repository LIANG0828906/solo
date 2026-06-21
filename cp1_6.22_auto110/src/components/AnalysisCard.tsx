import React from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import type { HeatmapResult } from '@/types';

interface AnalysisCardProps {
  onGenerateHeatmap: () => void;
  isGenerating: boolean;
  heatmapResult: HeatmapResult | null;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({
  onGenerateHeatmap,
  isGenerating,
  heatmapResult,
}) => {
  return (
    <div className="card">
      <div className="card-title">
        <BarChart3 className="card-title-icon" />
        <span>阴影分析</span>
      </div>

      <button
        className="primary-btn"
        onClick={onGenerateHeatmap}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <span className="loading-spinner" />
            <span>生成中...</span>
          </>
        ) : (
          <>
            <TrendingUp className="btn-icon" />
            <span>{heatmapResult ? '重新生成热力图' : '生成阴影热力图'}</span>
          </>
        )}
      </button>

      {heatmapResult && (
        <div className="pie-chart-container">
          <div
            className="pie-chart-svg"
            dangerouslySetInnerHTML={{ __html: heatmapResult.pieSvgString }}
          />
          <div className="pie-legend">
            <div className="pie-legend-item">
              <span className="pie-legend-color" style={{ backgroundColor: '#5BC0EB' }} />
              <span>无阴影 {heatmapResult.stats.noShadowPercent.toFixed(1)}%</span>
            </div>
            <div className="pie-legend-item">
              <span className="pie-legend-color" style={{ backgroundColor: '#FFD93D' }} />
              <span>部分阴影 {heatmapResult.stats.partialShadowPercent.toFixed(1)}%</span>
            </div>
            <div className="pie-legend-item">
              <span className="pie-legend-color" style={{ backgroundColor: '#C92A2A' }} />
              <span>完全阴影 {heatmapResult.stats.fullShadowPercent.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="hint-text">点击场景中建筑查看详细日照数据</div>
    </div>
  );
};

export default AnalysisCard;
