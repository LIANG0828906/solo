import React from 'react';
import type { ForestStatistics } from '../ecosystem/ecosystemEngine';
import { SPECIES_LIST, getSpeciesById } from '../ecosystem/speciesConfig';

interface SpeciesInfoProps {
  statistics: ForestStatistics;
}

export const SpeciesInfo: React.FC<SpeciesInfoProps> = ({ statistics }) => {
  const { totalCount, speciesCount, averageHeight, dominantSpecies } = statistics;

  return (
    <div className="species-info-panel">
      <h3 className="panel-subtitle">森林统计</h3>

      <div className="stat-row">
        <span className="stat-label">树木总数</span>
        <span className="stat-value">{totalCount} 棵</span>
      </div>

      <div className="stat-row">
        <span className="stat-label">平均高度</span>
        <span className="stat-value">{averageHeight.toFixed(1)} 米</span>
      </div>

      <div className="divider" />

      <h3 className="panel-subtitle">树种分布</h3>

      <div className="species-list">
        {SPECIES_LIST.map((species) => {
          const count = speciesCount[species.id] || 0;
          const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
          const isDominant = species.id === dominantSpecies;

          return (
            <div
              key={species.id}
              className={`species-item ${isDominant ? 'dominant' : ''}`}
            >
              <div className="species-header">
                <span
                  className="species-color-dot"
                  style={{ backgroundColor: species.canopyColor }}
                />
                <span className="species-name">{species.name}</span>
                {isDominant && <span className="dominant-badge">优势</span>}
              </div>
              <div className="species-stats">
                <span>{count} 棵</span>
                <span>{percentage.toFixed(1)}%</span>
              </div>
              <div className="species-bar-bg">
                <div
                  className="species-bar-fill"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: species.canopyColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SpeciesInfo;
