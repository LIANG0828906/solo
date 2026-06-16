import React from 'react';
import { useStore } from '../store';
import { getSceneManager } from '../modules/scene';
import { calculateShadowCoverage, getDayName } from '../modules/solar';
import CircularProgress from './CircularProgress';

interface InfoPanelProps {
  isOpen: boolean;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ isOpen }) => {
  const {
    buildings,
    selectedBuildingId,
    selectBuilding,
    sunPosition,
    showHeatmap,
    setShowHeatmap,
    showSolarAnalysis,
    setShowSolarAnalysis,
    setSolarGridData,
    setShadowAnalyses,
    shadowAnalyses,
    totalSolarArea,
    estimatedEnergy,
    setSolarStats
  } = useStore();

  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);

  const handleShowHeatmap = () => {
    if (!selectedBuildingId) return;
    
    const sceneManager = getSceneManager();
    if (sceneManager) {
      if (showHeatmap) {
        sceneManager.clearHeatmap();
        setShowHeatmap(false);
      } else {
        sceneManager.showHeatmap(selectedBuildingId, sunPosition.dayOfYear);
        setShowHeatmap(true);
      }
    }
  };

  const handleEvaluateSolar = () => {
    if (!selectedBuildingId || !selectedBuilding) return;
    
    const sceneManager = getSceneManager();
    if (sceneManager) {
      if (showSolarAnalysis) {
        sceneManager.clearSolarAnalysis();
        setShowSolarAnalysis(false);
        setSolarGridData([]);
        setSolarStats(0, 0);
      } else {
        const result = sceneManager.evaluateSolarPotential(selectedBuildingId);
        if (result) {
          setSolarGridData(result.grids);
          setSolarStats(result.totalArea, result.estimatedEnergy);
          setShowSolarAnalysis(true);
        }
      }
    }
  };

  const calculateShadowData = React.useCallback(() => {
    if (!selectedBuilding) return;

    const morningCoverage = calculateShadowCoverage(
      selectedBuilding,
      buildings,
      8,
      sunPosition.dayOfYear
    );
    const noonCoverage = calculateShadowCoverage(
      selectedBuilding,
      buildings,
      12,
      sunPosition.dayOfYear
    );
    const afternoonCoverage = calculateShadowCoverage(
      selectedBuilding,
      buildings,
      16,
      sunPosition.dayOfYear
    );

    setShadowAnalyses([
      { buildingId: selectedBuilding.id, timeOfDay: 'morning', shadowCoverage: morningCoverage },
      { buildingId: selectedBuilding.id, timeOfDay: 'noon', shadowCoverage: noonCoverage },
      { buildingId: selectedBuilding.id, timeOfDay: 'afternoon', shadowCoverage: afternoonCoverage }
    ]);
  }, [selectedBuilding, buildings, sunPosition.dayOfYear, setShadowAnalyses]);

  React.useEffect(() => {
    if (selectedBuilding) {
      calculateShadowData();
    }
  }, [selectedBuilding, sunPosition.dayOfYear, calculateShadowData]);

  const morningAnalysis = shadowAnalyses.find(a => a.timeOfDay === 'morning');
  const noonAnalysis = shadowAnalyses.find(a => a.timeOfDay === 'noon');
  const afternoonAnalysis = shadowAnalyses.find(a => a.timeOfDay === 'afternoon');

  const handleClose = () => {
    selectBuilding(null);
    const sceneManager = getSceneManager();
    if (sceneManager) {
      sceneManager.clearHeatmap();
      sceneManager.clearSolarAnalysis();
    }
    setShowHeatmap(false);
    setShowSolarAnalysis(false);
  };

  return (
    <div className={`info-panel ${isOpen ? 'open' : ''}`}>
      <div className="panel-title">
        🏢 建筑信息分析
      </div>

      {!selectedBuilding ? (
        <div className="empty-selection">
          <div className="empty-selection-icon">👆</div>
          <div className="empty-selection-text">
            点击场景中的任意建筑<br />查看其采光分析与太阳能潜力评估
          </div>
        </div>
      ) : (
        <>
          <div className="panel-section">
            <div className="panel-section-title">基本信息</div>
            <div className="building-info">
              <div className="building-info-row">
                <span className="building-info-label">建筑高度</span>
                <span className="building-info-value">{selectedBuilding.height.toFixed(1)} 米</span>
              </div>
              <div className="building-info-row">
                <span className="building-info-label">建筑宽度</span>
                <span className="building-info-value">{selectedBuilding.width.toFixed(1)} 米</span>
              </div>
              <div className="building-info-row">
                <span className="building-info-label">建筑深度</span>
                <span className="building-info-value">{selectedBuilding.depth.toFixed(1)} 米</span>
              </div>
              <div className="building-info-row">
                <span className="building-info-label">占地面积</span>
                <span className="building-info-value">{(selectedBuilding.width * selectedBuilding.depth).toFixed(1)} ㎡</span>
              </div>
              <div className="building-info-row">
                <span className="building-info-label">分析日期</span>
                <span className="building-info-value">{getDayName(sunPosition.dayOfYear)}</span>
              </div>
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-section-title">阴影覆盖率</div>
            <div className="shadow-progress-container">
              <div className="shadow-progress-item">
                <CircularProgress value={morningAnalysis?.shadowCoverage ?? 0} />
                <span className="shadow-progress-label">上午 8:00</span>
              </div>
              <div className="shadow-progress-item">
                <CircularProgress value={noonAnalysis?.shadowCoverage ?? 0} />
                <span className="shadow-progress-label">中午 12:00</span>
              </div>
              <div className="shadow-progress-item">
                <CircularProgress value={afternoonAnalysis?.shadowCoverage ?? 0} />
                <span className="shadow-progress-label">下午 16:00</span>
              </div>
            </div>
          </div>

          <div className="panel-section">
            <button
              className={`btn ${showHeatmap ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleShowHeatmap}
            >
              {showHeatmap ? '🌡️ 隐藏全天阴影图' : '🌡️ 查看全天阴影图'}
            </button>

            <button
              className={`btn ${showSolarAnalysis ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleEvaluateSolar}
            >
              {showSolarAnalysis ? '☀️ 隐藏太阳能分析' : '☀️ 评估太阳能潜力'}
            </button>

            <button className="btn btn-secondary" onClick={handleClose}>
              ✕ 取消选择
            </button>
          </div>

          {showSolarAnalysis && (
            <div className="panel-section">
              <div className="panel-section-title">太阳能评估结果</div>
              <div className="solar-stats">
                <div className="solar-stats-row">
                  <span className="solar-stats-label">可安装面积</span>
                  <span className="solar-stats-value">{totalSolarArea.toFixed(1)} ㎡</span>
                </div>
                <div className="solar-stats-row">
                  <span className="solar-stats-label">预估年发电量</span>
                  <span className="solar-stats-value">{estimatedEnergy.toLocaleString()} kWh</span>
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: '#888', lineHeight: 1.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 12, height: 12, background: '#B8860B', borderRadius: 2 }}></span>
                  80-100分：优秀
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 12, height: 12, background: '#FFD700', borderRadius: 2 }}></span>
                  60-80分：良好
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 12, height: 12, background: '#FFFACD', borderRadius: 2 }}></span>
                  40-60分：一般
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 12, background: '#808080', borderRadius: 2 }}></span>
                  低于40分：较差
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InfoPanel;
